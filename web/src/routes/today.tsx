import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/today')({
  component: TodayRedirect,
})

/**
 * The Today tab is a shortcut that opens the Calendar with today's date
 * pre-selected and the check-in sheet already open.
 *
 * All actual input logic lives in the Calendar's CheckInSheet component.
 */
function TodayRedirect() {
  const navigate = useNavigate()
  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    navigate({ to: '/calendar', search: { open: todayStr }, replace: true })
  }, [navigate, todayStr])

  // Render nothing while redirecting
  return null
}
