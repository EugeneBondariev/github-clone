import express, { Request, Response } from 'express'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const router = express.Router()
const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

router.get('/', async (_req: Request, res: Response) => {
	const users = await prisma.user.findMany()
	res.json(users)
})

router.get('/:id', async (req: Request, res: Response) => {
	const user = await prisma.user.findUnique({
		where: { id: Number(req.params.id) },
	})

	if (!user) {
		res.status(404).json({ error: 'user not found' })
		return
	}

	res.json(user)
})

router.post('/', async (req: Request, res: Response) => {
	const { name, email } = req.body as { name: string; email: string }

	const user = await prisma.user.create({
		data: { name, email },
	})

	res.status(201).json(user)
})

router.delete('/:id', async (req: Request, res: Response) => {
	await prisma.user.delete({
		where: { id: Number(req.params.id) },
	})

	res.status(204).send()
})

export default router
