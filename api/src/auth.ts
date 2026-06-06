import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import type { Db } from './db/client'

import * as schema from './db/schema'

export type AuthBindings = {
  AUTH_COOKIE_DOMAIN?: string
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  WEB_ORIGIN?: string
}

function isLocalOrigin(origin: string) {
  return origin.includes('localhost') || origin.includes('127.0.0.1')
}

function uniqueOrigins(origins: Array<string | undefined>) {
  return Array.from(new Set(origins.filter((origin): origin is string => Boolean(origin))))
}

function localTrustedOrigins() {
  return [
    'http://localhost:3000',
    'http://localhost:8787',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8787',
    'http://[::1]:3000',
    'http://[::1]:8787',
  ]
}

function hostnameFromOrigin(origin: string) {
  try {
    return new URL(origin).hostname.toLowerCase()
  } catch {
    return undefined
  }
}

function sharedCookieDomain(baseURL: string, webOrigin: string) {
  const authHost = hostnameFromOrigin(baseURL)
  const webHost = hostnameFromOrigin(webOrigin)
  if (!authHost || !webHost || authHost === webHost) return undefined
  if (isLocalOrigin(authHost) || isLocalOrigin(webHost)) return undefined

  const authLabels = authHost.split('.')
  const webLabels = webHost.split('.')
  const commonLabels: string[] = []

  while (authLabels.length > 0 && webLabels.length > 0) {
    const authLabel = authLabels.at(-1)
    const webLabel = webLabels.at(-1)
    if (authLabel !== webLabel || !authLabel) break

    commonLabels.unshift(authLabel)
    authLabels.pop()
    webLabels.pop()
  }

  if (commonLabels.length < 2) return undefined

  const domain = commonLabels.join('.')
  if ((domain === 'workers.dev' || domain === 'pages.dev') && commonLabels.length < 3) {
    return undefined
  }

  return domain
}

function configuredCookieDomain(env: AuthBindings, baseURL: string, webOrigin: string) {
  const explicitDomain = env.AUTH_COOKIE_DOMAIN?.trim().replace(/^\./, '')
  if (explicitDomain && !isLocalOrigin(explicitDomain)) return explicitDomain.toLowerCase()

  return sharedCookieDomain(baseURL, webOrigin)
}

export function createAuth(env: AuthBindings, db: Db, request: Request) {
  const requestOrigin = new URL(request.url).origin
  const baseURL = env.BETTER_AUTH_URL ?? requestOrigin
  const webOrigin = env.WEB_ORIGIN ?? (isLocalOrigin(baseURL) ? 'http://localhost:3000' : baseURL)
  const isLocal = isLocalOrigin(baseURL)
  const cookieDomain = configuredCookieDomain(env, baseURL, webOrigin)
  const secret =
    env.BETTER_AUTH_SECRET ??
    (isLocal ? 'local-development-auth-secret-change-before-production' : undefined)

  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET must be configured outside local development.')
  }

  return betterAuth({
    appName: 'Unbound',
    basePath: '/api/auth',
    baseURL,
    secret,
    trustedOrigins: uniqueOrigins([webOrigin, baseURL, ...(isLocal ? localTrustedOrigins() : [])]),
    trustedProxies: ['*'],
    advanced: {
      cookiePrefix: 'unbound',
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        secure: !isLocal,
      },
      ...(cookieDomain
        ? {
            crossSubDomainCookies: {
              enabled: true,
              domain: cookieDomain,
            },
          }
        : {}),
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip'],
      },
    },
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
      usePlural: false,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
      sendResetPassword: async ({ user, url }) => {
        console.log(`Password reset requested for ${user.email}: ${url}`)
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60,
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
