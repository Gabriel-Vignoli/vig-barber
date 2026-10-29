---
name: saas-phase
description: Run the next (or a given) phase of the Vig Barber multi-tenant SaaS migration. Usage `/saas-phase` or `/saas-phase 4a`. Delegates to the phase-implementer agent, reviews with tenant-guard, then ticks the checklist in docs/multi-tenant-plan.md.
---

# /saas-phase

Drives one phase of `docs/multi-tenant-plan.md`.

## Steps
1. **Pick the phase.** Use the argument if given; otherwise the first unticked item in the plan's `## Status` list. Refuse if an earlier phase is unticked.
2. **Preflight.** `git status` must be clean (apart from `.claude/` changes the user knows about). If not, ask the user.
3. **Destructive steps.** If the phase includes a DB reset or migration against Supabase (Phase 1, 4c), ask the user for confirmation before delegating, and pass the answer to the implementer.
4. **Implement.** Launch the `phase-implementer` agent with: the phase id, the user's confirmations, and any notes from earlier phases.
5. **Review.** Launch the `tenant-guard` agent on the commits the implementer made (`git diff <start>..HEAD`).
6. **Fix loop.** If tenant-guard reports BLOCKERs, send them back to the implementer (continue the same agent) and review again. Maximum 3 rounds, then report to the user.
7. **Verify.** Run `npm run lint`, `npm run build` and `npm run test` (if present) yourself.
8. **Show it.** Make sure the dev server is running and open the affected pages in the browser so the user sees the real change.
9. **Commit part by part, with approval.** For each logical part, show the user the files and the proposed commit message and ask for confirmation (AskUserQuestion) before running `git commit`. Never commit unapproved. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
10. **Close.** Tick the phase in `docs/multi-tenant-plan.md`, update `CLAUDE.md` if routes, models or conventions changed, and propose `docs(tenant): complete phase <n>` for approval too.

## Cheat-sheet (patterns from the plan)
```ts
// page / layout
const { slug } = await params
const { shop } = await requireShopRole(slug, ["ADMIN"])

// server action
export const updateService = async (slug: string, input: ServiceFormValues) => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) throw new Error("Dados inválidos.")
  const { count } = await prisma.barbershopService.updateMany({
    where: { id: parsed.data.id, barbershopId: shop.id },
    data: { ... },
  })
  if (count === 0) throw new Error("Serviço não encontrado.")
  revalidateShop(shop)
}

// tenant-scoped cache
const getServices = (shopId: string) =>
  unstable_cache(
    () => prisma.barbershopService.findMany({ where: { barbershopId: shopId } }),
    ["services", shopId],
    { tags: [shopTag(shopId)], revalidate: 3600 },
  )()
```
