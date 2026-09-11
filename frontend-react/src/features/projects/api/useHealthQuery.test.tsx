import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useHealthQuery } from './useHealthQuery.ts'

// Integration test — behavior-focused: MSW health handler + TanStack Query hook.
// Verifies server-state ownership (health fetched via Query, not Zustand) with real Axios + MSW.
function HealthStatus() {
  const { data, isLoading, isError } = useHealthQuery()

  if (isLoading) return <div>Loading health…</div>
  if (isError) return <div>Failed to load health</div>
  return <div>Health: {data?.data.status}</div>
}

function renderWithQuery(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('useHealthQuery integration', () => {
  it('fetches health status via MSW handler (behavior: user sees UP)', async () => {
    renderWithQuery(<HealthStatus />)

    expect(screen.getByText(/loading health/i)).toBeInTheDocument()

    expect(await screen.findByText(/health: UP/i)).toBeInTheDocument()
  })
})
