import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { mockNavigate, mockApiLogin, mockAuthLogin } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockApiLogin: vi.fn(),
  mockAuthLogin: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../services/api', () => ({ api: { login: mockApiLogin } }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ login: mockAuthLogin }) }))

import Login from '../../pages/Login'

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('Login', () => {
  it('calls api.login and stores token on success', async () => {
    const user = userEvent.setup()
    mockApiLogin.mockResolvedValue({ token: 'tok123' })
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await user.type(screen.getByLabelText(/password/i), 'secret')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(mockApiLogin).toHaveBeenCalledWith('alice@example.com', 'secret')
    expect(mockAuthLogin).toHaveBeenCalledWith('tok123')
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('shows error message on failed login', async () => {
    const user = userEvent.setup()
    mockApiLogin.mockRejectedValue(new Error('invalid credentials'))
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText('invalid credentials')).toBeInTheDocument()
  })

  it('has a link to the register page', () => {
    mockApiLogin.mockResolvedValue({ token: '' })
    renderLogin()
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
  })
})
