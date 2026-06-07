import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export const Route = createFileRoute('/dev')({
  component: DevPage,
})

type DictationStatus = 'idle' | 'connecting' | 'recording' | 'stopping'
type RecorderState = 'inactive' | 'recording' | 'paused'

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

type StreamStats = {
  bytesSent: number
  chunksSent: number
  deepgramMessages: number
  emptyResults: number
  resultMessages: number
  transcriptMessages: number
  lastMessageType: string
}

const STORAGE_KEY = 'unbound.dev.dictations.v1'
const recordingMimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
const closeStreamWaitMs = 5000
const initialStreamStats: StreamStats = {
  bytesSent: 0,
  chunksSent: 0,
  deepgramMessages: 0,
  emptyResults: 0,
  resultMessages: 0,
  transcriptMessages: 0,
  lastMessageType: '-',
}

const apiOrigin = () =>
  import.meta.env.VITE_HTTP_API_URL ?? 'http://localhost:8787'

const isLocalApiOrigin = () => {
  const hostname = new URL(apiOrigin()).hostname
  return (
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  )
}

const dictationSocketUrl = () => {
  const url = new URL('/dictation/stream', apiOrigin())
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

const apiEndpoint = (path: string) => new URL(path, apiOrigin()).toString()

async function responseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? `${response.status} ${response.statusText}`
  } catch {
    return `${response.status} ${response.statusText}`
  }
}

async function ensureApiSession() {
  if (isLocalApiOrigin()) return

  const response = await fetch(apiEndpoint('/api/me'), {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await responseError(response))
  }
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

const formatDuration = (durationMs: number) => {
  const totalTenths = Math.floor(durationMs / 100)
  const minutes = Math.floor(totalTenths / 600)
  const seconds = Math.floor((totalTenths % 600) / 10)
  const tenths = totalTenths % 10

  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`
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

const chooseRecordingMimeType = () =>
  recordingMimeTypes.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType),
  ) ?? ''

const appendTranscript = (current: string, next: string) => {
  const trimmed = next.trim()
  if (!trimmed) return current
  return current ? `${current} ${trimmed}` : trimmed
}

const waitForSocketClose = (socket: WebSocket, timeoutMs: number) =>
  new Promise<void>((resolve) => {
    if (socket.readyState === WebSocket.CLOSED) {
      resolve()
      return
    }

    let timeoutId: number | null = null
    const cleanup = () => {
      socket.removeEventListener('close', handleClose)
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      resolve()
    }
    const handleClose = () => cleanup()

    socket.addEventListener('close', handleClose, { once: true })
    timeoutId = window.setTimeout(() => {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close(1000, 'Done')
      }
      cleanup()
    }, timeoutMs)
  })

function DevPage() {
  const [entries, setEntries] = useState<DictationEntry[]>([])
  const [status, setStatus] = useState<DictationStatus>('idle')
  const [recorderState, setRecorderState] = useState<RecorderState>('inactive')
  const [rmsValue, setRmsValue] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const [streamStats, setStreamStats] =
    useState<StreamStats>(initialStreamStats)
  const [audioInputDevices, setAudioInputDevices] = useState<
    AudioInputDevice[]
  >([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('default')
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastRmsUpdateRef = useRef(0)
  const durationIntervalRef = useRef<number | null>(null)
  const sessionStartedAtRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const sentChunkCountRef = useRef(0)
  const finalTranscriptRef = useRef('')
  const interimTranscriptRef = useRef('')
  const mimeTypeRef = useRef('')
  const finishingRef = useRef(false)
  const expectedCloseRef = useRef(false)

  const isBusy = status !== 'idle'
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

    return () => {
      socketRef.current?.close()
      stopAudioMeter(false)
      stopDurationTimer(false)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
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

  const persistEntry = async (
    result: 'completed' | 'error',
    message: string | undefined,
    recordingDurationMs: number,
  ) => {
    const transcript = appendTranscript(
      finalTranscriptRef.current,
      interimTranscriptRef.current,
    ).trim()
    const chunks = chunksRef.current
    const mimeType = mimeTypeRef.current || 'audio/webm'
    const blob = chunks.length > 0 ? new Blob(chunks, { type: mimeType }) : null
    const recording = blob
      ? {
          dataUrl: await blobToDataUrl(blob),
          durationMs: recordingDurationMs,
          mimeType: blob.type || mimeType,
          size: blob.size,
        }
      : undefined

    const entry: DictationEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      durationMs: recordingDurationMs,
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

  function getCurrentDurationMs() {
    const startedAt = sessionStartedAtRef.current
    return startedAt === null ? durationMs : performance.now() - startedAt
  }

  function startDurationTimer() {
    stopDurationTimer()

    const startedAt = performance.now()
    sessionStartedAtRef.current = startedAt
    setDurationMs(0)
    durationIntervalRef.current = window.setInterval(() => {
      setDurationMs(performance.now() - startedAt)
    }, 100)
  }

  function stopDurationTimer(resetValue = true) {
    if (durationIntervalRef.current !== null) {
      window.clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    sessionStartedAtRef.current = null

    if (resetValue) {
      setDurationMs(0)
    }
  }

  const stopRecorder = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      setRecorderState('inactive')
      return
    }

    await new Promise<void>((resolve) => {
      recorder.addEventListener('stop', () => resolve(), { once: true })
      recorder.requestData()
      recorder.stop()
    })
  }

  function stopAudioMeter(resetValue = true) {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    audioSourceRef.current?.disconnect()
    audioSourceRef.current = null
    analyserRef.current = null
    lastRmsUpdateRef.current = 0

    const audioContext = audioContextRef.current
    audioContextRef.current = null

    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close().catch(() => undefined)
    }

    if (resetValue) {
      setRmsValue(0)
    }
  }

  function startAudioMeter(stream: MediaStream) {
    stopAudioMeter()

    try {
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 2048
      const samples = new Float32Array(analyser.fftSize)
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      audioSourceRef.current = source

      const measure = (timestamp: number) => {
        const currentAnalyser = analyserRef.current

        if (!currentAnalyser) return

        currentAnalyser.getFloatTimeDomainData(samples)

        if (timestamp - lastRmsUpdateRef.current >= 100) {
          let sumSquares = 0

          for (const sample of samples) {
            sumSquares += sample * sample
          }

          setRmsValue(Math.sqrt(sumSquares / samples.length))
          lastRmsUpdateRef.current = timestamp
        }

        animationFrameRef.current = requestAnimationFrame(measure)
      }

      animationFrameRef.current = requestAnimationFrame(measure)
    } catch {
      stopAudioMeter()
    }
  }

  const stopTracks = () => {
    stopAudioMeter()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  function flushAudioChunks(socket = socketRef.current) {
    if (socket?.readyState !== WebSocket.OPEN) return

    let chunksSent = 0
    let bytesSent = 0

    while (sentChunkCountRef.current < chunksRef.current.length) {
      const chunk = chunksRef.current[sentChunkCountRef.current]
      socket.send(chunk)
      sentChunkCountRef.current += 1
      chunksSent += 1
      bytesSent += chunk.size
    }

    if (chunksSent > 0) {
      setStreamStats((current) => ({
        ...current,
        bytesSent: current.bytesSent + bytesSent,
        chunksSent: current.chunksSent + chunksSent,
      }))
    }
  }

  const finishSession = async (
    result: 'completed' | 'error',
    message?: string,
  ) => {
    if (finishingRef.current) return
    finishingRef.current = true
    setStatus('stopping')
    const recordedDurationMs = getCurrentDurationMs()
    stopDurationTimer(false)
    setDurationMs(recordedDurationMs)

    const socket = socketRef.current
    expectedCloseRef.current = true
    await stopRecorder()
    flushAudioChunks(socket)
    stopTracks()

    if (result === 'completed' && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'CloseStream' }))
      await waitForSocketClose(socket, closeStreamWaitMs)
    } else if (socket?.readyState === WebSocket.OPEN) {
      socket.close(1000, 'Done')
    } else if (socket?.readyState === WebSocket.CONNECTING) {
      socket.close()
    }

    await persistEntry(result, message, recordedDurationMs)

    socketRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
    sentChunkCountRef.current = 0
    mimeTypeRef.current = ''
    finishingRef.current = false
    setRecorderState('inactive')
    stopDurationTimer()
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
    setRecorderState('inactive')
    setRmsValue(0)
    setDurationMs(0)
    setLiveTranscript('')
    setInterimTranscript('')
    finalTranscriptRef.current = ''
    interimTranscriptRef.current = ''
    chunksRef.current = []
    sentChunkCountRef.current = 0
    setStreamStats(initialStreamStats)
    finishingRef.current = false
    expectedCloseRef.current = false

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone capture is not available in this browser')
      }

      await ensureApiSession()

      const mimeType = chooseRecordingMimeType()
      mimeTypeRef.current = mimeType || 'audio/webm'
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }

      if (selectedDeviceId !== 'default') {
        audioConstraints.deviceId = { exact: selectedDeviceId }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      })

      streamRef.current = stream
      void refreshAudioInputDevices()
      startAudioMeter(stream)

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      )
      mediaRecorderRef.current = recorder

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size === 0) return

        chunksRef.current.push(event.data)
        try {
          flushAudioChunks()
        } catch {
          handleFailure('Could not send audio to the dictation stream')
        }
      })

      recorder.addEventListener('error', () => {
        handleFailure('Audio recorder error')
      })

      recorder.addEventListener('pause', () => setRecorderState('paused'))
      recorder.addEventListener('resume', () => setRecorderState('recording'))
      recorder.addEventListener('start', () => setRecorderState('recording'))
      recorder.addEventListener('stop', () => setRecorderState('inactive'))

      recorder.start(250)
      setRecorderState(recorder.state as RecorderState)
      startDurationTimer()

      const socket = new WebSocket(dictationSocketUrl())
      socketRef.current = socket

      socket.addEventListener('open', () => {
        try {
          flushAudioChunks(socket)
        } catch {
          handleFailure('Could not send audio to the dictation stream')
          return
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

        const messageType = message.type ?? 'Unknown'
        setStreamStats((current) => ({
          ...current,
          deepgramMessages: current.deepgramMessages + 1,
          lastMessageType: messageType,
        }))

        if (message.type !== 'Results') return

        const transcript = message.channel?.alternatives?.[0]?.transcript ?? ''
        const hasTranscript = Boolean(transcript.trim())
        setStreamStats((current) => ({
          ...current,
          emptyResults: current.emptyResults + (hasTranscript ? 0 : 1),
          resultMessages: current.resultMessages + 1,
          transcriptMessages:
            current.transcriptMessages + (hasTranscript ? 1 : 0),
        }))
        if (!hasTranscript) return

        if (message.is_final || message.speech_final) {
          finalTranscriptRef.current = appendTranscript(
            finalTranscriptRef.current,
            transcript,
          )
          interimTranscriptRef.current = ''
          setLiveTranscript(finalTranscriptRef.current)
          setInterimTranscript('')
          return
        }

        interimTranscriptRef.current = transcript
        setInterimTranscript(transcript)
      })

      socket.addEventListener('close', (event) => {
        setStreamStats((current) => ({
          ...current,
          lastMessageType: event.code ? `Closed ${event.code}` : 'Closed',
        }))
        if (!finishingRef.current && !expectedCloseRef.current) {
          handleFailure('Dictation stream closed unexpectedly')
        }
      })

      socket.addEventListener('error', () => {
        if (!finishingRef.current && !expectedCloseRef.current) {
          handleFailure('Could not connect to the dictation stream')
        }
      })
    } catch (startError) {
      const message =
        startError instanceof Error
          ? startError.message
          : 'Could not start dictation'
      setError(message)
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        void finishSession('error', message)
        return
      }

      stopTracks()
      stopDurationTimer()
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
                            ? ` · ${formatDuration(entry.recording.durationMs)}`
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
