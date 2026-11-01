import { unstable_rethrow } from "next/navigation"

// Mutation Server Actions return an ActionResult instead of throwing. In
// production Next replaces the message of any error thrown by a Server Action
// with a generic English text, so a thrown pt-BR message never reaches the
// toast. Returning the message as data keeps it.
export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string }

// An error whose message is written for the user (pt-BR) and is safe to show.
// Any other error is logged and replaced by GENERIC_ACTION_ERROR.
export class ActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ActionError"
  }
}

export const GENERIC_ACTION_ERROR = "Algo deu errado. Tente novamente."

// Wraps a mutation: `export const createX = action(async (...) => { ... })`.
// Throw ActionError inside for expected failures. redirect() and notFound()
// still propagate.
export const action =
  <A extends unknown[], T>(fn: (...args: A) => Promise<T>) =>
  async (...args: A): Promise<ActionResult<T>> => {
    try {
      return { ok: true, data: await fn(...args) }
    } catch (error) {
      unstable_rethrow(error)
      if (error instanceof ActionError) {
        return { ok: false, error: error.message }
      }
      console.error(error)
      return { ok: false, error: GENERIC_ACTION_ERROR }
    }
  }

// Client side: turns a failed result back into a thrown Error carrying the
// pt-BR message, so callers keep their try/catch + toast.error flow.
export const unwrap = async <T>(
  result: ActionResult<T> | Promise<ActionResult<T>>,
): Promise<T> => {
  const resolved = await result
  if (!resolved.ok) throw new Error(resolved.error)
  return resolved.data
}
