/**
 * Tab-scoped session hint — a boolean flag answering "has this tab seen an
 * authenticated session?", used to avoid refresh calls when no session can
 * exist (fresh Login page → no ERR_CONNECTION_REFUSED noise).
 *
 * This is NOT token persistence: the flag carries no credential, only session
 * likelihood. Access Token stays memory-only; Refresh Token stays an HttpOnly
 * cookie never read via JS. sessionStorage is tab-scoped (cleared with the
 * tab); falls back to module memory when storage is unavailable.
 */

const KEY = 'pms.hasSession'

let memoryFallback = false

function storage(): Storage | null {
  try {
    if (typeof sessionStorage !== 'undefined') return sessionStorage
  } catch {
    // Private mode / non-browser — use memory fallback below.
  }
  return null
}

/** True when this tab has an authenticated session hint. */
export function hasSessionHint(): boolean {
  const store = storage()
  if (!store) return memoryFallback
  try {
    return store.getItem(KEY) === '1'
  } catch {
    return memoryFallback
  }
}

/** Record that an authenticated session exists (login / refresh success). */
export function setSessionHint(): void {
  const store = storage()
  if (!store) {
    memoryFallback = true
    return
  }
  try {
    store.setItem(KEY, '1')
  } catch {
    memoryFallback = true
  }
}

/** Drop the session hint (logout / refresh rejection / session expiry). */
export function clearSessionHint(): void {
  const store = storage()
  if (!store) {
    memoryFallback = false
    return
  }
  try {
    store.removeItem(KEY)
  } catch {
    memoryFallback = false
  }
}
