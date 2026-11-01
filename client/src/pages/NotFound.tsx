import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main>
      <h2>404 — Page not found</h2>
      <Link to="/">← Back to home</Link>
    </main>
  )
}
