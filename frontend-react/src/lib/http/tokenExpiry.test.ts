import { describe, expect, it } from 'vitest'

import { getTokenExpiryMs, isTokenExpired } from './tokenExpiry.ts'

function jwt(exp: unknown): string {
  const b64 = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'none' })}.${b64({ exp })}.sig`
}

const nowSeconds = () => Math.floor(Date.now() / 1000)

describe('tokenExpiry (JWT exp decode)', () => {
  it('reads exp as milliseconds', () => {
    const exp = nowSeconds() + 3600
    expect(getTokenExpiryMs(jwt(exp))).toBe(exp * 1000)
  })

  it('reports a past exp as expired', () => {
    expect(isTokenExpired(jwt(nowSeconds() - 60))).toBe(true)
  })

  it('reports a future exp as valid', () => {
    expect(isTokenExpired(jwt(nowSeconds() + 3600))).toBe(false)
  })

  it('applies clock-skew tolerance', () => {
    const soon = jwt(nowSeconds() + 10)
    expect(isTokenExpired(soon)).toBe(true)
    expect(isTokenExpired(soon, 0)).toBe(false)
  })

  it('fails open for opaque or malformed tokens', () => {
    for (const bad of ['expired-token', 'a.b', 'a.b.c.d', '', '...']) {
      expect(getTokenExpiryMs(bad)).toBeNull()
      expect(isTokenExpired(bad)).toBe(false)
    }
  })

  it('fails open when exp is missing or non-numeric', () => {
    expect(getTokenExpiryMs(jwt(undefined))).toBeNull()
    expect(isTokenExpired(jwt('soon'))).toBe(false)
  })
})
