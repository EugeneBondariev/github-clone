import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'

export default function NewRepo() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const repo = await api.createRepo(name, description || undefined)
      navigate(`/repos/${repo.id}`)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div>
      <Link to="/">← All repositories</Link>
      <h2>New repository</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <label>
          Description <span className="optional">(optional)</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit">Create repository</button>
      </form>
    </div>
  )
}
