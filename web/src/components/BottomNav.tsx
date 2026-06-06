import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState, type ReactNode } from 'react'

import { getTodayEntry } from '../lib/meiData'

type NavItem = {
  icon: ReactNode
  label: string
  to: '/dashboard' | '/calendar' | '/today' | '/connect'
  isCat: boolean
  activePaths?: string[]
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

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

function SupportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  )
}

function CatIcon() {
  return (
    <img
      src="/manus-storage/logo_4a50b44a.png"
      alt="unbound cat"
      width={28}
      height={28}
      style={{ objectFit: 'contain' }}
    />
  )
}

const navItems: NavItem[] = [
  { icon: <HomeIcon />, label: 'home', to: '/dashboard', isCat: false },
  { icon: <CalendarIcon />, label: 'calendar', to: '/calendar', isCat: false },
  { icon: <CatIcon />, label: 'today', to: '/today', isCat: true, activePaths: ['/check-in'] },
  { icon: <SupportIcon />, label: 'support', to: '/connect', isCat: false },
] as const

const NUDGE_KEY = 'unbound_today_nudge_dismissed'

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function shouldShowNudge(): boolean {
  const todayEntry = getTodayEntry()
  if (todayEntry) return false

  try {
    const dismissed = localStorage.getItem(NUDGE_KEY)
    return dismissed !== getTodayKey()
  } catch {
    return true
  }
}

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [showNudge, setShowNudge] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowNudge(shouldShowNudge())
    }, 900)

    return () => clearTimeout(timeout)
  }, [pathname])

  function dismissNudge() {
    try {
      localStorage.setItem(NUDGE_KEY, getTodayKey())
    } catch {
      // Ignore unavailable localStorage.
    }

    setShowNudge(false)
  }

  return (
    <nav className="bottom-nav" aria-label="App navigation">
      {navItems.map((item) => {
        const active =
          pathname === item.to ||
          item.activePaths?.includes(pathname) === true ||
          (item.to === '/dashboard' && pathname === '/')

        return (
          <Link
            aria-label={item.to === '/today' ? 'log today' : undefined}
            className={`bottom-nav-item${item.isCat ? ' cat-tab' : ''}`}
            data-active={active}
            key={item.to}
            onClick={item.to === '/today' ? dismissNudge : undefined}
            to={item.to}
          >
            {item.icon}
            <strong>{item.label}</strong>

            {item.to === '/today' && showNudge ? (
              <div className="today-nudge" aria-live="polite">
                how are you feeling today?
              </div>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
