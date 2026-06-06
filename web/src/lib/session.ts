import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

import { apiOrigin, type CurrentAuth } from './auth'

export type ServerAuthData = CurrentAuth | null

export const getServerSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ServerAuthData> => {
    const cookieHeader = getRequestHeader('cookie')
    if (!cookieHeader) return null

    try {
      const response = await fetch(`${apiOrigin}/api/me`, {
        headers: {
          cookie: cookieHeader,
        },
      })

      if (response.status === 401 || response.status === 403) return null
      if (!response.ok) return null

      const data = (await response.json()) as Partial<CurrentAuth>
      if (!data.user || !data.session) return null

      return {
        user: data.user,
        session: data.session,
      }
    } catch {
      return null
    }
  },
)
