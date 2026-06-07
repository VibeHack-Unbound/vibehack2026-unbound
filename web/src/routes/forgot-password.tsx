import { Link, createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'

import { authClient } from '#/lib/auth'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: authError } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (authError) {
        setError(authError.message ?? 'Could not send password reset')
        return
      }

      setSent(true)
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : 'Could not send password reset',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-zinc-50 px-5 py-16">
      <section className="mx-auto max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        {sent ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Check your email
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              If an account exists for {email}, a reset link was created. In
              local development, the API Worker logs that link to the console.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white no-underline"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Reset password
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Enter your email and Better Auth will create a reset token.
            </p>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <label className="grid gap-1.5 text-sm font-semibold text-zinc-800">
                <span>Email</span>
                <input
                  value={email}
                  type="email"
                  required
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}
