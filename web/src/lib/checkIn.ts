import type { DayEntry } from './meiData'

export type CheckInId = keyof DayEntry['checkIn']

export type CheckInQuestion = {
  id: CheckInId
  q: string
  options: string[]
}

export const STRESS_TAGS = [
  'exams',
  'relationships',
  'family',
  'money',
  'loneliness',
  'health',
  'work',
  'other',
] as const

export const CHECKIN_QUESTIONS: CheckInQuestion[] = [
  {
    id: 'ate',
    q: 'did you eat today?',
    options: ['nothing', 'snacked only', 'at least 2 meals'],
  },
  {
    id: 'energy',
    q: 'how is your energy right now?',
    options: ['stuck in bed', 'getting by', 'normal', 'feeling good'],
  },
  {
    id: 'sleep',
    q: 'how did you sleep last night?',
    options: ['very poor (under 4hrs)', 'okay (4-6hrs)', 'good (7hrs+)'],
  },
  {
    id: 'social',
    q: 'did you connect with anyone today?',
    options: ['no contact', 'brief interaction', 'had a real conversation'],
  },
  {
    id: 'focus',
    q: 'could you focus on anything today?',
    options: ['completely blank', 'some focus', 'fully focused'],
  },
  {
    id: 'overall',
    q: 'how would you describe today overall?',
    options: ['very hard', 'hard', 'okay', 'good', 'really good'],
  },
]

export const VIEW_CHECKIN_QUESTIONS: Array<{ key: CheckInId; q: string }> = [
  { key: 'ate', q: 'did you eat today?' },
  { key: 'energy', q: 'how is your energy?' },
  { key: 'sleep', q: 'how did you sleep?' },
  { key: 'social', q: 'did you connect with anyone?' },
  { key: 'focus', q: 'could you focus today?' },
  { key: 'overall', q: 'how would you describe today?' },
]

export const DEFAULT_CHECKIN: DayEntry['checkIn'] = {
  ate: 'snacked only',
  energy: 'getting by',
  sleep: 'okay (4-6hrs)',
  social: 'brief interaction',
  focus: 'some focus',
  overall: 'okay',
}
