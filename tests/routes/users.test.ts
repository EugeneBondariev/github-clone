import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const { mockFindMany, mockFindUnique, mockDelete } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('../../generated/prisma/client', () => ({
  PrismaClient: class {
    user = { findMany: mockFindMany, findUnique: mockFindUnique, delete: mockDelete }
    repository = {}
  },
}))

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {},
}))

import app from '../../app'

const SECRET = 'test-secret'
const token = (userId: number) => jwt.sign({ userId }, SECRET)

beforeEach(() => {
  vi.clearAllMocks()
  process.env.JWT_SECRET = SECRET
})

describe('GET /users', () => {
  it('returns list of users', async () => {
    mockFindMany.mockResolvedValue([
      { id: 1, name: 'Alice', email: 'alice@example.com', createdAt: new Date() },
    ])
    const res = await request(app).get('/users')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('GET /users/:id', () => {
  it('returns user when found', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      createdAt: new Date(),
    })
    const res = await request(app).get('/users/1')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Alice')
  })

  it('returns 404 when not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await request(app).get('/users/999')
    expect(res.status).toBe(404)
  })
})

describe('GET /users/:id/repos', () => {
  it('returns repos for a user', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      createdAt: new Date(),
      repositories: [{ id: 1, name: 'my-repo' }],
    })
    const res = await request(app).get('/users/1/repos')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('returns 404 when user not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await request(app).get('/users/999/repos')
    expect(res.status).toBe(404)
  })
})

describe('DELETE /users/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).delete('/users/1')
    expect(res.status).toBe(401)
  })

  it('returns 403 when deleting another user', async () => {
    const res = await request(app)
      .delete('/users/2')
      .set('Authorization', `Bearer ${token(1)}`)
    expect(res.status).toBe(403)
  })

  it('deletes own account', async () => {
    mockDelete.mockResolvedValue({})
    const res = await request(app)
      .delete('/users/1')
      .set('Authorization', `Bearer ${token(1)}`)
    expect(res.status).toBe(204)
  })
})
