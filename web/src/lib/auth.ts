import { createAuthClient } from 'better-auth/react'

function localApiOrigin() {
  if (typeof window === 'undefined') return 'http://localhost:8787'

  const { hostname } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:8787`
  }

  if (hostname === '::1' || hostname === '[::1]') {
    return 'http://[::1]:8787'
  }

  return 'http://localhost:8787'
}

export const apiOrigin = import.meta.env.VITE_HTTP_API_URL ?? localApiOrigin()

export const authClient = createAuthClient({
  baseURL: apiOrigin,
  basePath: '/api/auth',
})

export type AuthUser = typeof authClient.$Infer.Session.user
export type AuthSession = typeof authClient.$Infer.Session.session

export type CurrentAuth = {
  user: AuthUser
  session: AuthSession
}

export function safeRedirectPath(value: string | undefined, fallback = '/app') {
  if (!value?.startsWith('/') || value.startsWith('//')) return fallback

  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

export async function getFreshAuthSession(): Promise<CurrentAuth | null> {
  const response = await fetch(`${apiOrigin}/api/me`, {
    cache: 'no-store',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (response.status === 401 || response.status === 403) return null
  if (!response.ok) throw new Error(`Failed to fetch current session (${response.status})`)

  const data = (await response.json()) as Partial<CurrentAuth>
  if (!data.user || !data.session) return null

  return {
    user: data.user,
    session: data.session,
  }
}
