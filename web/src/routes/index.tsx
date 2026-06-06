import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1fr_360px] md:items-center md:py-24">
        <div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
            Build, reflect, and keep momentum.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Unbound is a simple workspace for tracking progress and keeping a lightweight journal
            beside the work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/app"
              className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open app
            </Link>
            <a
              href="#learn-more"
              className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Learn more
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-4 h-2 w-24 rounded-full bg-slate-200" />
            <div className="space-y-3">
              <div className="h-16 rounded-md border border-slate-200 bg-slate-50" />
              <div className="h-16 rounded-md border border-slate-200 bg-slate-50" />
              <div className="h-24 rounded-md border border-slate-200 bg-slate-50" />
            </div>
          </div>
        </div>
      </section>

      <section id="learn-more" className="border-t border-slate-200 bg-slate-50 px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          <BasicPoint title="See what matters" body="A simple overview for the state of the work." />
          <BasicPoint title="Write it down" body="A journal for notes, decisions, and follow-ups." />
          <BasicPoint title="Stay lightweight" body="No heavy setup. Just enough structure to use." />
        </div>
      </section>
    </main>
  )
}

function BasicPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  )
}
