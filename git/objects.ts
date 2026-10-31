import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

function objectsDir(): string {
  return process.env.GIT_OBJECTS_DIR ?? path.join(process.cwd(), 'data', 'objects')
}

function sha1(content: Buffer): string {
  return crypto.createHash('sha1').update(content).digest('hex')
}

function objectPath(sha: string): string {
  return path.join(objectsDir(), sha.slice(0, 2), sha.slice(2))
  // prod example: data/objects/8a/b686eafeb1f44702738c8b0f24f2567c36da6d
  // tests example: C:/Users/.../AppData/Local/Temp/git-test-/8a/b686eafeb1f44702738c8b0f24f2567c36da6d
}

type ObjectType = 'blob' | 'tree' | 'commit'

function buildObject(type: ObjectType, body: Buffer): Buffer {
  const header = Buffer.from(`${type} ${body.length}\0`)
  return Buffer.concat([header, body])
}

function loadObject(sha: string): { header: string; body: Buffer } {
  const raw = zlib.inflateSync(fs.readFileSync(objectPath(sha)))
  const nullIndex = raw.indexOf(0)
  return {
    header: raw.subarray(0, nullIndex).toString(),
    body: raw.subarray(nullIndex + 1),
  }
}

function storeObject(full: Buffer): string {
  const sha = sha1(full)
  const filePath = objectPath(sha)

  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, zlib.deflateSync(full))
  }

  return sha
}

export function writeBlob(content: string): string {
  const contentBuffer = Buffer.from(content)
  return storeObject(buildObject('blob', contentBuffer))
}

export function readBlob(sha: string): { type: string; content: string } {
  const { header, body } = loadObject(sha)
  return { type: header.split(' ')[0], content: body.toString() }
}

export interface TreeEntry {
  name: string
  sha: string
  // file or directory
  mode: '100644' | '040000'
}

export function writeTree(entries: TreeEntry[]): string {
  const parts = entries.map((e) => {
    const nameBuf = Buffer.from(`${e.mode} ${e.name}\0`)
    const shaBuf = Buffer.from(e.sha, 'hex')
    return Buffer.concat([nameBuf, shaBuf])
  })

  const body = Buffer.concat(parts)
  return storeObject(buildObject('tree', body))
}

export function readTree(sha: string): TreeEntry[] {
  const { body } = loadObject(sha)
  const entries: TreeEntry[] = []
  let i = 0

  while (i < body.length) {
    const spaceIndex = body.indexOf(32, i)
    const mode = body.subarray(i, spaceIndex).toString() as '100644' | '040000'
    const nullPos = body.indexOf(0, spaceIndex)
    const name = body.subarray(spaceIndex + 1, nullPos).toString()
    const shaBuf = body.subarray(nullPos + 1, nullPos + 21)
    const entrySha = shaBuf.toString('hex')
    entries.push({ mode, name, sha: entrySha })
    i = nullPos + 21
  }

  return entries
}

export interface CommitData {
  treeSha: string
  message: string
  author: string
  parentSha?: string
}

export function writeCommit(data: CommitData): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const lines = [
    `tree ${data.treeSha}`,
    ...(data.parentSha ? [`parent ${data.parentSha}`] : []),
    `author ${data.author} ${timestamp} +0000`,
    `committer ${data.author} ${timestamp} +0000`,
    '',
    data.message,
  ]

  const body = Buffer.from(lines.join('\n'))
  return storeObject(buildObject('commit', body))
}

export function readCommit(sha: string): CommitData & { sha: string } {
  const { body: bodyBuf } = loadObject(sha)
  const body = bodyBuf.toString()
  const [headerBlock, ...messageParts] = body.split('\n\n')
  const headers = Object.fromEntries(
    headerBlock.split('\n').map((line) => {
      const space = line.indexOf(' ')
      return [line.slice(0, space), line.slice(space + 1)]
    })
  )

  return {
    sha,
    treeSha: headers['tree'],
    parentSha: headers['parent'],
    author: headers['author'],
    message: messageParts.join('\n\n'),
  }
}
