import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { mockNavigate, mockRegister, mockApiLogin, mockAuthLogin } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockRegister: vi.fn(),
  mockApiLogin: vi.fn(),
  mockAuthLogin: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../services/api', () => ({ api: { register: mockRegister, login: mockApiLogin } }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ login: mockAuthLogin }) }))

import Register from '../../pages/Register'

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('Register', () => {
  it('calls api.register then api.login and redirects on success', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({})
    mockApiLogin.mockResolvedValue({ token: 'tok456' })
    renderRegister()

    await user.type(screen.getByLabelText(/^name/i), 'Alice')
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Secret123!')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(mockRegister).toHaveBeenCalledWith('Alice', 'alice@example.com', 'Secret123!')
    expect(mockApiLogin).toHaveBeenCalledWith('alice@example.com', 'Secret123!')
    expect(mockAuthLogin).toHaveBeenCalledWith('tok456')
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('shows error when email is already in use', async () => {
    const user = userEvent.setup()
    mockRegister.mockRejectedValue(new Error('email already in use'))
    renderRegister()

    await user.type(screen.getByLabelText(/^name/i), 'Alice')
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Secret123!')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(await screen.findByText('email already in use')).toBeInTheDocument()
  })

  it('has a link to the login page', () => {
    renderRegister()
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
  })
})
