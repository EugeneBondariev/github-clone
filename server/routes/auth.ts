import express, { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma } from '../generated/prisma/client'

const router = express.Router()
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const SALT_ROUNDS = 10

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

function validatePassword(password: string): string[] {
  const errors: string[] = []
  if (!password || password.length < 8) errors.push('at least 8 characters')
  if (!/[a-z]/.test(password)) errors.push('a lowercase letter')
  if (!/[A-Z]/.test(password)) errors.push('an uppercase letter')
  if (!/[0-9]/.test(password)) errors.push('a digit')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('a special character')
  return errors
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'too many login attempts, please try again later' },
})

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name: string
    email: string
    password: string
  }

  if (!name?.trim()) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'invalid email address' })
    return
  }
  const pwErrors = validatePassword(password)
  if (pwErrors.length) {
    res.status(400).json({ error: `password must contain: ${pwErrors.join(', ')}` })
    return
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)

  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, createdAt: true },
    })
    res.status(201).json(user)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'email already in use' })
      return
    }
    throw err
  }
})

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'invalid email address' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    res.status(401).json({ error: 'invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.password)

  if (!valid) {
    res.status(401).json({ error: 'invalid credentials' })
    return
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' })

  res.json({ token })
})

export default router
