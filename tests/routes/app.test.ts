import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../app'

describe('GET /', () => {
  it('returns app name and version', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('github-clone')
    expect(res.body.version).toBeDefined()
  })
})

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent-route')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('not found')
  })
})
