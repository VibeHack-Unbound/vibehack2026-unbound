import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { FloatingAIButton } from '../components/FloatingAIButton'
import { CatAgentOverlay } from '../components/CatAgentOverlay'
import { getFreshAuthSession } from '../lib/auth'

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function AppLayout() {
  const [agentOpen, setAgentOpen] = useState(false)
  const [authState, setAuthState] = useState<'checking' | 'signed-in'>(
    'checking',
  )

  useEffect(() => {
    let cancelled = false

    async function verifySession() {
      const auth = await getFreshAuthSession().catch(() => null)

      if (cancelled) return

      if (auth) {
        setAuthState('signed-in')
        return
      }

      const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`
      window.location.replace(`/login?redirect=${encodeURIComponent(redirect)}`)
    }

    void verifySession()

    return () => {
      cancelled = true
    }
  }, [])

  if (authState === 'checking') {
    return <div className="app-auth-loading" />
  }

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
