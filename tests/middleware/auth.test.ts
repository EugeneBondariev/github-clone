import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'

import app from '../../app'

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret'
})

describe('requireAuth middleware', () => {
  it('returns 401 with no authorization header', async () => {
    const res = await request(app).delete('/users/1')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('missing token')
  })

  it('returns 401 with malformed token', async () => {
    const res = await request(app).delete('/users/1').set('Authorization', 'Bearer not-a-valid-jwt')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('invalid token')
  })

  it('returns 401 when Bearer prefix is missing', async () => {
    const res = await request(app).delete('/users/1').set('Authorization', 'token-without-bearer')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('missing token')
  })
})
