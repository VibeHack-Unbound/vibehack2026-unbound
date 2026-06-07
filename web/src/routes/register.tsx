import { createFileRoute, redirect, useSearch } from '@tanstack/react-router'

import { AuthPage } from '#/components/AuthPage'
import { getServerSession } from '#/lib/session'

type RegisterSearch = {
  redirect?: string
}

export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const auth = await getServerSession()
    if (!auth) return

    const target =
      typeof search.redirect === 'string' ? search.redirect : undefined
    if (target?.startsWith('/') && !target.startsWith('//')) {
      throw redirect({ to: target })
    }

    throw redirect({ to: '/app' })
  },
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect: redirectTarget } = useSearch({ from: '/register' })
  return <AuthPage mode="register" redirect={redirectTarget} />
}
