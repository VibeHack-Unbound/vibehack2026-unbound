import { Link } from '@tanstack/react-router'

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

export function AppHeader() {
  return (
    <header className="app-header">
      <Link
        to="/app/calendar"
        search={{ open: undefined }}
        className="app-header-icon-btn"
        aria-label="calendar"
      >
        <CalendarIcon />
      </Link>
      <Link to="/app" className="app-header-title">
        unbound
      </Link>
      <Link
        to="/app/connect"
        className="app-header-icon-btn"
        aria-label="support"
      >
        <HeartIcon />
      </Link>
    </header>
  )
}
