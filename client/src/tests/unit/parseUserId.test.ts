import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseUserId } from '../../hooks/AuthContext'

function fakeJwt(payload: object): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

describe('parseUserId', () => {
  it('extracts userId from a valid token', () => {
    expect(parseUserId(fakeJwt({ userId: 42 }))).toBe(42)
  })

  it('returns null when userId is absent from payload', () => {
    expect(parseUserId(fakeJwt({ email: 'alice@example.com' }))).toBeNull()
  })

  it('returns null for a malformed token', () => {
    expect(parseUserId('not-a-jwt')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(parseUserId('')).toBeNull()
  })

  it('returns null for an expired token', () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 1
    expect(parseUserId(fakeJwt({ userId: 42, exp: expiredExp }))).toBeNull()
  })

  it('extracts userId from a token that has not yet expired', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    expect(parseUserId(fakeJwt({ userId: 42, exp: futureExp }))).toBe(42)
  })
})
