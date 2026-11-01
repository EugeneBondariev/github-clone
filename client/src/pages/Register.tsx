import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../hooks/useAuth'

function passwordErrors(password: string): string[] {
  const errors: string[] = []
  if (password.length < 8) errors.push('at least 8 characters')
  if (!/[a-z]/.test(password)) errors.push('a lowercase letter')
  if (!/[A-Z]/.test(password)) errors.push('an uppercase letter')
  if (!/[0-9]/.test(password)) errors.push('a digit')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('a special character')
  return errors
}

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [apiError, setApiError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const pwErrors = passwordErrors(password)
    if (pwErrors.length) return setErrors(pwErrors)
    setErrors([])
    try {
      await api.register(name, email, password)
      const { token } = await api.login(email, password)
      login(token)
      navigate('/')
    } catch (e: any) {
      setApiError(e.message)
    }
  }

  return (
    <main className="max-w-100">
      <h2>Create account</h2>
      {errors.length > 0 && (
        <ul className="error list-none p-0 m-0">
          {errors.map((err) => (
            <li key={err}>· {err}</li>
          ))}
        </ul>
      )}
      {apiError && <p className="error">{apiError}</p>}
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
      <p className="mt-4 text-sm text-gh-muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  )
}
