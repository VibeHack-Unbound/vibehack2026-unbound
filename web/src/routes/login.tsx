import { createFileRoute, redirect, useSearch } from '@tanstack/react-router'

import { AuthPage } from '#/components/AuthPage'
import { getServerSession } from '#/lib/session'

type LoginSearch = {
  redirect?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const auth = await getServerSession()
    if (!auth) return

    const target = typeof search.redirect === 'string' ? search.redirect : undefined
    if (target?.startsWith('/') && !target.startsWith('//')) {
      throw redirect({ to: target })
    }

    throw redirect({ to: '/app' })
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTarget } = useSearch({ from: '/login' })
  return <AuthPage mode="login" redirect={redirectTarget} />
}
