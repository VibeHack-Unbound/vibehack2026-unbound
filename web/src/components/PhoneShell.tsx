import type { ReactNode } from 'react'

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <main className="prototype-stage">
      <section className="phone-shell">
        <div className="top-strip" />
        {children}
      </section>
    </main>
  )
}
