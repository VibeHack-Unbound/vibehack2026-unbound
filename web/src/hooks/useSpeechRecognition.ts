import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type SpeechRecognitionConstructor = new () => SpeechRecognition

type SpeechRecognition = EventTarget & {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionErrorEvent = Event & {
  error: string
}

type SpeechRecognitionEvent = Event & {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: {
        transcript: string
      }
    }
  }
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export function useSpeechRecognition({
  language,
  onTranscript,
}: {
  language: string
  onTranscript: (text: string) => void
}) {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false

    return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (!Recognition) return

    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language

    recognition.onresult = (event) => {
      let finalText = ''

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index]

        if (result?.isFinal) {
          finalText += result[0]?.transcript ?? ''
        }
      }

      if (finalText.trim()) {
        onTranscript(finalText.trim())
      }
    }

    recognition.onerror = (event) => {
      setError(event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [language, onTranscript])

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current

    if (!recognition) {
      setError('unsupported')
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      return
    }

    setError(null)
    recognition.start()
    setIsListening(true)
  }, [isListening])

  return { error, isListening, isSupported, toggleListening }
}
