import { describe, expect, it } from "vitest"
import bcrypt from "bcryptjs"
import { prisma } from "@/app/_lib/prisma"
import { signUp } from "@/app/_actions/sign-up"
import { requestPasswordReset } from "@/app/_actions/request-password-reset"
import { verifyResetCode } from "@/app/_actions/verify-reset-code"
import { resetPassword } from "@/app/_actions/reset-password"
import { checkLoginAttempt } from "@/app/_actions/check-login-attempt"
import { createUser } from "./helpers/factories"
import { getSentEmails, sendEmailMock } from "./helpers/email"

// Account actions that touch no shop data: sign-up, password reset and the
// login lockout.

const STRONG = "Senha@123"
const NEW_STRONG = "Nova@4567"

const createUserWithPassword = async (email: string, password = STRONG) => {
  const user = await createUser({ email })
  return prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, 4) },
  })
}

const lastResetCode = (email: string) =>
  prisma.passwordResetCode.findFirstOrThrow({
    where: { email, usedAt: null },
    orderBy: { createdAt: "desc" },
  })

describe("signUp", () => {
  it("creates a client account with a hashed password and no membership", async () => {
    await signUp({
      name: "Novo Cliente",
      email: "novo@test.local",
      password: STRONG,
      acceptTerms: true,
    })

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "novo@test.local" },
      include: { memberships: true },
    })
    expect(user.password).not.toBe(STRONG)
    expect(await bcrypt.compare(STRONG, user.password!)).toBe(true)
    expect(user.acceptedTermsAt).not.toBeNull()
    expect(user.isPlatformAdmin).toBe(false)
    expect(user.memberships).toEqual([])
  })

  it("rejects an existing email without changing that account", async () => {
    const existing = await createUserWithPassword("dono@test.local")

    await expect(
      signUp({
        name: "Invasor",
        email: "dono@test.local",
        password: NEW_STRONG,
        acceptTerms: true,
      }),
    ).rejects.toThrow("Já existe uma conta com esse email.")

    const after = await prisma.user.findUniqueOrThrow({
      where: { id: existing.id },
    })
    expect(after.name).toBe(existing.name)
    expect(after.password).toBe(existing.password)
  })

  it("rejects a weak password and unaccepted terms", async () => {
    await expect(
      signUp({
        name: "Fraco",
        email: "fraco@test.local",
        password: "123456",
        acceptTerms: true,
      }),
    ).rejects.toThrow()
    await expect(
      signUp({
        name: "Sem Termos",
        email: "termos@test.local",
        password: STRONG,
        acceptTerms: false,
      }),
    ).rejects.toThrow("Você precisa aceitar a política de privacidade.")

    expect(await prisma.user.count()).toBe(0)
  })
})

describe("password reset", () => {
  it("emails a code and resets the password, lifting a lockout", async () => {
    const user = await createUserWithPassword("reset@test.local")
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 60_000),
      },
    })

    await requestPasswordReset({ email: "reset@test.local" })

    const { code } = await lastResetCode("reset@test.local")
    const [email] = getSentEmails()
    expect(email.to).toBe("reset@test.local")
    expect(email.html).toContain(code)

    await verifyResetCode({ email: "reset@test.local", code })
    await resetPassword({
      email: "reset@test.local",
      code,
      newPassword: NEW_STRONG,
      confirmNewPassword: NEW_STRONG,
    })

    const after = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    })
    expect(await bcrypt.compare(NEW_STRONG, after.password!)).toBe(true)
    expect(after.failedLoginAttempts).toBe(0)
    expect(after.lockedUntil).toBeNull()

    // The code is single-use
    await expect(
      resetPassword({
        email: "reset@test.local",
        code,
        newPassword: STRONG,
        confirmNewPassword: STRONG,
      }),
    ).rejects.toThrow("Código inválido.")
  })

  it("stays silent for an unknown email", async () => {
    await requestPasswordReset({ email: "ninguem@test.local" })

    expect(sendEmailMock()).not.toHaveBeenCalled()
    expect(await prisma.passwordResetCode.count()).toBe(0)
  })

  it("keeps only the newest code valid", async () => {
    await createUserWithPassword("dois@test.local")

    await requestPasswordReset({ email: "dois@test.local" })
    const first = await lastResetCode("dois@test.local")
    await requestPasswordReset({ email: "dois@test.local" })
    const second = await lastResetCode("dois@test.local")

    expect(second.id).not.toBe(first.id)
    const firstAfter = await prisma.passwordResetCode.findUniqueOrThrow({
      where: { id: first.id },
    })
    expect(firstAfter.usedAt).not.toBeNull()
    if (first.code !== second.code) {
      await expect(
        verifyResetCode({ email: "dois@test.local", code: first.code }),
      ).rejects.toThrow("Código inválido.")
    }
  })

  it("burns the code after 5 wrong guesses", async () => {
    await createUserWithPassword("chute@test.local")
    await requestPasswordReset({ email: "chute@test.local" })
    const { code } = await lastResetCode("chute@test.local")
    const wrong = code === "000000" ? "111111" : "000000"

    for (let i = 0; i < 4; i++) {
      await expect(
        verifyResetCode({ email: "chute@test.local", code: wrong }),
      ).rejects.toThrow("Código inválido.")
    }
    await expect(
      verifyResetCode({ email: "chute@test.local", code: wrong }),
    ).rejects.toThrow("Muitas tentativas. Solicite um novo código.")

    // Even the right code no longer works
    await expect(
      verifyResetCode({ email: "chute@test.local", code }),
    ).rejects.toThrow("Código inválido.")
  })

  it("rejects an expired code", async () => {
    await createUserWithPassword("velho@test.local")
    await requestPasswordReset({ email: "velho@test.local" })
    const resetCode = await lastResetCode("velho@test.local")
    await prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })

    await expect(
      verifyResetCode({ email: "velho@test.local", code: resetCode.code }),
    ).rejects.toThrow("Código expirado. Solicite um novo.")
  })
})

describe("checkLoginAttempt", () => {
  it("accepts the right password and resets the counter", async () => {
    const user = await createUserWithPassword("login@test.local")
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 3 },
    })

    expect(await checkLoginAttempt("login@test.local", STRONG)).toEqual({
      status: "ok",
    })
    const after = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    })
    expect(after.failedLoginAttempts).toBe(0)
  })

  it("locks the account for 10 minutes after 5 wrong passwords", async () => {
    await createUserWithPassword("trava@test.local")

    for (let i = 0; i < 4; i++) {
      expect(await checkLoginAttempt("trava@test.local", "Errada@1")).toEqual({
        status: "invalid",
      })
    }
    const locked = await checkLoginAttempt("trava@test.local", "Errada@1")
    expect(locked.status).toBe("locked")

    const lockedUntil = new Date(
      (locked as { lockedUntil: string }).lockedUntil,
    )
    const minutes = (lockedUntil.getTime() - Date.now()) / 60_000
    expect(minutes).toBeGreaterThan(9)
    expect(minutes).toBeLessThanOrEqual(10)

    // While locked, even the right password is refused
    expect((await checkLoginAttempt("trava@test.local", STRONG)).status).toBe(
      "locked",
    )
  })

  it("treats an unknown email and a Google-only account as invalid", async () => {
    await createUser({ email: "google@test.local" })

    expect(await checkLoginAttempt("ninguem@test.local", STRONG)).toEqual({
      status: "invalid",
    })
    expect(await checkLoginAttempt("google@test.local", STRONG)).toEqual({
      status: "invalid",
    })
  })
})
