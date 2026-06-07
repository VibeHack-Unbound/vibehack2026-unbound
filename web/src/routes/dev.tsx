import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  formatDuration,
  useDictationStream,
  type DictationSessionResult,
} from '../hooks/useDictationStream'

export const Route = createFileRoute('/dev')({
  component: DevPage,
})

type StoredRecording = {
  dataUrl: string
  durationMs?: number
  mimeType: string
  size: number
}

type AudioInputDevice = Pick<MediaDeviceInfo, 'deviceId' | 'groupId' | 'label'>

type DictationEntry = {
  id: string
  createdAt: number
  durationMs?: number
  transcript: string
  status: 'completed' | 'error'
  error?: string
  recording?: StoredRecording
}

const STORAGE_KEY = 'unbound.dev.dictations.v1'

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

const defaultDeviceName = (label: string) => {
  const normalized = label
    .replace(/^Default\s*-\s*/i, '')
    .replace(/^Default\s*\((.*)\)$/i, '$1')
    .trim()

  return normalized && normalized.toLowerCase() !== 'default' ? normalized : ''
}

const formatAudioInputLabel = (device: AudioInputDevice, index: number) => {
  if (device.deviceId === 'default') {
    const name = defaultDeviceName(device.label)
    return name ? `Default (${name})` : 'Default'
  }

  return device.label || `Microphone ${index + 1}`
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

function DevPage() {
  const [entries, setEntries] = useState<DictationEntry[]>([])
  const [audioInputDevices, setAudioInputDevices] = useState<
    AudioInputDevice[]
  >([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('default')
  const [deviceError, setDeviceError] = useState<string | null>(null)

  const persistEntry = useCallback(async (result: DictationSessionResult) => {
    const recording = result.audioBlob
      ? {
          dataUrl: await blobToDataUrl(result.audioBlob),
          durationMs: result.durationMs,
          mimeType: result.audioBlob.type || 'audio/webm',
          size: result.audioBlob.size,
        }
      : undefined

    const entry: DictationEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      durationMs: result.durationMs,
      ...(result.error ? { error: result.error } : {}),
      ...(recording ? { recording } : {}),
      status: result.status,
      transcript: result.transcript,
    }

    setEntries((current) => {
      const next = [entry, ...current]
      storeEntries(next)
      return next
    })
  }, [])

  const {
    durationMs,
    error,
    interimTranscript,
    isBusy,
    liveTranscript,
    recorderState,
    rmsValue,
    startRecording,
    status,
    stopRecording,
    streamStats,
  } = useDictationStream({
    onComplete: persistEntry,
    selectedDeviceId,
  })

  const rmsPercent = Math.min(100, Math.round(rmsValue * 500))
  const audioInputOptions = useMemo(() => {
    const selectableDevices = audioInputDevices.filter(
      (device) => device.deviceId,
    )

    if (selectableDevices.some((device) => device.deviceId === 'default')) {
      return selectableDevices
    }

    return [
      { deviceId: 'default', groupId: '', label: '' },
      ...selectableDevices,
    ]
  }, [audioInputDevices])
  const erroredEntries = useMemo(
    () => entries.filter((entry) => entry.status === 'error').length,
    [entries],
  )

  const refreshAudioInputDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDeviceError('Input device selection is not available in this browser')
      return
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices
        .filter((device) => device.kind === 'audioinput' && device.deviceId)
        .map(({ deviceId, groupId, label }) => ({ deviceId, groupId, label }))

      setAudioInputDevices(audioInputs)
      setDeviceError(null)
      setSelectedDeviceId((current) => {
        if (current === 'default') return current
        return audioInputs.some((device) => device.deviceId === current)
          ? current
          : 'default'
      })
    } catch (deviceReadError) {
      const message =
        deviceReadError instanceof Error
          ? deviceReadError.message
          : 'Could not read input devices'
      setDeviceError(message)
    }
  }, [])

  useEffect(() => {
    setEntries(loadEntries())
  }, [])

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      void refreshAudioInputDevices()
    }, 0)

    const mediaDevices = navigator.mediaDevices
    mediaDevices?.addEventListener('devicechange', refreshAudioInputDevices)

    return () => {
      window.clearTimeout(refreshTimer)
      mediaDevices?.removeEventListener(
        'devicechange',
        refreshAudioInputDevices,
      )
    }
  }, [refreshAudioInputDevices])

  async function handleStartRecording() {
    await startRecording()
    void refreshAudioInputDevices()
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
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Dev
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Dictation
          </h1>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Metric label="Saved" value={String(entries.length)} />
            <Metric label="Errors" value={String(erroredEntries)} />
            <Metric label="State" value={status} />
            <Metric label="Duration" value={formatDuration(durationMs)} />
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Audio RMS
              </p>
              <span className="font-mono text-lg font-semibold tabular-nums text-slate-950">
                {rmsValue.toFixed(4)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-100"
                style={{ width: `${rmsPercent}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-500">Recorder state</span>
              <span className="font-semibold text-slate-800">
                {recorderState}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-500">Audio sent</span>
              <span className="font-semibold text-slate-800">
                {streamStats.chunksSent} chunks /{' '}
                {formatBytes(streamStats.bytesSent)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-500">Results</span>
              <span className="font-semibold text-slate-800">
                {streamStats.transcriptMessages}/{streamStats.resultMessages}
                {streamStats.emptyResults
                  ? ` (${streamStats.emptyResults} empty)`
                  : ''}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-500">Last message</span>
              <span className="break-words text-right font-semibold text-slate-800">
                {streamStats.lastMessageType}
              </span>
            </div>
          </div>

          <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
            <span>Input device</span>
            <select
              value={selectedDeviceId}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
              disabled={isBusy}
              className="rounded-md border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {audioInputOptions.map((device, index) => (
                <option
                  key={`${device.deviceId}-${device.groupId || index}`}
                  value={device.deviceId}
                >
                  {formatAudioInputLabel(device, index)}
                </option>
              ))}
            </select>
          </label>

          {deviceError ? (
            <p className="mt-2 text-sm text-amber-700">{deviceError}</p>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {status === 'idle' ? (
              <button
                type="button"
                onClick={() => void handleStartRecording()}
                className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void stopRecording()}
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
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Current session
                </h2>
              </div>
              <span className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600">
                {status} / {recorderState} / {formatDuration(durationMs)}
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
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  History
                </h2>
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
                        {typeof entry.durationMs === 'number' ? (
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDuration(entry.durationMs)}
                          </p>
                        ) : null}
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
                          {typeof entry.recording.durationMs === 'number'
                            ? ` / ${formatDuration(entry.recording.durationMs)}`
                            : ''}
                        </p>
                        <audio
                          controls
                          src={entry.recording.dataUrl}
                          className="w-full"
                        />
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
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-semibold text-slate-950">
        {value}
      </p>
    </div>
  )
}
