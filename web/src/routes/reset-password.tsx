import { Link, createFileRoute, useSearch } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'

import { authClient } from '#/lib/auth'

type ResetPasswordSearch = {
  token?: string
}

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token } = useSearch({ from: '/reset-password' })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError('This reset link is missing a token.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error: authError } = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (authError) {
        setError(authError.message ?? 'Could not reset password')
        return
      }

      setSuccess(true)
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-zinc-50 px-5 py-16">
      <section className="mx-auto max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        {success ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Password reset</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Your password has been updated. You can log in with the new password now.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white no-underline"
            >
              Log in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Set new password
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Choose a password with at least 8 characters.
            </p>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <PasswordField label="New password" value={password} onChange={setPassword} />
              <PasswordField
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save password'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-zinc-800">
      <span>{label}</span>
      <input
        value={value}
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
      />
    </label>
  )
}
