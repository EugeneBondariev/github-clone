import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import type { Repo } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function RepoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userId } = useAuth()

  const [repo, setRepo] = useState<Repo | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
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
    try {
      await api.deleteRepo(Number(id))
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (error)
    return (
      <main>
        <p className="error">{error}</p>
      </main>
    )
  if (!repo)
    return (
      <main>
        <p>Loading…</p>
      </main>
    )

  const isOwner = userId === repo.ownerId

  return (
    <main>
      <Link to="/">← All repositories</Link>

      {editing ? (
        <div className="flex flex-col gap-4 max-w-100 mt-4">
          <h2>Edit repository</h2>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <h2>
            {repo.owner.name} / {repo.name}
          </h2>
          {repo.description && <p>{repo.description}</p>}
          <p className="text-[13px] text-gh-muted">
            Created {new Date(repo.createdAt).toLocaleDateString()}
          </p>

          {isOwner && (
            <div className="flex items-center gap-2 mt-6">
              <button onClick={() => setEditing(true)}>Edit</button>
              {confirmDelete ? (
                <>
                  <span className="text-sm text-gh-muted">Are you sure?</span>
                  <button
                    className="border-gh-danger text-gh-danger hover:bg-[#f8514920]"
                    onClick={handleDelete}
                  >
                    Confirm
                  </button>
                  <button onClick={() => setConfirmDelete(false)}>Cancel</button>
                </>
              ) : (
                <button
                  className="border-gh-danger text-gh-danger hover:bg-[#f8514920]"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </>
      )}
    </main>
  )
}
