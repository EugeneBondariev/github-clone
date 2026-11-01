import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { mockNavigate, mockCreateRepo } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockCreateRepo: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../services/api', () => ({ api: { createRepo: mockCreateRepo } }))

import NewRepo from '../../pages/NewRepo'

function renderNewRepo() {
  return render(
    <MemoryRouter>
      <NewRepo />
    </MemoryRouter>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('NewRepo', () => {
  it('creates a repo and navigates to its detail page', async () => {
    const user = userEvent.setup()
    mockCreateRepo.mockResolvedValue({ id: 5, name: 'cool-lib' })
    renderNewRepo()

    await user.type(screen.getByLabelText(/^name/i), 'cool-lib')
    await user.click(screen.getByRole('button', { name: /create repository/i }))

    expect(mockCreateRepo).toHaveBeenCalledWith('cool-lib', undefined)
    expect(mockNavigate).toHaveBeenCalledWith('/repos/5')
  })

  it('includes description when provided', async () => {
    const user = userEvent.setup()
    mockCreateRepo.mockResolvedValue({ id: 6, name: 'my-app' })
    renderNewRepo()

    await user.type(screen.getByLabelText(/^name/i), 'my-app')
    await user.type(screen.getByLabelText(/description/i), 'an app')
    await user.click(screen.getByRole('button', { name: /create repository/i }))

    expect(mockCreateRepo).toHaveBeenCalledWith('my-app', 'an app')
  })

  it('shows error when repo name already exists', async () => {
    const user = userEvent.setup()
    mockCreateRepo.mockRejectedValue(new Error('repository name already exists'))
    renderNewRepo()

    await user.type(screen.getByLabelText(/^name/i), 'duplicate')
    await user.click(screen.getByRole('button', { name: /create repository/i }))

    expect(await screen.findByText('repository name already exists')).toBeInTheDocument()
  })
})
