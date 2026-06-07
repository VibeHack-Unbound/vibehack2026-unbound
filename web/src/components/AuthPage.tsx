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

  const title = isRegister ? 'start unbound' : 'welcome back'
  const body = isRegister
    ? 'create an account before your first check-in.'
    : "log in to do today's check-in."
  const submitLabel = isRegister ? 'create account' : 'log in'
  const redirectTarget = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/app'
  const alternatePath = isRegister ? '/login' : '/register'
  const alternateHref = `${alternatePath}?redirect=${encodeURIComponent(redirectTarget)}`
  const alternateText = isRegister ? 'already have an account?' : 'need an account?'
  const alternateAction = isRegister ? 'log in' : 'register'
  const catTier = isRegister ? 1 : 2

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
        <header className="auth-header">
          <Link to="/login" search={{ redirect: redirectTarget }} className="auth-header-title">
            unbound
          </Link>
        </header>

        <div className="auth-screen page-enter">
          <div className="auth-copy">
            <h1>{title}</h1>
            <p>{body}</p>
          </div>

          <div className="auth-cat-wrap" aria-hidden="true">
            <img
              src={`/cats/cat-tier-${catTier}.webp`}
              alt=""
              width={176}
              height={176}
              className={`auth-cat-img cat-idle-${catTier}`}
            />
          </div>

          <form onSubmit={handleSubmit} className="auth-card">
            <div className="auth-card-header">
              <h2>{submitLabel}</h2>
              <p>
                {alternateText} <a href={alternateHref}>{alternateAction}</a>
              </p>
            </div>

            {error ? <div className="auth-error">{error}</div> : null}

            <div className="auth-field-list">
              {isRegister ? (
                <AuthField
                  label="name"
                  value={name}
                  autoComplete="name"
                  onChange={setName}
                  required
                />
              ) : null}
              <AuthField
                label="email"
                value={email}
                type="email"
                autoComplete="email"
                onChange={setEmail}
                required
              />
              <AuthField
                label="password"
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
                forgot password?
              </Link>
            ) : null}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password || (isRegister && !name.trim())}
              className="btn-primary auth-submit"
            >
              {loading ? 'working...' : submitLabel}
            </button>
          </form>
        </div>
      </section>
    </main>
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
