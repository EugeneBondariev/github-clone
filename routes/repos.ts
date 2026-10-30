import express, { Request, Response } from 'express'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

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

router.post('/', async (req: Request, res: Response) => {
	const { name, description, ownerId } = req.body as {
		name: string
		description?: string
		ownerId: number
	}

	const repo = await prisma.repository.create({
		data: { name, description, ownerId },
		include: { owner: { select: { id: true, name: true } } },
	})

	res.status(201).json(repo)
})

router.patch('/:id', async (req: Request, res: Response) => {
	const { name, description } = req.body as {
		name?: string
		description?: string
	}

	const repo = await prisma.repository.update({
		where: { id: Number(req.params.id) },
		data: { name, description },
		include: { owner: { select: { id: true, name: true } } },
	})

	res.json(repo)
})

router.delete('/:id', async (req: Request, res: Response) => {
	await prisma.repository.delete({
		where: { id: Number(req.params.id) },
	})

	res.status(204).send()
})

export default router
