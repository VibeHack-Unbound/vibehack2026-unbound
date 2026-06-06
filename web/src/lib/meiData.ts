import type { Tier } from './tierSystem'

export interface DayEntry {
  date: string // YYYY-MM-DD
  tier: Tier
  score: number
  voiceSummary: string
  stressTags: string[]
  checkIn: {
    ate: string
    energy: string
    sleep: string
    social: string
    focus: string
    overall: string
  }
}

// Pre-seeded 6 days of demo data for Mei
// Today is the 6th entry; we build relative to a fixed reference
function dateStr(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export const MEI_DATA: DayEntry[] = [
  {
    date: dateStr(6),
    tier: 2,
    score: 65,
    voiceSummary:
      "mei talked about settling into her new flat in hackney. she mentioned feeling excited but a little overwhelmed by the paperwork. she said she missed her mum's cooking.",
    stressTags: ['loneliness', 'other'],
    checkIn: {
      ate: 'at least 2 meals',
      energy: 'normal',
      sleep: 'good (7hrs+)',
      social: 'brief interaction',
      focus: 'some focus',
      overall: 'okay',
    },
  },
  {
    date: dateStr(5),
    tier: 3,
    score: 45,
    voiceSummary:
      'mei mentioned her first seminar was harder than expected because of the pace of english. she felt tired and a bit lost. she did go for a walk in the evening which helped.',
    stressTags: ['exams', 'loneliness'],
    checkIn: {
      ate: 'snacked only',
      energy: 'getting by',
      sleep: 'okay (4–6hrs)',
      social: 'no contact',
      focus: 'some focus',
      overall: 'hard',
    },
  },
  {
    date: dateStr(4),
    tier: 2,
    score: 62,
    voiceSummary:
      'mei had a good day — she met another international student from hong kong and they had lunch together. she felt more connected and less invisible.',
    stressTags: ['exams'],
    checkIn: {
      ate: 'at least 2 meals',
      energy: 'normal',
      sleep: 'good (7hrs+)',
      social: 'had a real conversation',
      focus: 'fully focused',
      overall: 'good',
    },
  },
  {
    date: dateStr(3),
    tier: 4,
    score: 28,
    voiceSummary:
      "mei received a confusing letter about her student visa and spent hours trying to understand it. she felt anxious and couldn't eat properly. she mentioned feeling very alone.",
    stressTags: ['other', 'loneliness', 'money'],
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
      'mei called her mum for the first time in a week. she cried a little but felt better afterwards. she has an essay due next week and is feeling the pressure.',
    stressTags: ['exams', 'family'],
    checkIn: {
      ate: 'at least 2 meals',
      energy: 'getting by',
      sleep: 'okay (4–6hrs)',
      social: 'had a real conversation',
      focus: 'some focus',
      overall: 'okay',
    },
  },
  {
    date: dateStr(1),
    tier: 2,
    score: 68,
    voiceSummary:
      "mei went to the library and got a lot done on her essay. she treated herself to bubble tea. she said she's starting to feel like london might actually be okay.",
    stressTags: ['exams'],
    checkIn: {
      ate: 'at least 2 meals',
      energy: 'feeling good',
      sleep: 'good (7hrs+)',
      social: 'brief interaction',
      focus: 'fully focused',
      overall: 'good',
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
