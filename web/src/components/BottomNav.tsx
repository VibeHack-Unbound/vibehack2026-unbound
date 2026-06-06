import { Link, useRouterState } from '@tanstack/react-router'

const navItems = [
  { icon: '📊', label: 'Dashboard', to: '/dashboard' },
  { icon: '📅', label: 'Check-in', to: '/check-in' },
  { icon: '🐈‍⬛', label: 'Cat Agent', to: '/cat-agent' },
  { icon: '🤝', label: 'Support', to: '/connect' },
] as const

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav className="bottom-nav" aria-label="App navigation">
      {navItems.map((item) => (
        <Link className="bottom-nav-item" data-active={pathname === item.to} key={item.to} to={item.to}>
          <span aria-hidden="true">{item.icon}</span>
          <strong>{item.label}</strong>
        </Link>
      ))}
    </nav>
  )
}
