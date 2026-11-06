const COOKIE_NOTICE_KEY = "cookie-notice-dismissed"

// The site only sets essential cookies (the login session), which need no
// consent, so this is a notice with nothing to accept or refuse. A blocked
// localStorage just means the notice shows again.
export const isCookieNoticeDismissed = () => {
  try {
    return localStorage.getItem(COOKIE_NOTICE_KEY) === "true"
  } catch {
    return false
  }
}

export const dismissCookieNotice = () => {
  try {
    localStorage.setItem(COOKIE_NOTICE_KEY, "true")
  } catch {
    // Nothing to remember it in
  }
}
