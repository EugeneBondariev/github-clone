import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const { mockFindMany, mockFindUnique, mockCreate, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('../../generated/prisma/client', () => ({
  PrismaClient: class {
    user = {}
    repository = {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    }
  },
}))

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {},
}))

import app from '../../app'

const SECRET = 'test-secret'
const token = (userId: number) => jwt.sign({ userId }, SECRET)

const repo = {
  id: 1,
  name: 'my-repo',
  description: null,
  ownerId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: { id: 1, name: 'Alice' },
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.JWT_SECRET = SECRET
})

describe('GET /repos', () => {
  it('returns list of repos', async () => {
    mockFindMany.mockResolvedValue([repo])
    const res = await request(app).get('/repos')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('GET /repos/:id', () => {
  it('returns repo when found', async () => {
    mockFindUnique.mockResolvedValue(repo)
    const res = await request(app).get('/repos/1')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('my-repo')
  })

  it('returns 404 when not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await request(app).get('/repos/999')
    expect(res.status).toBe(404)
  })
})

describe('POST /repos', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/repos').send({ name: 'test' })
    expect(res.status).toBe(401)
  })

  it('creates a repo owned by the authenticated user', async () => {
    mockCreate.mockResolvedValue(repo)
    const res = await request(app)
      .post('/repos')
      .set('Authorization', `Bearer ${token(1)}`)
      .send({ name: 'my-repo' })
    expect(res.status).toBe(201)
    expect(res.body.ownerId).toBe(1)
  })
})

describe('PATCH /repos/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).patch('/repos/1').send({ description: 'updated' })
    expect(res.status).toBe(401)
  })

  it('returns 404 when repo not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .patch('/repos/999')
      .set('Authorization', `Bearer ${token(1)}`)
      .send({ description: 'updated' })
    expect(res.status).toBe(404)
  })

  it('returns 403 when not the owner', async () => {
    mockFindUnique.mockResolvedValue({ ...repo, ownerId: 2 })
    const res = await request(app)
      .patch('/repos/1')
      .set('Authorization', `Bearer ${token(1)}`)
      .send({ description: 'updated' })
    expect(res.status).toBe(403)
  })

  it('updates repo when owner', async () => {
    mockFindUnique.mockResolvedValue(repo)
    mockUpdate.mockResolvedValue({ ...repo, description: 'updated' })
    const res = await request(app)
      .patch('/repos/1')
      .set('Authorization', `Bearer ${token(1)}`)
      .send({ description: 'updated' })
    expect(res.status).toBe(200)
    expect(res.body.description).toBe('updated')
  })
})

describe('DELETE /repos/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).delete('/repos/1')
    expect(res.status).toBe(401)
  })

  it('returns 404 when repo not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .delete('/repos/999')
      .set('Authorization', `Bearer ${token(1)}`)
    expect(res.status).toBe(404)
  })

  it('returns 403 when not the owner', async () => {
    mockFindUnique.mockResolvedValue({ ...repo, ownerId: 2 })
    const res = await request(app)
      .delete('/repos/1')
      .set('Authorization', `Bearer ${token(1)}`)
    expect(res.status).toBe(403)
  })

  it('deletes repo when owner', async () => {
    mockFindUnique.mockResolvedValue(repo)
    mockDelete.mockResolvedValue({})
    const res = await request(app)
      .delete('/repos/1')
      .set('Authorization', `Bearer ${token(1)}`)
    expect(res.status).toBe(204)
  })
})
