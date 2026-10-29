// Sentinel errors thrown by the mocked next/navigation helpers

export class RedirectError extends Error {
  constructor(public readonly url: string) {
    super(`NEXT_REDIRECT: ${url}`)
    this.name = "RedirectError"
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND")
    this.name = "NotFoundError"
  }
}
