import { Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'

import { authClient, safeRedirectPath } from '#/lib/auth'

type AuthMode = 'login' | 'register'

type AuthPageProps = {
  mode: AuthMode
  redirect?: string
}

function authErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  return error?.message ?? fallback
}

export function AuthPage({ mode, redirect }: AuthPageProps) {
  const isRegister = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const title = isRegister ? 'Create your account' : 'Log in to Unbound'
  const body = isRegister
    ? 'Start a private workspace for your team notes and submissions.'
    : 'Open your private workspace and keep momentum across sessions.'
  const submitLabel = isRegister ? 'Create account' : 'Log in'
  const alternateHref = isRegister ? '/login?redirect=/app' : '/register?redirect=/app'
  const alternateText = isRegister ? 'Already have an account?' : 'Need an account?'
  const alternateAction = isRegister ? 'Log in' : 'Register'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const callbackURL = safeRedirectPath(redirect)

    try {
      const result = isRegister
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
            callbackURL,
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
            callbackURL,
          })

      if (result.error) {
        setError(
          authErrorMessage(result.error, isRegister ? 'Could not register' : 'Could not log in'),
        )
        return
      }

      window.location.href = callbackURL
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isRegister
            ? 'Could not register'
            : 'Could not log in',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-zinc-50">
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1fr_420px] md:px-8 md:py-20">
        <div className="flex flex-col justify-center">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600">{body}</p>
          <div className="mt-10 grid max-w-xl gap-3 border-y border-zinc-200 py-6">
            <AuthPoint
              title="D1-backed sessions"
              body="Accounts, sessions, and reset tokens live in the API Worker database."
            />
            <AuthPoint
              title="Private app data"
              body="Submissions are scoped to the authenticated user instead of a shared public list."
            />
            <AuthPoint
              title="Cloudflare-ready"
              body="The web Worker stays HTTP-only; secrets and D1 access remain in the API Worker."
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">{submitLabel}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {alternateText}{' '}
              <a href={alternateHref} className="font-semibold text-zinc-950 underline">
                {alternateAction}
              </a>
            </p>
          </div>

          {error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            {isRegister ? (
              <AuthField
                label="Name"
                value={name}
                autoComplete="name"
                onChange={setName}
                required
              />
            ) : null}
            <AuthField
              label="Email"
              value={email}
              type="email"
              autoComplete="email"
              onChange={setEmail}
              required
            />
            <AuthField
              label="Password"
              value={password}
              type="password"
              minLength={8}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              onChange={setPassword}
              required
            />
          </div>

          {!isRegister ? (
            <Link
              to="/forgot-password"
              className="mt-3 inline-flex text-sm font-semibold text-zinc-700 underline"
            >
              Forgot password?
            </Link>
          ) : null}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password || (isRegister && !name.trim())}
            className="mt-6 w-full rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Working...' : submitLabel}
          </button>
        </form>
      </section>
    </main>
  )
}

function AuthPoint({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold text-zinc-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-600">{body}</p>
    </div>
  )
}

function AuthField({
  label,
  value,
  type = 'text',
  autoComplete,
  minLength,
  required,
  onChange,
}: {
  label: string
  value: string
  type?: 'text' | 'email' | 'password'
  autoComplete: string
  minLength?: number
  required?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-zinc-800">
      <span>{label}</span>
      <input
        value={value}
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
      />
    </label>
  )
}
