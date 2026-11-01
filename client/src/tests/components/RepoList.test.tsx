import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { mockGetRepos, mockUseAuth } = vi.hoisted(() => ({
  mockGetRepos: vi.fn(),
  mockUseAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({ api: { getRepos: mockGetRepos } }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: mockUseAuth }))

import RepoList from '../../pages/RepoList'

const repo = {
  id: 1,
  name: 'my-repo',
  description: 'A test repo',
  ownerId: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  owner: { id: 1, name: 'Alice' },
}

function renderRepoList() {
  return render(
    <MemoryRouter>
      <RepoList />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ userId: null, logout: vi.fn() })
})

describe('RepoList', () => {
  it('shows empty state when there are no repos', async () => {
    mockGetRepos.mockResolvedValue([])
    renderRepoList()
    expect(await screen.findByText('No repositories yet.')).toBeInTheDocument()
  })

  it('renders repos returned by the API', async () => {
    mockGetRepos.mockResolvedValue([repo])
    renderRepoList()
    expect(await screen.findByText(/my-repo/)).toBeInTheDocument()
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
    expect(screen.getByText('A test repo')).toBeInTheDocument()
  })

  it('shows New repo link and Log out when logged in', async () => {
    mockGetRepos.mockResolvedValue([])
    mockUseAuth.mockReturnValue({ userId: 1, logout: vi.fn() })
    renderRepoList()
    expect(screen.getByText('New repo')).toBeInTheDocument()
    expect(screen.getByText('Log out')).toBeInTheDocument()
  })

  it('shows Log in and Register links when logged out', async () => {
    mockGetRepos.mockResolvedValue([])
    renderRepoList()
    expect(screen.getByText('Log in')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
  })

  it('shows error message when API fails', async () => {
    mockGetRepos.mockRejectedValue(new Error('network error'))
    renderRepoList()
    expect(await screen.findByText('network error')).toBeInTheDocument()
  })
})
