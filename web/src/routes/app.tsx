import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { FloatingAIButton } from '../components/FloatingAIButton'
import { CatAgentOverlay } from '../components/CatAgentOverlay'
import { getServerSession } from '../lib/session'

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ location }) => {
    const auth = await getServerSession()
    if (auth) return

    throw redirect({
      to: '/login',
      search: { redirect: location.href },
    })
  },
  component: AppLayout,
})

function AppLayout() {
  const [agentOpen, setAgentOpen] = useState(false)

  return (
    <div className="app-root">
      <AppHeader />
      <div className="app-content">
        <Outlet />
      </div>
      <FloatingAIButton onClick={() => setAgentOpen(true)} />
      {agentOpen && <CatAgentOverlay onClose={() => setAgentOpen(false)} />}
    </div>
  )
}
