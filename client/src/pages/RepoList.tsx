import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import type { Repo } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function RepoList() {
  const { userId, logout } = useAuth()
  const [repos, setRepos] = useState<Repo[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRepos()
      .then(setRepos)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <header className="flex items-center justify-between border-b border-gh-border pb-4 mb-6">
        <h1>Repositories</h1>
        <nav className="flex items-center gap-2">
          {userId ? (
            <>
              <Link to="/repos/new">New repo</Link>
              {' · '}
              <button onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              {' · '}
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        {error && <p className="error">{error}</p>}

        {repos.length === 0 && !error && <p>No repositories yet.</p>}

        <ul className="list-none p-0 m-0 border border-gh-border rounded-md overflow-hidden">
          {repos.map((repo) => (
            <li
              key={repo.id}
              className="p-4 bg-gh-secondary border-b border-gh-border last:border-b-0"
            >
              <Link to={`/repos/${repo.id}`}>
                <strong>{repo.owner.name}</strong> / <strong>{repo.name}</strong>
              </Link>
              {repo.description && (
                <p className="mt-1 text-[13px] text-gh-muted">{repo.description}</p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
