"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "../_lib/prisma"
import { requireAdmin } from "../_lib/require-admin"

export const deleteAtendente = async (userId: string) => {
  await requireAdmin()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  // never let this action delete anyone who isn't an atendente
  if (!user || user.role !== "ATENDENTE") {
    throw new Error("Atendente não encontrado.")
  }

  try {
    // Employee, accounts and sessions are removed by onDelete: Cascade
    await prisma.user.delete({ where: { id: userId } })
  } catch {
    throw new Error("Não foi possível remover este atendente.")
  }

  revalidatePath("/admin/employees")
}
