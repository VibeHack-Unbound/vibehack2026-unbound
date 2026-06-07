// Wellness tier system
export type Tier = 1 | 2 | 3 | 4 | 5

export interface TierInfo {
  tier: Tier
  label: string
  colour: string
  catMood: 'floating' | 'cloud' | 'hanger' | 'curled' | 'wrapped'
  recommendation: string
}

export const TIERS: Record<Tier, TierInfo> = {
  1: {
    tier: 1,
    label: 'coping well',
    colour: '#80B0E8',
    catMood: 'floating',
    recommendation:
      "you're doing great. keep up your current routines and celebrate small wins today.",
  },
  2: {
    tier: 2,
    label: 'coping ok',
    colour: '#C3B8E8',
    catMood: 'cloud',
    recommendation:
      'things feel manageable. a short walk or a chat with a friend can lift your mood.',
  },
  3: {
    tier: 3,
    label: 'mild watch',
    colour: '#F2D06B',
    catMood: 'hanger',
    recommendation:
      "you've been under some pressure lately. try a 5-minute breathing exercise or journaling.",
  },
  4: {
    tier: 4,
    label: 'watch',
    colour: '#F2B8C6',
    catMood: 'curled',
    recommendation:
      'things feel heavy right now. reaching out to someone you trust can help.',
  },
  5: {
    tier: 5,
    label: 'need support',
    colour: '#C4B5A5',
    catMood: 'wrapped',
    recommendation:
      "you don't have to carry this alone. please reach out to one of the resources below.",
  },
}

export function scoreToTier(score: number): Tier {
  if (score >= 80) return 1
  if (score >= 60) return 2
  if (score >= 40) return 3
  if (score >= 20) return 4
  return 5
}

export function tierColour(tier: Tier): string {
  return TIERS[tier].colour
}
