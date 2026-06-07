import type { Tier } from './tierSystem'

// ── Cat image URLs (uploaded to Manus CDN) ────────────────────────────────
// Cat avatars provided by the design team, representing each mood tier.
export const CAT_IMAGES = {
  tier1: '/manus-storage/cat4_283e8e9c.png', // superhero cat flying — coping well
  tier2: '/manus-storage/cat2_214e4198.png', // dancing with scarf — coping ok
  tier3: '/manus-storage/cat7_7e3387d4.png', // hanging from hanger — mild watch
  tier4: '/manus-storage/cat6_54d6f974.png', // curled up loaf — watch
  tier5: '/manus-storage/cat9_064d2a42.png', // overwhelmed, wide eyes — need support
  logo: '/manus-storage/logo_4a50b44a.png', // unbound logo for nav
  listening: '/manus-storage/cat1_5212e7d7.png', // sitting cat for voice input
  happy: '/manus-storage/cat3_e03d098a.png', // friendly cat for support page
} as const

export function catImageForTier(tier: Tier): string {
  return CAT_IMAGES[`tier${tier}` as keyof typeof CAT_IMAGES] as string
}

export interface DayEntry {
  date: string // YYYY-MM-DD
  source?: 'manual' | 'voice'
  tier: Tier
  score: number
  voiceSummary: string
  voiceTranscript?: string
  stressTags: string[]
  updatedAt?: number
  checkIn: {
    ate: string
    energy: string
    sleep: string
    social: string
    focus: string
    overall: string
  }
}

// Pre-seeded 6 days of demo data for Li
// Li, 24. MSc student from China at UCL. Five months into her first year.
// Homesick, anxious about grades, struggling to sleep.
// Pattern: declining mid-week (exam stress), slight weekend recovery.
function dateStr(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export const MEI_DATA: DayEntry[] = [
  {
    date: dateStr(6),
    tier: 2,
    score: 68,
    voiceSummary:
      'li talked about feeling settled after a good weekend. she mentioned her upcoming exams but felt prepared. she cooked a meal that reminded her of home.',
    stressTags: ['exams'],
    checkIn: {
      ate: 'at least 2 meals',
      energy: 'normal',
      sleep: 'good (7hrs+)',
      social: 'had a real conversation',
      focus: 'some focus',
      overall: 'okay',
    },
  },
  {
    date: dateStr(5),
    tier: 3,
    score: 48,
    voiceSummary:
      'li mentioned feeling tired and a bit lonely. she stayed in the library all day studying and did not eat a proper meal. she said the exam felt closer than she expected.',
    stressTags: ['exams', 'loneliness'],
    checkIn: {
      ate: 'snacked only',
      energy: 'getting by',
      sleep: 'okay (4-6hrs)',
      social: 'brief interaction',
      focus: 'some focus',
      overall: 'hard',
    },
  },
  {
    date: dateStr(4),
    tier: 3,
    score: 42,
    voiceSummary:
      'li felt overwhelmed by revision. she mentioned missing home and a call with her mum that made her emotional. she said she could not focus at all in the afternoon.',
    stressTags: ['exams', 'family'],
    checkIn: {
      ate: 'snacked only',
      energy: 'getting by',
      sleep: 'okay (4-6hrs)',
      social: 'no contact',
      focus: 'some focus',
      overall: 'hard',
    },
  },
  {
    date: dateStr(3),
    tier: 4,
    score: 22,
    voiceSummary:
      'li had a really difficult day. she could not sleep, skipped meals, and felt completely blank. she mentioned feeling like she was failing and that no one around her understood.',
    stressTags: ['exams', 'loneliness', 'health'],
    checkIn: {
      ate: 'nothing',
      energy: 'stuck in bed',
      sleep: 'very poor (under 4hrs)',
      social: 'no contact',
      focus: 'completely blank',
      overall: 'very hard',
    },
  },
  {
    date: dateStr(2),
    tier: 3,
    score: 50,
    voiceSummary:
      'li felt a little better today. she ate two meals and had a brief chat with a classmate. still stressed about exams but slightly more hopeful. she went for a short walk.',
    stressTags: ['exams'],
    checkIn: {
      ate: 'at least 2 meals',
      energy: 'getting by',
      sleep: 'okay (4-6hrs)',
      social: 'brief interaction',
      focus: 'some focus',
      overall: 'okay',
    },
  },
  {
    date: dateStr(1),
    tier: 3,
    score: 55,
    voiceSummary:
      'li slept better last night and felt more like herself. she is still worried about exams but managed to focus for a few hours. she messaged a friend back home.',
    stressTags: ['exams'],
    checkIn: {
      ate: 'at least 2 meals',
      energy: 'normal',
      sleep: 'good (7hrs+)',
      social: 'brief interaction',
      focus: 'some focus',
      overall: 'okay',
    },
  },
]

export function getTodayEntry(): DayEntry | null {
  const today = new Date().toISOString().slice(0, 10)
  return MEI_DATA.find((e) => e.date === today) ?? null
}

export function getLatestEntry(): DayEntry {
  return MEI_DATA[MEI_DATA.length - 1]
}

export function getEntryByDate(date: string): DayEntry | undefined {
  return MEI_DATA.find((e) => e.date === date)
}
