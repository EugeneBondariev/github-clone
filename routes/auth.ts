import express, { Request, Response } from 'express'
import bcrypt from 'bcrypt'
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

export default router
