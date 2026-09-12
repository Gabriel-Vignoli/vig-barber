export const COOKIE_CONSENT_KEY = "cookie-consent"

export type CookieConsentValue = "accepted" | "rejected"

export const getCookieConsent = (): CookieConsentValue | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsentValue | null
}

export const setCookieConsent = (value: CookieConsentValue) => {
  localStorage.setItem(COOKIE_CONSENT_KEY, value)
}
