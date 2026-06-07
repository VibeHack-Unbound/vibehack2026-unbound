import { useCallback, useEffect, useRef, useState } from 'react'

export type DictationStatus = 'idle' | 'connecting' | 'recording' | 'stopping'
export type RecorderState = 'inactive' | 'recording' | 'paused'
export type DictationReadiness = 'idle' | 'requesting-mic' | 'mic-live' | 'stream-open' | 'stopping'
export type DictationPrewarmStatus = 'idle' | 'checking' | 'ready' | 'error'
export type TranscriptStreamStatus = 'idle' | 'connecting' | 'open'

export type StreamStats = {
  bytesSent: number
  chunksSent: number
  deepgramMessages: number
  emptyResults: number
  resultMessages: number
  transcriptMessages: number
  lastMessageType: string
}

export type DictationSessionResult = {
  audioBlob?: Blob
  durationMs: number
  error?: string
  status: 'completed' | 'error'
  transcript: string
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

type UseDictationStreamOptions = {
  onComplete?: (result: DictationSessionResult) => void | Promise<void>
  selectedDeviceId?: string
}

const recordingMimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
const closeStreamWaitMs = 5000

export const initialStreamStats: StreamStats = {
  bytesSent: 0,
  chunksSent: 0,
  deepgramMessages: 0,
  emptyResults: 0,
  resultMessages: 0,
  transcriptMessages: 0,
  lastMessageType: '-',
}

export const apiOrigin = () => import.meta.env.VITE_HTTP_API_URL ?? 'http://localhost:8787'

const apiEndpoint = (path: string) => new URL(path, apiOrigin()).toString()

const dictationSocketUrl = () => {
  const url = new URL('/dictation/stream', apiOrigin())
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

const isLocalApiOrigin = () => {
  const hostname = new URL(apiOrigin()).hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

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

const chooseRecordingMimeType = () =>
  recordingMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? ''

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
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close(1000, 'Done')
      }
      cleanup()
    }, timeoutMs)
  })

export function formatDuration(durationMs: number) {
  const totalTenths = Math.floor(durationMs / 100)
  const minutes = Math.floor(totalTenths / 600)
  const seconds = Math.floor((totalTenths % 600) / 10)
  const tenths = totalTenths % 10

  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`
}

export function useDictationStream({
  onComplete,
  selectedDeviceId = 'default',
}: UseDictationStreamOptions = {}) {
  const [status, setStatus] = useState<DictationStatus>('idle')
  const [recorderState, setRecorderState] = useState<RecorderState>('inactive')
  const [rmsValue, setRmsValue] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const [streamStats, setStreamStats] = useState<StreamStats>(initialStreamStats)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<DictationReadiness>('idle')
  const [prewarmStatus, setPrewarmStatus] = useState<DictationPrewarmStatus>('idle')
  const [transcriptStreamStatus, setTranscriptStreamStatus] =
    useState<TranscriptStreamStatus>('idle')

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
  const onCompleteRef = useRef(onComplete)
  const recordingActiveRef = useRef(false)

  const isBusy = status !== 'idle'
  const isMicLive = readiness === 'mic-live' || readiness === 'stream-open'
  const isTranscriptStreamReady = readiness === 'stream-open'
  const isSessionPrewarmed = prewarmStatus === 'ready'
  const isTranscriptStreamPrewarmed = isSessionPrewarmed
  const transcript = appendTranscript(liveTranscript, interimTranscript)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const stopDurationTimer = useCallback((resetValue = true) => {
    if (durationIntervalRef.current !== null) {
      window.clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    sessionStartedAtRef.current = null

    if (resetValue) {
      setDurationMs(0)
    }
  }, [])

  const stopAudioMeter = useCallback((resetValue = true) => {
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
  }, [])

  const stopTracks = useCallback(() => {
    stopAudioMeter()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [stopAudioMeter])

  const cleanupSession = useCallback(() => {
    socketRef.current?.close()
    socketRef.current = null
    recordingActiveRef.current = false
    setTranscriptStreamStatus('idle')
    stopAudioMeter(false)
    stopDurationTimer(false)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setReadiness('idle')
  }, [stopAudioMeter, stopDurationTimer])

  useEffect(() => cleanupSession, [cleanupSession])

  const getCurrentDurationMs = useCallback(() => {
    const startedAt = sessionStartedAtRef.current
    return startedAt === null ? durationMs : performance.now() - startedAt
  }, [durationMs])

  const startDurationTimer = useCallback(() => {
    stopDurationTimer()

    const startedAt = performance.now()
    sessionStartedAtRef.current = startedAt
    setDurationMs(0)
    durationIntervalRef.current = window.setInterval(() => {
      setDurationMs(performance.now() - startedAt)
    }, 100)
  }, [stopDurationTimer])

  const startAudioMeter = useCallback(
    (stream: MediaStream) => {
      stopAudioMeter()

      try {
        const audioContext = new AudioContext()
        if (audioContext.state === 'suspended') {
          void audioContext.resume().catch(() => undefined)
        }
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
    },
    [stopAudioMeter],
  )

  const flushAudioChunks = useCallback((socket = socketRef.current) => {
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
  }, [])

  const stopRecorder = useCallback(async () => {
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
  }, [])

  const finishSession = useCallback(
    async (result: 'completed' | 'error', message?: string) => {
      if (finishingRef.current) {
        return undefined
      }

      finishingRef.current = true
      setReadiness('stopping')
      setStatus('stopping')
      const recordedDurationMs = getCurrentDurationMs()
      stopDurationTimer(false)
      setDurationMs(recordedDurationMs)

      const socket = socketRef.current
      expectedCloseRef.current = true
      recordingActiveRef.current = false
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

      const sessionTranscript = appendTranscript(
        finalTranscriptRef.current,
        interimTranscriptRef.current,
      ).trim()
      const mimeType = mimeTypeRef.current || 'audio/webm'
      const chunks = chunksRef.current
      const audioBlob = chunks.length > 0 ? new Blob(chunks, { type: mimeType }) : undefined

      const sessionResult: DictationSessionResult = {
        ...(audioBlob ? { audioBlob } : {}),
        durationMs: recordedDurationMs,
        ...(message ? { error: message } : {}),
        status: result,
        transcript: sessionTranscript,
      }

      if (result === 'completed') {
        setLiveTranscript(sessionTranscript)
        setError(null)
      } else {
        setError(message ?? 'Dictation failed')
      }

      await onCompleteRef.current?.(sessionResult)
      socketRef.current = null
      mediaRecorderRef.current = null
      chunksRef.current = []
      sentChunkCountRef.current = 0
      mimeTypeRef.current = ''
      finishingRef.current = false
      setTranscriptStreamStatus('idle')
      setRecorderState('inactive')
      stopDurationTimer()
      setReadiness('idle')
      setStatus('idle')
      setInterimTranscript('')

      return sessionResult
    },
    [flushAudioChunks, getCurrentDurationMs, stopDurationTimer, stopRecorder, stopTracks],
  )

  const handleFailure = useCallback(
    (message: string) => {
      setError(message)
      void finishSession('error', message)
    },
    [finishSession],
  )

  const connectTranscriptStream = useCallback(async () => {
    const existingSocket = socketRef.current

    if (existingSocket?.readyState === WebSocket.OPEN) {
      setTranscriptStreamStatus('open')
      flushAudioChunks(existingSocket)
      setStatus('recording')
      setReadiness('stream-open')

      return existingSocket
    }

    if (existingSocket?.readyState === WebSocket.CONNECTING) {
      setTranscriptStreamStatus('connecting')
      return existingSocket
    }

    try {
      setTranscriptStreamStatus('connecting')
      await ensureApiSession()
      setPrewarmStatus('ready')

      const socket = new WebSocket(dictationSocketUrl())
      socketRef.current = socket

      socket.addEventListener('open', () => {
        setTranscriptStreamStatus('open')

        if (!recordingActiveRef.current) {
          socket.close(1000, 'Recording stopped')
          return
        }

        try {
          flushAudioChunks(socket)
        } catch {
          handleFailure('Could not send audio to the dictation stream')
          return
        }

        setStatus('recording')
        setReadiness('stream-open')
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

        const messageTranscript = message.channel?.alternatives?.[0]?.transcript ?? ''
        const hasTranscript = Boolean(messageTranscript.trim())
        setStreamStats((current) => ({
          ...current,
          emptyResults: current.emptyResults + (hasTranscript ? 0 : 1),
          resultMessages: current.resultMessages + 1,
          transcriptMessages: current.transcriptMessages + (hasTranscript ? 1 : 0),
        }))
        if (!hasTranscript) return

        if (message.is_final || message.speech_final) {
          finalTranscriptRef.current = appendTranscript(
            finalTranscriptRef.current,
            messageTranscript,
          )
          interimTranscriptRef.current = ''
          setLiveTranscript(finalTranscriptRef.current)
          setInterimTranscript('')
          return
        }

        interimTranscriptRef.current = messageTranscript
        setInterimTranscript(messageTranscript)
      })

      socket.addEventListener('close', (event) => {
        setTranscriptStreamStatus('idle')
        socketRef.current = null
        setStreamStats((current) => ({
          ...current,
          lastMessageType: event.code ? `Closed ${event.code}` : 'Closed',
        }))
        if (recordingActiveRef.current && !finishingRef.current && !expectedCloseRef.current) {
          handleFailure('Dictation stream closed unexpectedly')
        }
      })

      socket.addEventListener('error', () => {
        setTranscriptStreamStatus('idle')
        if (recordingActiveRef.current && !finishingRef.current && !expectedCloseRef.current) {
          handleFailure('Could not connect to the dictation stream')
        }
      })

      return socket
    } catch (connectError) {
      setTranscriptStreamStatus('idle')
      const message =
        connectError instanceof Error
          ? connectError.message
          : 'Could not connect to the dictation stream'
      handleFailure(message)

      return undefined
    }
  }, [flushAudioChunks, handleFailure])

  const startRecording = useCallback(async () => {
    if (isBusy) return

    setStatus('connecting')
    setReadiness('requesting-mic')
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
    recordingActiveRef.current = true

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone capture is not available in this browser')
      }

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
      startAudioMeter(stream)
      setReadiness('mic-live')

      const mimeType = chooseRecordingMimeType()
      mimeTypeRef.current = mimeType || 'audio/webm'

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
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
      void connectTranscriptStream()
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : 'Could not start dictation'
      setError(message)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        void finishSession('error', message)
        return
      }

      stopTracks()
      stopDurationTimer()
      setReadiness('idle')
      recordingActiveRef.current = false
      setStatus('idle')
    }
  }, [
    finishSession,
    flushAudioChunks,
    handleFailure,
    isBusy,
    selectedDeviceId,
    connectTranscriptStream,
    startAudioMeter,
    startDurationTimer,
    stopDurationTimer,
    stopTracks,
  ])

  const stopRecording = useCallback(async () => {
    if (status === 'idle') return undefined
    return finishSession('completed')
  }, [finishSession, status])

  const resetSession = useCallback(() => {
    setError(null)
    setLiveTranscript('')
    setInterimTranscript('')
    setDurationMs(0)
    setRmsValue(0)
    setStreamStats(initialStreamStats)
    setReadiness('idle')
    finalTranscriptRef.current = ''
    interimTranscriptRef.current = ''
  }, [])

  const prewarmSession = useCallback(async () => {
    if (isBusy || prewarmStatus === 'checking' || prewarmStatus === 'ready') {
      return
    }

    setPrewarmStatus('checking')

    try {
      await ensureApiSession()
      setPrewarmStatus('ready')
    } catch (prewarmError) {
      const message =
        prewarmError instanceof Error ? prewarmError.message : 'Could not prepare voice check-in'
      setPrewarmStatus('error')
      setError(message)
    }
  }, [isBusy, prewarmStatus])

  return {
    durationMs,
    error,
    interimTranscript,
    isBusy,
    isMicLive,
    isSessionPrewarmed,
    isTranscriptStreamReady,
    isTranscriptStreamPrewarmed,
    liveTranscript,
    prewarmSession,
    prewarmStatus,
    readiness,
    recorderState,
    resetSession,
    rmsValue,
    startRecording,
    status,
    stopRecording,
    streamStats,
    transcript,
    transcriptStreamStatus,
  }
}
