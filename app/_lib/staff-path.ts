// The staff dashboard of any shop: /b/<slug>/staff (optional trailing slash).
// Used by proxy.ts; the page itself checks the membership.
// TODO(Phase 4c): the employee allowlist goes away with the proxy rewrite
const STAFF_DASHBOARD_PATH = /^\/b\/[^/]+\/staff\/?$/

export const isStaffDashboardPath = (pathname: string) =>
  STAFF_DASHBOARD_PATH.test(pathname)
