import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { authClient, getFreshAuthSession, type CurrentAuth } from '../../lib/auth'

type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; auth: CurrentAuth }
  | { status: 'error'; message: string }

export const Route = createFileRoute('/app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const [sessionState, setSessionState] = useState<SessionState>({
    status: 'loading',
  })
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      try {
        const auth = await getFreshAuthSession()

        if (cancelled) return

        if (!auth) {
          const redirect = '/app/settings'
          window.location.replace(`/login?redirect=${encodeURIComponent(redirect)}`)
          return
        }

        setSessionState({ status: 'ready', auth })
      } catch (error) {
        if (cancelled) return

        setSessionState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Could not load account',
        })
      }
    }

    void loadSession()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    setSignOutError(null)

    try {
      const result = await authClient.signOut()

      if (result.error) {
        setSignOutError(result.error.message ?? 'Could not log out')
        return
      }

      window.location.href = '/login'
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Could not log out')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="screen settings-screen page-enter">
      <header>
        <h1 className="page-title">settings</h1>
        <p className="page-subtitle">your unbound account</p>
      </header>

      {sessionState.status === 'loading' ? (
        <div className="settings-loading">loading account...</div>
      ) : null}

      {sessionState.status === 'error' ? (
        <div className="settings-message settings-error">{sessionState.message}</div>
      ) : null}

      {sessionState.status === 'ready' ? (
        <>
          <section className="settings-account-card" aria-label="account">
            <div className="settings-row">
              <span className="settings-label">name</span>
              <span className="settings-value">{sessionState.auth.user.name || 'not set'}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">email</span>
              <span className="settings-value">{sessionState.auth.user.email}</span>
            </div>
          </section>

          {signOutError ? (
            <div className="settings-message settings-error">{signOutError}</div>
          ) : null}

          <button
            type="button"
            className="settings-logout-btn"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
          >
            {signingOut ? 'logging out...' : 'log out'}
          </button>
        </>
      ) : null}
    </div>
  )
}
