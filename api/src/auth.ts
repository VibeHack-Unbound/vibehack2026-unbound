import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import type { Db } from './db/client'

import * as schema from './db/schema'

export type AuthBindings = {
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

export function createAuth(env: AuthBindings, db: Db, request: Request) {
  const requestOrigin = new URL(request.url).origin
  const baseURL = env.BETTER_AUTH_URL ?? requestOrigin
  const webOrigin = env.WEB_ORIGIN ?? (isLocalOrigin(baseURL) ? 'http://localhost:3000' : baseURL)
  const isLocal = isLocalOrigin(baseURL)
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
    trustedOrigins: uniqueOrigins([webOrigin, baseURL]),
    trustedProxies: ['*'],
    advanced: {
      cookiePrefix: 'unbound',
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        secure: !isLocal,
      },
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
