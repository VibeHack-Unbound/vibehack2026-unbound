import { Link, useRouterState } from '@tanstack/react-router'

import { useI18n } from '../lib/i18n'

const navItems = [
  { icon: '📊', labelKey: 'dashboard', to: '/dashboard' },
  { icon: '📅', labelKey: 'checkIn', to: '/check-in' },
  { icon: '🐈‍⬛', labelKey: 'catAgent', to: '/cat-agent' },
  { icon: '🤝', labelKey: 'support', to: '/connect' },
] as const

export function BottomNav() {
  const { t } = useI18n()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav className="bottom-nav" aria-label="App navigation">
      {navItems.map((item) => (
        <Link className="bottom-nav-item" data-active={pathname === item.to} key={item.to} to={item.to}>
          <span aria-hidden="true">{item.icon}</span>
          <strong>{t(item.labelKey)}</strong>
        </Link>
      ))}
    </nav>
  )
}
