import express, { Request, Response } from 'express'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const userSelect = { id: true, name: true, email: true, createdAt: true }

router.get('/', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({ select: userSelect })
  res.json(users)
})

router.get('/:id/repos', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    include: { repositories: true },
  })

  if (!user) {
    res.status(404).json({ error: 'user not found' })
    return
  }

  res.json(user.repositories)
})

router.get('/:id', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    select: userSelect,
  })

  if (!user) {
    res.status(404).json({ error: 'user not found' })
    return
  }

  res.json(user)
})

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId
  const targetId = Number(req.params.id)

  if (userId !== targetId) {
    res.status(403).json({ error: 'forbidden' })
    return
  }

  await prisma.user.delete({ where: { id: targetId } })

  res.status(204).send()
})

export default router
