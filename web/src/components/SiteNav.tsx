import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { authClient } from '#/lib/auth'

export function SiteNav() {
  const { data: auth, isPending } = authClient.useSession()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-3 text-zinc-950 no-underline">
          <span className="grid size-9 place-items-center rounded-md bg-zinc-950 text-sm font-bold text-white">
            U
          </span>
          <span className="text-base font-semibold tracking-tight">Unbound</span>
        </Link>

        <div className="flex items-center gap-2">
          {auth?.user ? (
            <>
              <Link
                to="/app"
                className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-700 no-underline transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                App
              </Link>
              <span className="hidden max-w-52 truncate text-sm text-zinc-500 sm:inline">
                {auth.user.email}
              </span>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <a
                href="/login?redirect=/app"
                className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-700 no-underline transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                Log in
              </a>
              <a
                href="/register?redirect=/app"
                className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-zinc-800"
              >
                Register
              </a>
            </>
          )}
          {isPending ? <span className="sr-only">Checking session</span> : null}
        </div>
      </nav>
    </header>
  )
}
