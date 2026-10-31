import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

let tmpDir: string

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'refs-test-'))
  process.env.GIT_REFS_DIR = tmpDir
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true })
  delete process.env.GIT_REFS_DIR
})

import { writeRef, readRef, listRefs } from '../../git/refs'

const sha = 'a'.repeat(40)

describe('refs', () => {
  it('writes and reads back a ref', () => {
    writeRef(1, 'main', sha)
    expect(readRef(1, 'main')).toBe(sha)
  })

  it('overwrites a ref when updated', () => {
    const newSha = 'b'.repeat(40)
    writeRef(1, 'main', newSha)
    expect(readRef(1, 'main')).toBe(newSha)
  })

  it('lists all refs for a repo', () => {
    writeRef(2, 'main', sha)
    writeRef(2, 'dev', sha)
    const refs = listRefs(2)
    expect(refs).toHaveLength(2)
    expect(refs.map((r) => r.branch).sort()).toEqual(['dev', 'main'])
  })

  it('returns empty array for repo with no refs', () => {
    expect(listRefs(999)).toEqual([])
  })

  it('throws when reading a non-existent ref', () => {
    expect(() => readRef(1, 'nonexistent')).toThrow()
  })
})
