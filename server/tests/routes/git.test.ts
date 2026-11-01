import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import jwt from 'jsonwebtoken'

let tmpDir: string
let token: string

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-routes-test-'))
  process.env.GIT_OBJECTS_DIR = tmpDir
  process.env.JWT_SECRET = 'test-secret'
  token = jwt.sign({ userId: 1 }, 'test-secret')
})

let refsDir: string

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true })
  fs.rmSync(refsDir, { recursive: true, force: true })
  delete process.env.GIT_OBJECTS_DIR
  delete process.env.GIT_REFS_DIR
})

beforeAll(() => {
  refsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-refs-routes-test-'))
  process.env.GIT_REFS_DIR = refsDir
})

import app from '../../app'

describe('POST /git/blobs', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/git/blobs').send({ content: 'hello' })
    expect(res.status).toBe(401)
  })

  it('creates a blob and returns a sha', async () => {
    const res = await request(app)
      .post('/git/blobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'hello world' })
    expect(res.status).toBe(201)
    expect(res.body.sha).toHaveLength(40)
  })
})

describe('GET /git/blobs/:sha', () => {
  it('returns the blob content', async () => {
    const post = await request(app)
      .post('/git/blobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'hello world' })

    const sha = post.body.sha
    const res = await request(app).get(`/git/blobs/${sha}`)
    expect(res.status).toBe(200)
    expect(res.body.content).toBe('hello world')
    expect(res.body.type).toBe('blob')
  })

  it('returns 400 when sha points to a non-blob', async () => {
    const blob = await request(app)
      .post('/git/blobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'file' })

    const tree = await request(app)
      .post('/git/trees')
      .set('Authorization', `Bearer ${token}`)
      .send({ entries: [{ mode: '100644', name: 'f.txt', sha: blob.body.sha }] })

    const res = await request(app).get(`/git/blobs/${tree.body.sha}`)
    expect(res.status).toBe(400)
  })

  it('returns 500 for unknown sha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await request(app).get(`/git/blobs/${'0'.repeat(40)}`)
    expect(res.status).toBe(500)
    vi.restoreAllMocks()
  })
})

describe('POST /git/trees', () => {
  it('creates a tree from blob entries', async () => {
    const blob = await request(app)
      .post('/git/blobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'readme content' })

    const res = await request(app)
      .post('/git/trees')
      .set('Authorization', `Bearer ${token}`)
      .send({ entries: [{ mode: '100644', name: 'README.md', sha: blob.body.sha }] })

    expect(res.status).toBe(201)
    expect(res.body.sha).toHaveLength(40)
  })
})

describe('GET /git/trees/:sha', () => {
  it('returns tree entries', async () => {
    const blob = await request(app)
      .post('/git/blobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'content' })

    const tree = await request(app)
      .post('/git/trees')
      .set('Authorization', `Bearer ${token}`)
      .send({ entries: [{ mode: '100644', name: 'file.txt', sha: blob.body.sha }] })

    const res = await request(app).get(`/git/trees/${tree.body.sha}`)
    expect(res.status).toBe(200)
    expect(res.body.entries).toHaveLength(1)
    expect(res.body.entries[0].name).toBe('file.txt')
  })
})

describe('POST /git/commits', () => {
  it('creates a commit pointing to a tree', async () => {
    const blob = await request(app)
      .post('/git/blobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'file' })

    const tree = await request(app)
      .post('/git/trees')
      .set('Authorization', `Bearer ${token}`)
      .send({ entries: [{ mode: '100644', name: 'file.txt', sha: blob.body.sha }] })

    const res = await request(app)
      .post('/git/commits')
      .set('Authorization', `Bearer ${token}`)
      .send({ treeSha: tree.body.sha, message: 'init', author: 'Charlie' })

    expect(res.status).toBe(201)
    expect(res.body.sha).toHaveLength(40)
  })
})

describe('GET /git/commits/:sha', () => {
  it('returns commit data', async () => {
    const blob = await request(app)
      .post('/git/blobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'file' })

    const tree = await request(app)
      .post('/git/trees')
      .set('Authorization', `Bearer ${token}`)
      .send({ entries: [{ mode: '100644', name: 'file.txt', sha: blob.body.sha }] })

    const commit = await request(app)
      .post('/git/commits')
      .set('Authorization', `Bearer ${token}`)
      .send({ treeSha: tree.body.sha, message: 'init', author: 'Charlie' })

    const res = await request(app).get(`/git/commits/${commit.body.sha}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('init')
    expect(res.body.treeSha).toBe(tree.body.sha)
  })
})

describe('refs', () => {
  it('creates and reads a ref', async () => {
    const sha = 'a'.repeat(40)

    const post = await request(app)
      .post('/git/repos/1/refs')
      .set('Authorization', `Bearer ${token}`)
      .send({ branch: 'main', sha })
    expect(post.status).toBe(201)

    const get = await request(app).get('/git/repos/1/refs/main')
    expect(get.status).toBe(200)
    expect(get.body.sha).toBe(sha)
  })

  it('lists refs for a repo', async () => {
    const sha = 'b'.repeat(40)
    await request(app)
      .post('/git/repos/2/refs')
      .set('Authorization', `Bearer ${token}`)
      .send({ branch: 'main', sha })

    const res = await request(app).get('/git/repos/2/refs')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('returns 404 for unknown branch', async () => {
    const res = await request(app).get('/git/repos/999/refs/nonexistent')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('ref not found')
  })
})
