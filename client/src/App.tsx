import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/AuthContext'
import RepoList from './pages/RepoList'
import RepoDetail from './pages/RepoDetail'
import NewRepo from './pages/NewRepo'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="container">
          <Routes>
            <Route path="/" element={<RepoList />} />
            <Route path="/repos/new" element={<NewRepo />} />
            <Route path="/repos/:id" element={<RepoDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
