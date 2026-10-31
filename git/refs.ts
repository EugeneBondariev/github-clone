import fs from 'fs'
import path from 'path'

function refsDir(): string {
  return process.env.GIT_REFS_DIR ?? path.join(process.cwd(), 'data', 'refs')
}

function refPath(repoId: number, branch: string): string {
  return path.join(refsDir(), String(repoId), branch)
}

export function writeRef(repoId: number, branch: string, sha: string): void {
  const filePath = refPath(repoId, branch)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, sha)
}

export function readRef(repoId: number, branch: string): string {
  return fs.readFileSync(refPath(repoId, branch), 'utf8')
}

export function listRefs(repoId: number): { branch: string; sha: string }[] {
  const dir = path.join(refsDir(), String(repoId))
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).map((branch) => ({
    branch,
    sha: fs.readFileSync(path.join(dir, branch), 'utf8'),
  }))
}
