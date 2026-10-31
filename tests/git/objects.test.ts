import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

let tmpDir: string

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-test-'))
  process.env.GIT_OBJECTS_DIR = tmpDir
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true })
  delete process.env.GIT_OBJECTS_DIR
})

import { writeBlob, readBlob, writeTree, readTree, writeCommit, readCommit } from '../../git/objects'

describe('blob', () => {
  it('writes and reads back content', () => {
    const sha = writeBlob('hello world')
    const obj = readBlob(sha)
    expect(obj.type).toBe('blob')
    expect(obj.content).toBe('hello world')
  })

  it('returns the same sha for identical content', () => {
    const sha1 = writeBlob('same content')
    const sha2 = writeBlob('same content')
    expect(sha1).toBe(sha2)
  })

  it('handles empty content', () => {
    const sha = writeBlob('')
    const obj = readBlob(sha)
    expect(obj.content).toBe('')
  })

  it('throws when sha does not exist', () => {
    expect(() => readBlob('0'.repeat(40))).toThrow()
  })
})

describe('tree', () => {
  it('writes and reads back entries', () => {
    const blobSha = writeBlob('file content')
    const treeSha = writeTree([{ mode: '100644', name: 'file.txt', sha: blobSha }])
    const entries = readTree(treeSha)
    expect(entries).toHaveLength(1)
    expect(entries[0].name).toBe('file.txt')
    expect(entries[0].sha).toBe(blobSha)
    expect(entries[0].mode).toBe('100644')
  })

  it('preserves multiple entries in order', () => {
    const a = writeBlob('a')
    const b = writeBlob('b')
    const treeSha = writeTree([
      { mode: '100644', name: 'a.txt', sha: a },
      { mode: '100644', name: 'b.txt', sha: b },
    ])
    const entries = readTree(treeSha)
    expect(entries).toHaveLength(2)
    expect(entries[0].name).toBe('a.txt')
    expect(entries[1].name).toBe('b.txt')
  })
})

describe('commit', () => {
  it('writes and reads back commit data', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))

    const treeSha = writeTree([{ mode: '100644', name: 'README.md', sha: writeBlob('readme') }])
    const commitSha = writeCommit({ treeSha, message: 'init', author: 'Charlie' })
    const commit = readCommit(commitSha)

    expect(commit.treeSha).toBe(treeSha)
    expect(commit.message).toBe('init')
    expect(commit.author).toBe('Charlie 1704067200 +0000')
    expect(commit.parentSha).toBeUndefined()

    vi.useRealTimers()
  })

  it('stores parent sha for subsequent commits', () => {
    const treeSha = writeTree([{ mode: '100644', name: 'a.txt', sha: writeBlob('a') }])
    const first = writeCommit({ treeSha, message: 'first', author: 'Charlie' })
    const second = writeCommit({ treeSha, message: 'second', author: 'Charlie', parentSha: first })
    expect(readCommit(second).parentSha).toBe(first)
  })
})
