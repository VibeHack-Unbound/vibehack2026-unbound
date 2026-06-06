import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

export const Route = createFileRoute('/dev')({
  component: DevPage,
})

type DictationStatus = 'idle' | 'connecting' | 'recording' | 'stopping'

type StoredRecording = {
  dataUrl: string
  mimeType: string
  size: number
}

type DictationEntry = {
  id: string
  createdAt: number
  transcript: string
  status: 'completed' | 'error'
  error?: string
  recording?: StoredRecording
}

type DeepgramResultMessage = {
  type?: string
  error?: string
  is_final?: boolean
  speech_final?: boolean
  channel?: {
    alternatives?: Array<{
      transcript?: string
    }>
  }
}

const STORAGE_KEY = 'unbound.dev.dictations.v1'
const recordingMimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

const apiOrigin = () => import.meta.env.VITE_HTTP_API_URL ?? 'http://localhost:8787'

const dictationSocketUrl = () => {
  const url = new URL('/dictation/stream', apiOrigin())
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

const formatDateTime = (value: number) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const loadEntries = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DictationEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const storeEntries = (entries: DictationEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () =>
      reject(reader.error ?? new Error('Could not read audio')),
    )
    reader.readAsDataURL(blob)
  })

const chooseRecordingMimeType = () =>
  recordingMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? ''

const appendTranscript = (current: string, next: string) => {
  const trimmed = next.trim()
  if (!trimmed) return current
  return current ? `${current} ${trimmed}` : trimmed
}

function DevPage() {
  const [entries, setEntries] = useState<DictationEntry[]>([])
  const [status, setStatus] = useState<DictationStatus>('idle')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const finalTranscriptRef = useRef('')
  const mimeTypeRef = useRef('')
  const finishingRef = useRef(false)
  const expectedCloseRef = useRef(false)

  const isBusy = status !== 'idle'
  const erroredEntries = useMemo(
    () => entries.filter((entry) => entry.status === 'error').length,
    [entries],
  )

  useEffect(() => {
    setEntries(loadEntries())

    return () => {
      socketRef.current?.close()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const persistEntry = async (result: 'completed' | 'error', message?: string) => {
    const transcript = finalTranscriptRef.current.trim()
    const chunks = chunksRef.current
    const mimeType = mimeTypeRef.current || 'audio/webm'
    const blob = chunks.length > 0 ? new Blob(chunks, { type: mimeType }) : null
    const recording =
      result === 'error' && blob
        ? {
            dataUrl: await blobToDataUrl(blob),
            mimeType: blob.type || mimeType,
            size: blob.size,
          }
        : undefined

    const entry: DictationEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      transcript,
      status: result,
      ...(message ? { error: message } : {}),
      ...(recording ? { recording } : {}),
    }

    setEntries((current) => {
      const next = [entry, ...current]
      storeEntries(next)
      return next
    })
  }

  const stopRecorder = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    await new Promise<void>((resolve) => {
      recorder.addEventListener('stop', () => resolve(), { once: true })
      recorder.requestData()
      recorder.stop()
    })
  }

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const finishSession = async (result: 'completed' | 'error', message?: string) => {
    if (finishingRef.current) return
    finishingRef.current = true
    setStatus('stopping')

    const socket = socketRef.current
    expectedCloseRef.current = true
    await stopRecorder()
    stopTracks()

    if (result === 'completed' && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'Finalize' }))
      await new Promise((resolve) => setTimeout(resolve, 700))
    }

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'CloseStream' }))
      socket.close(1000, 'Done')
    } else if (socket?.readyState === WebSocket.CONNECTING) {
      socket.close()
    }

    await persistEntry(result, message)

    socketRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
    mimeTypeRef.current = ''
    finishingRef.current = false
    setStatus('idle')
    setInterimTranscript('')

    if (result === 'completed') {
      setError(null)
    }
  }

  const handleFailure = (message: string) => {
    setError(message)
    void finishSession('error', message)
  }

  const startRecording = async () => {
    if (isBusy) return

    setStatus('connecting')
    setError(null)
    setLiveTranscript('')
    setInterimTranscript('')
    finalTranscriptRef.current = ''
    chunksRef.current = []
    finishingRef.current = false
    expectedCloseRef.current = false

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone capture is not available in this browser')
      }

      const mimeType = chooseRecordingMimeType()
      mimeTypeRef.current = mimeType || 'audio/webm'
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size === 0) return

        chunksRef.current.push(event.data)
        const socket = socketRef.current
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(event.data)
        }
      })

      recorder.addEventListener('error', () => {
        handleFailure('Audio recorder error')
      })

      recorder.start(250)

      const socket = new WebSocket(dictationSocketUrl())
      socketRef.current = socket

      socket.addEventListener('open', () => {
        for (const chunk of chunksRef.current) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(chunk)
          }
        }
        setStatus('recording')
      })

      socket.addEventListener('message', (event) => {
        let message: DeepgramResultMessage

        try {
          message = JSON.parse(String(event.data)) as DeepgramResultMessage
        } catch {
          handleFailure('Received an unreadable dictation message')
          return
        }

        if (message.type === 'ProxyError') {
          handleFailure(message.error ?? 'Deepgram proxy error')
          return
        }

        if (message.type !== 'Results') return

        const transcript = message.channel?.alternatives?.[0]?.transcript ?? ''
        if (!transcript.trim()) return

        if (message.is_final || message.speech_final) {
          finalTranscriptRef.current = appendTranscript(finalTranscriptRef.current, transcript)
          setLiveTranscript(finalTranscriptRef.current)
          setInterimTranscript('')
          return
        }

        setInterimTranscript(transcript)
      })

      socket.addEventListener('close', () => {
        if (!finishingRef.current && !expectedCloseRef.current) {
          handleFailure('Dictation stream closed unexpectedly')
        }
      })

      socket.addEventListener('error', () => {
        handleFailure('Could not connect to the dictation stream')
      })
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : 'Could not start dictation'
      setError(message)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        void finishSession('error', message)
        return
      }

      stopTracks()
      setStatus('idle')
    }
  }

  const deleteEntry = (id: string) => {
    setEntries((current) => {
      const next = current.filter((entry) => entry.id !== id)
      storeEntries(next)
      return next
    })
  }

  const clearEntries = () => {
    setEntries([])
    storeEntries([])
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50">
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[380px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Dev</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Dictation</h1>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Metric label="Saved" value={String(entries.length)} />
            <Metric label="Errors" value={String(erroredEntries)} />
            <Metric label="State" value={status} />
          </div>

          {error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {status === 'idle' ? (
              <button
                type="button"
                onClick={() => void startRecording()}
                className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void finishSession('completed')}
                disabled={status === 'stopping'}
                className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Stop
              </button>
            )}

            <button
              type="button"
              onClick={clearEntries}
              disabled={entries.length === 0 || isBusy}
              className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </aside>

        <section className="grid gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Live
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Current session</h2>
              </div>
              <span className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600">
                {status}
              </span>
            </div>

            <div className="mt-5 min-h-48 rounded-lg border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-800">
              {liveTranscript ? <span>{liveTranscript}</span> : null}
              {interimTranscript ? (
                <span className="text-slate-400">
                  {liveTranscript ? ' ' : ''}
                  {interimTranscript}
                </span>
              ) : null}
              {!liveTranscript && !interimTranscript ? (
                <span className="text-slate-400">No transcript yet</span>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Local
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">History</h2>
              </div>
              <p className="text-sm text-slate-500">{STORAGE_KEY}</p>
            </div>

            {entries.length === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                No saved sessions
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {formatDateTime(entry.createdAt)}
                        </p>
                        <p
                          className={
                            entry.status === 'error'
                              ? 'mt-1 text-sm font-medium text-red-700'
                              : 'mt-1 text-sm font-medium text-emerald-700'
                          }
                        >
                          {entry.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteEntry(entry.id)}
                        disabled={isBusy}
                        className="w-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>

                    {entry.error ? (
                      <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                        {entry.error}
                      </p>
                    ) : null}

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {entry.transcript || 'No transcript captured'}
                    </p>

                    {entry.recording ? (
                      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Recording {formatBytes(entry.recording.size)}
                        </p>
                        <audio controls src={entry.recording.dataUrl} className="w-full" />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold text-slate-950">{value}</p>
    </div>
  )
}
