import { createContext, useContext, useMemo, useState } from 'react'

import type { ReactNode } from 'react'

export type Language = 'en' | 'ko' | 'ja' | 'zh' | 'es' | 'fr' | 'ar'
type TranslationKey =
  | 'anxiety'
  | 'catAgent'
  | 'checkIn'
  | 'connect'
  | 'dashboard'
  | 'energy'
  | 'findTherapist'
  | 'greeting'
  | 'howFeeling'
  | 'language'
  | 'moodTrend'
  | 'onboarding'
  | 'saveToday'
  | 'sleep'
  | 'support'
  | 'tabQuick'
  | 'tabWrite'
  | 'voiceUnsupported'
  | 'weekGlance'
  | 'writePlaceholder'

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    anxiety: 'Anxiety',
    catAgent: 'Cat Agent',
    checkIn: 'Check-in',
    connect: 'Connect',
    dashboard: 'Dashboard',
    energy: 'Energy',
    findTherapist: 'Find a therapist nearby',
    greeting: 'Good morning',
    howFeeling: 'How are you feeling today?',
    language: 'Language',
    moodTrend: 'Mood this week',
    onboarding: 'Onboarding',
    saveToday: 'Save today',
    sleep: 'Sleep',
    support: 'Support',
    tabQuick: 'Quick',
    tabWrite: 'Write',
    voiceUnsupported: 'Voice input is not available in this browser.',
    weekGlance: 'Your week at a glance',
    writePlaceholder: "What's on your mind today? Write as much or as little as you like.",
  },
  ko: {
    anxiety: '불안도',
    catAgent: '고양이 에이전트',
    checkIn: '체크인',
    connect: '연결',
    dashboard: '대시보드',
    energy: '에너지',
    findTherapist: '근처 상담사 찾기',
    greeting: '안녕하세요',
    howFeeling: '오늘 기분이 어떠세요?',
    language: '언어',
    moodTrend: '이번 주 기분 변화',
    onboarding: '온보딩',
    saveToday: '오늘 저장하기',
    sleep: '수면',
    support: '지원',
    tabQuick: '빠른 체크',
    tabWrite: '글쓰기',
    voiceUnsupported: '이 브라우저에서는 음성 입력을 사용할 수 없습니다.',
    weekGlance: '이번 주 한눈에 보기',
    writePlaceholder: '오늘 무슨 생각을 하고 있나요? 원하는 만큼 자유롭게 적어보세요.',
  },
  ja: {
    anxiety: '不安',
    catAgent: '猫エージェント',
    checkIn: 'チェックイン',
    connect: '接続',
    dashboard: 'ダッシュボード',
    energy: 'エネルギー',
    findTherapist: '近くのセラピストを探す',
    greeting: 'こんにちは',
    howFeeling: '今日の気分はいかがですか？',
    language: '言語',
    moodTrend: '今週の気分',
    onboarding: 'オンボーディング',
    saveToday: '今日を保存',
    sleep: '睡眠',
    support: 'サポート',
    tabQuick: 'クイック',
    tabWrite: '書く',
    voiceUnsupported: 'このブラウザでは音声入力を利用できません。',
    weekGlance: '今週の概要',
    writePlaceholder: '今日考えていることを自由に書いてください。',
  },
  zh: {
    anxiety: '焦虑',
    catAgent: '猫咪助手',
    checkIn: '打卡',
    connect: '连接',
    dashboard: '仪表板',
    energy: '精力',
    findTherapist: '寻找附近的治疗师',
    greeting: '你好',
    howFeeling: '今天感觉怎么样？',
    language: '语言',
    moodTrend: '本周情绪',
    onboarding: '引导',
    saveToday: '保存今天',
    sleep: '睡眠',
    support: '支持',
    tabQuick: '快速',
    tabWrite: '写作',
    voiceUnsupported: '此浏览器不支持语音输入。',
    weekGlance: '本周一览',
    writePlaceholder: '今天在想什么？随意写下来。',
  },
  es: {
    anxiety: 'Ansiedad',
    catAgent: 'Agente de Gato',
    checkIn: 'Check-in',
    connect: 'Conectar',
    dashboard: 'Panel',
    energy: 'Energía',
    findTherapist: 'Encuentra un terapeuta cercano',
    greeting: 'Buenos días',
    howFeeling: '¿Cómo te sientes hoy?',
    language: 'Idioma',
    moodTrend: 'Estado de ánimo esta semana',
    onboarding: 'Inicio',
    saveToday: 'Guardar hoy',
    sleep: 'Sueño',
    support: 'Apoyo',
    tabQuick: 'Rápido',
    tabWrite: 'Escribir',
    voiceUnsupported: 'La entrada de voz no está disponible en este navegador.',
    weekGlance: 'Tu semana de un vistazo',
    writePlaceholder: '¿Qué tienes en mente hoy? Escribe lo que quieras.',
  },
  fr: {
    anxiety: 'Anxiété',
    checkIn: 'Check-in',
    connect: 'Connexion',
    dashboard: 'Tableau',
    energy: 'Énergie',
    findTherapist: 'Trouver un thérapeute à proximité',
    greeting: 'Bonjour',
    howFeeling: "Comment vous sentez-vous aujourd'hui ?",
    language: 'Langue',
    moodTrend: 'Humeur cette semaine',
    onboarding: 'Accueil',
    saveToday: "Sauvegarder aujourd'hui",
    sleep: 'Sommeil',
    support: 'Soutien',
    tabQuick: 'Rapide',
    tabWrite: 'Écrire',
    voiceUnsupported: "L'entrée vocale n'est pas disponible dans ce navigateur.",
    weekGlance: "Votre semaine d'un coup d'oeil",
    writePlaceholder: 'À quoi pensez-vous aujourd’hui ? Écrivez librement.',
  },
  ar: {
    anxiety: 'القلق',
    checkIn: 'تسجيل',
    connect: 'اتصال',
    dashboard: 'لوحة',
    energy: 'الطاقة',
    findTherapist: 'ابحث عن معالج قريب',
    greeting: 'مرحباً',
    howFeeling: 'كيف تشعر اليوم؟',
    language: 'اللغة',
    moodTrend: 'المزاج هذا الأسبوع',
    onboarding: 'البداية',
    saveToday: 'احفظ اليوم',
    sleep: 'النوم',
    support: 'الدعم',
    tabQuick: 'سريع',
    tabWrite: 'كتابة',
    voiceUnsupported: 'الإدخال الصوتي غير متاح في هذا المتصفح.',
    weekGlance: 'أسبوعك بنظرة سريعة',
    writePlaceholder: 'ما الذي يدور في ذهنك اليوم؟ اكتب بحرية.',
  },
}

export const languageOptions: Array<{
  code: Language
  englishName: string
  flag: string
  nativeName: string
}> = [
  { code: 'en', englishName: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'ko', englishName: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'ja', englishName: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'zh', englishName: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'es', englishName: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', englishName: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'ar', englishName: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
]

const I18nContext = createContext<{
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
} | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => translations[language][key],
    }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }

  return context
}
