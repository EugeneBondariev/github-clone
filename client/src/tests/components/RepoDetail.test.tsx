import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { mockNavigate, mockGetRepo, mockUpdateRepo, mockDeleteRepo, mockUseAuth } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetRepo: vi.fn(),
  mockUpdateRepo: vi.fn(),
  mockDeleteRepo: vi.fn(),
  mockUseAuth: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }) }
})

vi.mock('../../services/api', () => ({
  api: { getRepo: mockGetRepo, updateRepo: mockUpdateRepo, deleteRepo: mockDeleteRepo },
}))

vi.mock('../../hooks/useAuth', () => ({ useAuth: mockUseAuth }))

import RepoDetail from '../../pages/RepoDetail'

const repo = {
  id: 1,
  name: 'my-repo',
  description: 'A test repo',
  ownerId: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  owner: { id: 1, name: 'Alice' },
}

function renderRepoDetail() {
  return render(
    <MemoryRouter>
      <RepoDetail />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ userId: null })
})

describe('RepoDetail', () => {
  it('renders repo name and owner after loading', async () => {
    mockGetRepo.mockResolvedValue(repo)
    renderRepoDetail()
    expect(await screen.findByText(/Alice\s*\/\s*my-repo/)).toBeInTheDocument()
  })

  it('shows Edit and Delete buttons for the owner', async () => {
    mockGetRepo.mockResolvedValue(repo)
    mockUseAuth.mockReturnValue({ userId: 1 })
    renderRepoDetail()
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('hides Edit and Delete for non-owners', async () => {
    mockGetRepo.mockResolvedValue(repo)
    mockUseAuth.mockReturnValue({ userId: 2 })
    renderRepoDetail()
    await screen.findByText(/Alice/)
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('submits updated name when editing', async () => {
    const user = userEvent.setup()
    mockGetRepo.mockResolvedValue(repo)
    mockUpdateRepo.mockResolvedValue({ ...repo, name: 'new-name' })
    mockUseAuth.mockReturnValue({ userId: 1 })
    renderRepoDetail()

    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    const nameInput = screen.getByDisplayValue('my-repo')
    await user.clear(nameInput)
    await user.type(nameInput, 'new-name')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(mockUpdateRepo).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'new-name' })))
  })

  it('calls deleteRepo and navigates home on delete', async () => {
    const user = userEvent.setup()
    mockGetRepo.mockResolvedValue(repo)
    mockDeleteRepo.mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue({ userId: 1 })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderRepoDetail()

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockDeleteRepo).toHaveBeenCalledWith(1))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
