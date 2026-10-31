import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import type { Repo } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import styles from './RepoDetail.module.css'

export default function RepoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userId } = useAuth()

  const [repo, setRepo] = useState<Repo | null>(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRepo(Number(id))
      .then((r) => {
        setRepo(r)
        setName(r.name)
        setDescription(r.description ?? '')
      })
      .catch((e) => setError(e.message))
  }, [id])

  async function handleSave() {
    try {
      const updated = await api.updateRepo(Number(id), { name, description })
      setRepo(updated)
      setEditing(false)
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${repo?.name}?`)) return
    try {
      await api.deleteRepo(Number(id))
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!repo) return <p>Loading…</p>

  const isOwner = userId === repo.ownerId

  return (
    <div>
      <Link to="/">← All repositories</Link>

      {editing ? (
        <div className={styles.editForm}>
          <h2>Edit repository</h2>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <>
          <h2>
            {repo.owner.name} / {repo.name}
          </h2>
          {repo.description && <p>{repo.description}</p>}
          <p className={styles.meta}>Created {new Date(repo.createdAt).toLocaleDateString()}</p>

          {isOwner && (
            <div className={styles.actions}>
              <button onClick={() => setEditing(true)}>Edit</button>
              <button className="danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
