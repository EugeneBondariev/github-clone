import express, { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const router = express.Router()
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const SALT_ROUNDS = 10

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name: string
    email: string
    password: string
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)

  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  res.status(201).json(user)
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string }

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
