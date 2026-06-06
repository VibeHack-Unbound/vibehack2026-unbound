import { useCallback, useEffect, useState } from 'react'

import { useSpeechRecognition } from '../features/useSpeechRecognition'
import { useI18n } from '../lib/i18n'
import { CatIllustration } from './CatIllustration'

const prompts = {
  ar: 'كيف كان يومك؟',
  en: 'How was your day?',
  es: '¿Cómo estuvo tu día?',
  fr: "Comment s'est passée ta journée ?",
  ja: '今日はどうだった？',
  ko: '오늘 하루 어땠어?',
  zh: '今天过得怎么样？',
}

function buildCatReply(text: string, language: string) {
  if (language === 'ko') {
    return text
      ? `말해줘서 고마워. "${text}"라고 느낀 하루였구나. 오늘 여기까지 온 것만으로도 충분히 잘했어.`
      : '괜찮아, 천천히 말해도 돼. 내가 여기서 같이 들어줄게.'
  }

  return text
    ? `Thank you for telling me. It sounds like "${text}" was part of your day. You made it through, and that matters.`
    : 'It is okay to take your time. I am here with you.'
}

export function CatAgentSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { language } = useI18n()
  const [userText, setUserText] = useState('')
  const [catReply, setCatReply] = useState(prompts[language])
  const [isThinking, setIsThinking] = useState(false)

  const appendTranscript = useCallback((text: string) => {
    setUserText((current) => [current, text].filter(Boolean).join(' '))
  }, [])

  const { error, isListening, isSupported, toggleListening } = useSpeechRecognition({
    language: language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-GB',
    onTranscript: appendTranscript,
  })

  useEffect(() => {
    if (!isOpen) return

    setCatReply(prompts[language])
  }, [isOpen, language])

  useEffect(() => {
    if (!userText.trim()) return

    const timeout = window.setTimeout(() => {
      setIsThinking(true)

      window.setTimeout(() => {
        const reply = buildCatReply(userText.trim(), language)
        setCatReply(reply)
        setIsThinking(false)

        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(reply)
          utterance.lang = language === 'ko' ? 'ko-KR' : 'en-GB'
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utterance)
        }
      }, 650)
    }, 700)

    return () => window.clearTimeout(timeout)
  }, [language, userText])

  if (!isOpen) return null

  return (
    <div className="sheet-backdrop" role="presentation">
      <section aria-label="Cat voice agent" className="bottom-sheet cat-agent-sheet" role="dialog">
        <button aria-label="Close cat agent" className="sheet-close" onClick={onClose} type="button">
          ×
        </button>
        <CatIllustration mood="happy" size="small" />
        <div className="speech-bubble cat-bubble">
          <p>{isThinking ? (language === 'ko' ? '생각하고 있어...' : 'Thinking...') : catReply}</p>
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
            ? language === 'ko'
              ? '음성은 텍스트로 변환된 뒤 Claude API로 보낼 수 있는 형태로 준비돼요. 지금은 더미 응답으로 연결해뒀어요.'
              : 'Voice is transcribed and prepared for a Claude API call. This prototype currently uses a dummy response.'
            : error || 'Voice input is unavailable in this browser.'}
        </p>
      </section>
    </div>
  )
}
