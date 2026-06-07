import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/today')({
  component: TodayRedirect,
})

function TodayRedirect() {
  const navigate = useNavigate()
  const todayStr = new Date().toISOString().slice(0, 10)
  useEffect(() => {
    navigate({ to: '/calendar', search: { open: todayStr }, replace: true })
  }, [navigate, todayStr])

  return null
}
