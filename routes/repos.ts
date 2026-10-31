import express, { Request, Response } from 'express'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma } from '../generated/prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

router.get('/', async (_req: Request, res: Response) => {
  const repos = await prisma.repository.findMany({
    include: { owner: { select: { id: true, name: true } } },
  })
  res.json(repos)
})

router.get('/:id', async (req: Request, res: Response) => {
  const repo = await prisma.repository.findUnique({
    where: { id: Number(req.params.id) },
    include: { owner: { select: { id: true, name: true } } },
  })

  if (!repo) {
    res.status(404).json({ error: 'repository not found' })
    return
  }

  res.json(repo)
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { name, description } = req.body as {
    name: string
    description?: string
  }

  const ownerId = (req as AuthRequest).userId

  try {
    const repo = await prisma.repository.create({
      data: { name, description, ownerId },
      include: { owner: { select: { id: true, name: true } } },
    })
    res.status(201).json(repo)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'repository name already exists' })
      return
    }
    throw err
  }
})

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { name, description } = req.body as {
    name?: string
    description?: string
  }
  const userId = (req as AuthRequest).userId
  const repoId = Number(req.params.id)

  const repo = await prisma.repository.findUnique({ where: { id: repoId } })

  if (!repo) {
    res.status(404).json({ error: 'repository not found' })
    return
  }

  if (repo.ownerId !== userId) {
    res.status(403).json({ error: 'forbidden' })
    return
  }

  const updated = await prisma.repository.update({
    where: { id: repoId },
    data: { name, description },
    include: { owner: { select: { id: true, name: true } } },
  })

  res.json(updated)
})

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId
  const repoId = Number(req.params.id)

  const repo = await prisma.repository.findUnique({ where: { id: repoId } })

  if (!repo) {
    res.status(404).json({ error: 'repository not found' })
    return
  }

  if (repo.ownerId !== userId) {
    res.status(403).json({ error: 'forbidden' })
    return
  }

  await prisma.repository.delete({ where: { id: repoId } })

  res.status(204).send()
})

export default router
