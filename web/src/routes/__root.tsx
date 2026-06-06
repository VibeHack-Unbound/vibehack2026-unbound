import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import type { ReactNode } from 'react'

export const Route = createRootRoute({
  component: AppRoot,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
      { name: 'theme-color', content: '#FAF6F0' },
      { title: 'unbound — emotional wellness' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap',
      },
    ],
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF6F0',
      }}
    >
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <p style={{ fontSize: '0.8rem', color: '#A89F94', fontWeight: 700, marginBottom: 8 }}>
          404
        </p>
        <h1 style={{ fontSize: '1.5rem', color: '#2C3E35', marginBottom: 12 }}>page not found</h1>
        <a href="/dashboard" style={{ color: '#80B0E8', fontWeight: 700 }}>
          go home →
        </a>
      </div>
    </main>
  )
}

export function AppRoot() {
  return <Outlet />
}
