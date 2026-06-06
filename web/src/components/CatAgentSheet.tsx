import { useCallback, useEffect, useState } from 'react'

import { useSpeechRecognition } from '../features/useSpeechRecognition'
import { CatIllustration } from './CatIllustration'

const prompt = 'How was your day?'

function buildCatReply(text: string) {
  return text
    ? `Thank you for telling me. It sounds like "${text}" was part of your day. You made it through, and that matters.`
    : 'It is okay to take your time. I am here with you.'
}

export function CatAgentSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [userText, setUserText] = useState('')
  const [catReply, setCatReply] = useState(prompt)
  const [isThinking, setIsThinking] = useState(false)

  const appendTranscript = useCallback((text: string) => {
    setUserText((current) => [current, text].filter(Boolean).join(' '))
  }, [])

  const { error, isListening, isSupported, toggleListening } = useSpeechRecognition({
    language: 'en-GB',
    onTranscript: appendTranscript,
  })

  useEffect(() => {
    if (!isOpen) return

    setCatReply(prompt)
  }, [isOpen])

  useEffect(() => {
    if (!userText.trim()) return

    const timeout = window.setTimeout(() => {
      setIsThinking(true)

      window.setTimeout(() => {
        const reply = buildCatReply(userText.trim())
        setCatReply(reply)
        setIsThinking(false)

        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(reply)
          utterance.lang = 'en-GB'
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utterance)
        }
      }, 650)
    }, 700)

    return () => window.clearTimeout(timeout)
  }, [userText])

  if (!isOpen) return null

  return (
    <div className="sheet-backdrop" role="presentation">
      <section aria-label="Cat voice agent" className="bottom-sheet cat-agent-sheet" role="dialog">
        <button aria-label="Close cat agent" className="sheet-close" onClick={onClose} type="button">
          ×
        </button>
        <CatIllustration tier={1} size={90} />
        <div className="speech-bubble cat-bubble">
          <p>{isThinking ? 'Thinking...' : catReply}</p>
        </div>
        {userText ? (
          <div className="speech-bubble user-bubble">
            <p>{userText}</p>
          </div>
        ) : null}
        <button aria-pressed={isListening} className="agent-mic" data-listening={isListening} onClick={toggleListening} type="button">
          {isListening ? 'Stop listening' : 'Start voice'}
        </button>
        <p className="quiet-note">
          {isSupported
            ? 'Voice is transcribed and prepared for a Claude API call. This prototype currently uses a dummy response.'
            : error || 'Voice input is unavailable in this browser.'}
        </p>
      </section>
    </div>
  )
}
