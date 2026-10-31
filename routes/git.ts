import express, { Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  writeBlob,
  readBlob,
  writeTree,
  readTree,
  TreeEntry,
  writeCommit,
  readCommit,
  CommitData,
} from '../git/objects'
import { writeRef, readRef, listRefs } from '../git/refs'

const router = express.Router()

router.post('/blobs', requireAuth, (req: Request, res: Response) => {
  const { content } = req.body as { content: string }
  const sha = writeBlob(content)
  res.status(201).json({ sha })
})

router.get('/blobs/:sha', (req: Request, res: Response) => {
  const object = readBlob(req.params.sha as string)

  if (object.type !== 'blob') {
    res.status(400).json({ error: 'not a blob' })
    return
  }

  res.json(object)
})

router.post('/trees', requireAuth, (req: Request, res: Response) => {
  const { entries } = req.body as { entries: TreeEntry[] }
  const sha = writeTree(entries)
  res.status(201).json({ sha })
})

router.get('/trees/:sha', (req: Request, res: Response) => {
  const entries = readTree(req.params.sha as string)
  res.json({ entries })
})

router.post('/commits', requireAuth, (req: Request, res: Response) => {
  const data = req.body as CommitData
  const sha = writeCommit(data)
  res.status(201).json({ sha })
})

router.get('/commits/:sha', (req: Request, res: Response) => {
  const commit = readCommit(req.params.sha as string)
  res.json(commit)
})

router.post('/repos/:repoId/refs', requireAuth, (req: Request, res: Response) => {
  const { branch, sha } = req.body as { branch: string; sha: string }
  writeRef(Number(req.params.repoId), branch, sha)
  res.status(201).json({ branch, sha })
})

router.get('/repos/:repoId/refs', (req: Request, res: Response) => {
  const refs = listRefs(Number(req.params.repoId))
  res.json(refs)
})

router.get('/repos/:repoId/refs/:branch', (req: Request, res: Response) => {
  try {
    const sha = readRef(Number(req.params.repoId), req.params.branch as string)
    res.json({ branch: req.params.branch, sha })
  } catch {
    res.status(404).json({ error: 'ref not found' })
  }
})

export default router
