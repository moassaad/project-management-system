/**
 * Access Token expiry detection — decodes the JWT `exp` claim without any
 * library (no secret needed, signature never verified client-side; the
 * backend remains authoritative). The Refresh cookie is never touched here.
 *
 * Undecodable/opaque tokens are treated as NOT expired (fail-open): they are
 * sent normally and the reactive 401 → refresh path remains the safety net.
 * Only provably-expired JWTs trigger proactive refresh before requests.
 */

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(padded)
}

/** Milliseconds since epoch from the JWT `exp` claim, or null if unreadable. */
export function getTokenExpiryMs(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { exp?: unknown }
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp)
      ? payload.exp * 1000
      : null
  } catch {
    return null
  }
}

/**
 * True only when the token is a decodable JWT whose `exp` is past
 * (minus `skewMs` clock skew tolerance, default 30s).
 */
export function isTokenExpired(token: string, skewMs = 30_000): boolean {
  const expiryMs = getTokenExpiryMs(token)
  if (expiryMs === null) return false
  return Date.now() >= expiryMs - skewMs
}
