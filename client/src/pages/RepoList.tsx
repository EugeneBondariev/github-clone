import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import type { Repo } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import styles from './RepoList.module.css'

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
      <header>
        <h1>Repositories</h1>
        <nav>
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

      {error && <p className="error">{error}</p>}

      {repos.length === 0 && !error && <p>No repositories yet.</p>}

      <ul className={styles.repoList}>
        {repos.map((repo) => (
          <li key={repo.id} className={styles.item}>
            <Link to={`/repos/${repo.id}`}>
              <strong>{repo.owner.name}</strong> / <strong>{repo.name}</strong>
            </Link>
            {repo.description && <p className={styles.desc}>{repo.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
