import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

const { mockCreate, mockFindUnique, PrismaKnownError } = vi.hoisted(() => {
  class PrismaKnownError extends Error {
    code: string
    constructor(code: string) {
      super('Prisma error')
      this.code = code
    }
  }
  return { mockCreate: vi.fn(), mockFindUnique: vi.fn(), PrismaKnownError }
})

vi.mock('../../generated/prisma/client', () => ({
  PrismaClient: class {
    user = { create: mockCreate, findUnique: mockFindUnique }
    repository = {}
  },
  Prisma: { PrismaClientKnownRequestError: PrismaKnownError },
}))

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {},
}))

import app from '../../app'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.JWT_SECRET = 'test-secret'
})

describe('POST /auth/register', () => {
  it('creates a user and returns it without password', async () => {
    mockCreate.mockResolvedValue({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      createdAt: new Date(),
    })

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'secret123' })

    expect(res.status).toBe(201)
    expect(res.body.email).toBe('alice@example.com')
    expect(res.body.password).toBeUndefined()
  })

  it('returns 409 for duplicate email', async () => {
    mockCreate.mockRejectedValue(new PrismaKnownError('P2002'))

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'secret123' })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('email already in use')
  })
})

describe('POST /auth/login', () => {
  it('returns a token for valid credentials', async () => {
    const bcrypt = await import('bcrypt')
    const hashed = await bcrypt.hash('secret123', 10)
    mockFindUnique.mockResolvedValue({ id: 1, email: 'alice@example.com', password: hashed })

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'secret123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('returns 401 for wrong password', async () => {
    const bcrypt = await import('bcrypt')
    const hashed = await bcrypt.hash('correct', 10)
    mockFindUnique.mockResolvedValue({ id: 1, email: 'alice@example.com', password: hashed })

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'wrong' })

    expect(res.status).toBe(401)
  })

  it('returns 401 for unknown email', async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'secret' })

    expect(res.status).toBe(401)
  })
})
