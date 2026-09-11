const FALLBACK_API_URL = 'http://localhost:8080/api/v1'

function resolveApiUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim()

  if (!raw) {
    if (import.meta.env.DEV) {
      console.warn(
        `[config] VITE_API_URL is not set; falling back to ${FALLBACK_API_URL}`,
      )
    }
    return FALLBACK_API_URL
  }

  if (!/^https?:\/\//.test(raw)) {
    throw new Error(
      '[config] VITE_API_URL must start with http:// or https://',
    )
  }

  return raw.replace(/\/+$/, '')
}

export const config = {
  apiUrl: resolveApiUrl(),
} as const
