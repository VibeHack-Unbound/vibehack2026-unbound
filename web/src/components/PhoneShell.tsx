import type { ReactNode } from 'react'

export function PhoneShell({
  children,
  withNav = false,
}: {
  children: ReactNode
  withNav?: boolean
}) {
  return (
    <main className="prototype-stage">
      <section className={withNav ? 'phone-shell with-nav' : 'phone-shell'}>
        <div className="top-strip" />
        {children}
      </section>
    </main>
  )
}
