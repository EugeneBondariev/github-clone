import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import styles from './Auth.module.css'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.register(name, email, password)
      const { token } = await api.login(email, password)
      login(token)
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className={styles.form}>
      <h2>Create account</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Register</button>
      </form>
      <p className={styles.footer}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
