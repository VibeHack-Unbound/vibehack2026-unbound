import { Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'

import { CatIllustration } from '#/components/CatIllustration'
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
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-story">
          <div className="mini-brand left auth-brand">
            <span className="brand-cat calm">●</span>
            <strong>Unbound</strong>
          </div>

          <div className="auth-copy">
            <p className="auth-kicker">{isRegister ? 'Start private' : 'Welcome back'}</p>
            <h1>{title}</h1>
            <p>{body}</p>
          </div>

          <div className="auth-illustration" aria-hidden="true">
            <CatIllustration tier={isRegister ? 1 : 2} size={180} />
          </div>

          <div className="auth-points">
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

        <form onSubmit={handleSubmit} className="auth-card">
          <div className="auth-card-header">
            <h2>{submitLabel}</h2>
            <p>
              {alternateText}{' '}
              <a href={alternateHref}>
                {alternateAction}
              </a>
            </p>
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          <div className="auth-field-list">
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
            <Link to="/forgot-password" className="auth-secondary-link">
              Forgot password?
            </Link>
          ) : null}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password || (isRegister && !name.trim())}
            className="auth-submit"
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
    <div className="auth-point">
      <h3>{title}</h3>
      <p>{body}</p>
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
    <label className="auth-field">
      <span>{label}</span>
      <input
        value={value}
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
