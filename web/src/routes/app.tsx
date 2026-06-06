import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { apiOrigin, authClient } from '#/lib/auth'
import { getServerSession } from '#/lib/session'
import { getServerSubmissions, type Submission } from '#/lib/submissions'

export const Route = createFileRoute('/app')({
  beforeLoad: async () => {
    const auth = await getServerSession()
    if (!auth) {
      throw redirect({
        to: '/login',
        search: {
          redirect: '/app',
        },
      })
    }
  },
  loader: () => getServerSubmissions(),
  component: AppPage,
})

type SubmissionFormState = {
  teamName: string
  projectName: string
  description: string
  repoUrl: string
  demoUrl: string
}

const blankForm: SubmissionFormState = {
  teamName: '',
  projectName: '',
  description: '',
  repoUrl: '',
  demoUrl: '',
}

const endpoint = (path: string) => new URL(path, apiOrigin).toString()

async function responseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? `${response.status} ${response.statusText}`
  } catch {
    return `${response.status} ${response.statusText}`
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(endpoint(path), {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(await responseError(response))
  }

  return (await response.json()) as T
}

async function requestEmpty(path: string, init: RequestInit) {
  const response = await fetch(endpoint(path), {
    credentials: 'include',
    ...init,
  })

  if (!response.ok) {
    throw new Error(await responseError(response))
  }
}

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function nullableText(value: string) {
  return optionalText(value) ?? null
}

function canSubmit(form: SubmissionFormState) {
  return form.teamName.trim().length > 0 && form.projectName.trim().length > 0
}

function createPayload(form: SubmissionFormState) {
  return {
    teamName: form.teamName.trim(),
    projectName: form.projectName.trim(),
    description: optionalText(form.description),
    repoUrl: optionalText(form.repoUrl),
    demoUrl: optionalText(form.demoUrl),
  }
}

function updatePayload(form: SubmissionFormState) {
  return {
    teamName: form.teamName.trim(),
    projectName: form.projectName.trim(),
    description: nullableText(form.description),
    repoUrl: nullableText(form.repoUrl),
    demoUrl: nullableText(form.demoUrl),
  }
}

function formFromSubmission(submission: Submission): SubmissionFormState {
  return {
    teamName: submission.teamName,
    projectName: submission.projectName,
    description: submission.description ?? '',
    repoUrl: submission.repoUrl ?? '',
    demoUrl: submission.demoUrl ?? '',
  }
}

function formatCreatedAt(createdAt: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(createdAt * 1000))
}

function AppPage() {
  const initialSubmissions = Route.useLoaderData()
  const { data: auth } = authClient.useSession()
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [createForm, setCreateForm] = useState<SubmissionFormState>(blankForm)
  const [editForm, setEditForm] = useState<SubmissionFormState>(blankForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedSubmissions = useMemo(
    () => [...submissions].sort((a, b) => b.createdAt - a.createdAt),
    [submissions],
  )

  const linkedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.repoUrl || submission.demoUrl).length,
    [submissions],
  )

  const loadSubmissions = async () => {
    setBusy(true)
    setError(null)

    try {
      const response = await requestJson<{ data: Submission[] }>('/submissions?limit=100')
      setSubmissions(response.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load journal entries')
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit(createForm)) return

    setBusy(true)
    setError(null)

    try {
      const created = await requestJson<Submission>('/submissions', {
        method: 'POST',
        body: JSON.stringify(createPayload(createForm)),
      })
      setSubmissions((current) => [created, ...current])
      setCreateForm(blankForm)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create entry')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingId || !canSubmit(editForm)) return

    setBusy(true)
    setError(null)

    try {
      const updated = await requestJson<Submission>(`/submissions/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(updatePayload(editForm)),
      })
      setSubmissions((current) =>
        current.map((submission) => (submission.id === updated.id ? updated : submission)),
      )
      setEditingId(null)
      setEditForm(blankForm)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update entry')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    setBusy(true)
    setError(null)

    try {
      await requestEmpty(`/submissions/${id}`, {
        method: 'DELETE',
      })
      setSubmissions((current) => current.filter((submission) => submission.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete entry')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (submission: Submission) => {
    setEditingId(submission.id)
    setEditForm(formFromSubmission(submission))
    setError(null)
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-zinc-50">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Workspace</h1>
            <p className="mt-2 text-zinc-600">
              {auth?.user.email
                ? `Signed in as ${auth.user.email}.`
                : 'Overview for status. Journal for notes and reflections.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadSubmissions()}
            disabled={busy}
            className="w-fit rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Overview
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-950">Today at a glance</h2>
            <div className="mt-6 grid gap-4">
              <Metric label="Journal entries" value={String(submissions.length)} />
              <Metric label="Linked entries" value={String(linkedSubmissions)} />
              <Metric label="Mode" value={editingId ? 'Edit' : 'New'} />
            </div>
            <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="font-semibold text-zinc-950">Focus</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Your session scopes the D1 create, read, update, and delete flow to your account.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Journal
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-950">Entries</h2>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr]">
              <SubmissionForm
                title={editingId ? 'Edit entry' : 'New entry'}
                submitLabel={busy ? 'Saving...' : editingId ? 'Save entry' : 'Create entry'}
                form={editingId ? editForm : createForm}
                disabled={busy}
                onChange={editingId ? setEditForm : setCreateForm}
                onSubmit={editingId ? handleUpdate : handleCreate}
                secondaryAction={
                  editingId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setEditForm(blankForm)
                        setError(null)
                      }}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  ) : null
                }
              />

              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">
                    {submissions.length} stored rows
                  </p>
                  {busy ? <p className="text-sm text-slate-500">Syncing...</p> : null}
                </div>

                {sortedSubmissions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                    <h3 className="font-semibold text-slate-950">No entries yet</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Create the first row and it will be written to D1.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {sortedSubmissions.map((submission) => (
                      <JournalEntry
                        key={submission.id}
                        submission={submission}
                        disabled={busy}
                        onEdit={startEdit}
                        onDelete={(id) => void handleDelete(id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  )
}

function SubmissionForm({
  title,
  submitLabel,
  form,
  disabled,
  secondaryAction,
  onChange,
  onSubmit,
}: {
  title: string
  submitLabel: string
  form: SubmissionFormState
  disabled: boolean
  secondaryAction?: ReactNode | null
  onChange: (form: SubmissionFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={onSubmit} className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-950">{title}</h3>
        {secondaryAction}
      </div>
      <div className="grid gap-3">
        <TextField
          label="Team"
          value={form.teamName}
          required
          maxLength={120}
          onChange={(teamName) => onChange({ ...form, teamName })}
        />
        <TextField
          label="Project"
          value={form.projectName}
          required
          maxLength={160}
          onChange={(projectName) => onChange({ ...form, projectName })}
        />
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          <span>Description</span>
          <textarea
            value={form.description}
            maxLength={2000}
            rows={4}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            className="min-h-24 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <TextField
          label="Repository URL"
          value={form.repoUrl}
          inputMode="url"
          onChange={(repoUrl) => onChange({ ...form, repoUrl })}
        />
        <TextField
          label="Demo URL"
          value={form.demoUrl}
          inputMode="url"
          onChange={(demoUrl) => onChange({ ...form, demoUrl })}
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !canSubmit(form)}
        className="mt-4 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  )
}

function TextField({
  label,
  value,
  required,
  maxLength,
  inputMode,
  onChange,
}: {
  label: string
  value: string
  required?: boolean
  maxLength?: number
  inputMode?: 'url'
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input
        value={value}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  )
}

function JournalEntry({
  submission,
  disabled,
  onEdit,
  onDelete,
}: {
  submission: Submission
  disabled: boolean
  onEdit: (submission: Submission) => void
  onDelete: (id: string) => void
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{submission.teamName}</p>
          <h3 className="mt-1 font-semibold text-slate-950">{submission.projectName}</h3>
          <p className="mt-1 text-xs text-slate-500">{formatCreatedAt(submission.createdAt)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onEdit(submission)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDelete(submission.id)}
            className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>
      {submission.description ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{submission.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {submission.repoUrl ? <ExternalLink href={submission.repoUrl}>Repo</ExternalLink> : null}
        {submission.demoUrl ? <ExternalLink href={submission.demoUrl}>Demo</ExternalLink> : null}
      </div>
    </article>
  )
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-100"
    >
      {children}
    </a>
  )
}
