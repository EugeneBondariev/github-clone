import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import usersRouter from './routes/users'
import reposRouter from './routes/repos'
import authRouter from './routes/auth'

const app = express()

app.use(express.json())

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.get('/', (_req: Request, res: Response) => {
  res.json({ name: 'github-clone', version: '1.0.0' })
})

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.use('/users', usersRouter)
app.use('/repos', reposRouter)
app.use('/auth', authRouter)

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'not found' })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'something went wrong' })
})

app.listen(3000, () => {
  console.log('listening on http://localhost:3000')
})
