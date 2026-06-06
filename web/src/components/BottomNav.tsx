import { Link, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'

type NavItem = {
  icon: ReactNode
  label: string
  to: '/dashboard' | '/calendar' | '/today' | '/connect'
  isCat: boolean
  activePaths?: string[]
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function SupportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  )
}
function CatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C9 3 7 5 7 8c0 1.2.4 2.3 1 3.1L7 13h1.5l.6-1C10 12.6 11 13 12 13s2-.4 2.9-1l.6 1H17l-1-1.9c.6-.8 1-1.9 1-3.1 0-3-2-5-6-5zm-1.5 4c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm3 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm-1.5 3.5c-.8 0-1.5-.2-2-.6.2-.1.4-.1.5-.1h3c.2 0 .4 0 .5.1-.5.4-1.2.6-2 .6zM7 15c-2.2 0-4 1.8-4 4v1h18v-1c0-2.2-1.8-4-4-4H7z"/>
    </svg>
  )
}

const navItems: NavItem[] = [
  { icon: <HomeIcon />, label: 'home', to: '/dashboard', isCat: false },
  { icon: <CalendarIcon />, label: 'calendar', to: '/calendar', isCat: false },
  { icon: <CatIcon />, label: 'today', to: '/today', isCat: true, activePaths: ['/check-in'] },
  { icon: <SupportIcon />, label: 'support', to: '/connect', isCat: false },
] as const

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return (
    <nav className="bottom-nav" aria-label="App navigation">
      {navItems.map((item) => (
        <Link
          className={`bottom-nav-item${item.isCat ? ' cat-tab' : ''}`}
          data-active={
            pathname === item.to ||
            item.activePaths?.includes(pathname) === true ||
            (item.to === '/dashboard' && pathname === '/')
          }
          key={item.to}
          to={item.to}
        >
          {item.icon}
          <strong>{item.label}</strong>
        </Link>
      ))}
    </nav>
  )
}
