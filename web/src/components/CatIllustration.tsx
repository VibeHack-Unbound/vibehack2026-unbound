import type { Tier } from '../lib/tierSystem'

interface CatIllustrationProps {
  tier?: Tier
  size?: number
  className?: string
}

function CatFloating({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="relaxed floating cat"
    >
      <circle cx="30" cy="50" r="4" fill="#80B0E8" opacity="0.5" />
      <circle cx="170" cy="60" r="3" fill="#C3B8E8" opacity="0.5" />
      <circle cx="155" cy="30" r="2" fill="#F2D06B" opacity="0.6" />
      <ellipse cx="100" cy="118" rx="38" ry="32" fill="#2C3E35" />
      <circle cx="100" cy="82" r="36" fill="#2C3E35" />
      <path d="M72 54 L60 30 L88 48Z" fill="#2C3E35" />
      <path d="M128 54 L140 30 L112 48Z" fill="#2C3E35" />
      <path d="M74 52 L65 35 L86 49Z" fill="#F5C5D1" opacity="0.85" />
      <path d="M126 52 L135 36 L114 49Z" fill="#F5C5D1" opacity="0.85" />
      <path
        d="M84 80 Q90 74 96 80"
        stroke="#FAF6F0"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M104 80 Q110 74 116 80"
        stroke="#FAF6F0"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="100" cy="88" rx="3" ry="2" fill="#F5C5D1" />
      <path
        d="M92 93 Q100 100 108 93"
        stroke="#F5C5D1"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M62 115 Q40 100 28 108" stroke="#2C3E35" strokeWidth="14" strokeLinecap="round" />
      <path d="M138 115 Q160 100 172 108" stroke="#2C3E35" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M130 140 Q155 130 158 115 Q162 100 150 98"
        stroke="#2C3E35"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="82" cy="148" rx="12" ry="8" fill="#2C3E35" />
      <ellipse cx="118" cy="148" rx="12" ry="8" fill="#2C3E35" />
    </svg>
  )
}

function CatOnCloud({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="calm cat on cloud"
    >
      <ellipse cx="100" cy="162" rx="55" ry="18" fill="white" />
      <ellipse cx="75" cy="155" rx="28" ry="20" fill="white" />
      <ellipse cx="125" cy="155" rx="28" ry="20" fill="white" />
      <ellipse cx="100" cy="150" rx="35" ry="22" fill="white" />
      <ellipse cx="100" cy="122" rx="34" ry="28" fill="#2C3E35" />
      <circle cx="100" cy="84" r="34" fill="#2C3E35" />
      <path d="M74 57 L63 34 L89 51Z" fill="#2C3E35" />
      <path d="M126 57 L137 34 L111 51Z" fill="#2C3E35" />
      <path d="M76 55 L68 37 L87 51Z" fill="#F5C5D1" opacity="0.85" />
      <path d="M124 55 L132 38 L113 51Z" fill="#F5C5D1" opacity="0.85" />
      <ellipse cx="88" cy="82" rx="8" ry="9" fill="#F4D76D" />
      <ellipse cx="112" cy="82" rx="8" ry="9" fill="#F4D76D" />
      <ellipse cx="88" cy="83" rx="3" ry="5" fill="#2C3E35" />
      <ellipse cx="112" cy="83" rx="3" ry="5" fill="#2C3E35" />
      <path d="M80 78 Q88 74 96 78" fill="#2C3E35" />
      <path d="M104 78 Q112 74 120 78" fill="#2C3E35" />
      <ellipse cx="100" cy="90" rx="3" ry="2" fill="#F5C5D1" />
      <path
        d="M93 95 Q100 100 107 95"
        stroke="#F5C5D1"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M128 138 Q148 130 150 118 Q152 106 142 104"
        stroke="#2C3E35"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="82" cy="146" rx="11" ry="7" fill="#2C3E35" />
      <ellipse cx="118" cy="146" rx="11" ry="7" fill="#2C3E35" />
    </svg>
  )
}

function CatHanging({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="droopy hanging cat"
    >
      <path
        d="M100 20 Q100 10 108 10 Q116 10 116 18"
        stroke="#A89F94"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100 20 L60 48 L140 48 Z"
        stroke="#A89F94"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M72 80 Q65 65 68 50" stroke="#2C3E35" strokeWidth="12" strokeLinecap="round" />
      <path d="M128 80 Q135 65 132 50" stroke="#2C3E35" strokeWidth="12" strokeLinecap="round" />
      <ellipse cx="100" cy="126" rx="32" ry="30" fill="#2C3E35" />
      <circle cx="100" cy="86" r="32" fill="#2C3E35" />
      <path d="M76 62 L68 40 L90 56Z" fill="#2C3E35" />
      <path d="M124 62 L132 40 L110 56Z" fill="#2C3E35" />
      <path d="M78 60 L72 43 L88 56Z" fill="#F5C5D1" opacity="0.85" />
      <path d="M122 60 L128 44 L112 56Z" fill="#F5C5D1" opacity="0.85" />
      <ellipse cx="88" cy="84" rx="7" ry="8" fill="#F4D76D" />
      <ellipse cx="112" cy="84" rx="7" ry="8" fill="#F4D76D" />
      <ellipse cx="88" cy="85" rx="3" ry="5" fill="#2C3E35" />
      <ellipse cx="112" cy="85" rx="3" ry="5" fill="#2C3E35" />
      <path
        d="M93 97 Q100 93 107 97"
        stroke="#F5C5D1"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="100" cy="91" rx="3" ry="2" fill="#F5C5D1" />
      <path
        d="M128 148 Q140 155 138 168 Q136 178 128 176"
        stroke="#2C3E35"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M84 152 L80 172" stroke="#2C3E35" strokeWidth="12" strokeLinecap="round" />
      <path d="M116 152 L120 172" stroke="#2C3E35" strokeWidth="12" strokeLinecap="round" />
    </svg>
  )
}

function CatCurled({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="curled up cat"
    >
      <path
        d="M55 140 Q50 100 80 88 Q110 76 130 88 Q155 102 150 140 Q130 165 100 165 Q70 165 55 140Z"
        fill="#2C3E35"
      />
      <path
        d="M55 140 Q42 160 60 172 Q80 182 100 178 Q120 174 130 165"
        stroke="#2C3E35"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="100" cy="100" r="28" fill="#2C3E35" />
      <path d="M80 80 L74 62 L94 76Z" fill="#2C3E35" />
      <path d="M120 80 L126 62 L106 76Z" fill="#2C3E35" />
      <path d="M82 78 L77 65 L92 76Z" fill="#F5C5D1" opacity="0.85" />
      <path d="M118 78 L123 66 L108 76Z" fill="#F5C5D1" opacity="0.85" />
      <ellipse cx="90" cy="100" rx="6" ry="7" fill="#F4D76D" />
      <ellipse cx="110" cy="100" rx="6" ry="7" fill="#F4D76D" />
      <ellipse cx="90" cy="101" rx="2.5" ry="4" fill="#2C3E35" />
      <ellipse cx="110" cy="101" rx="2.5" ry="4" fill="#2C3E35" />
      <path
        d="M84 94 Q90 90 96 94"
        stroke="#2C3E35"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M104 94 Q110 90 116 94"
        stroke="#2C3E35"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M94 110 Q100 106 106 110"
        stroke="#F5C5D1"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="100" cy="106" rx="2.5" ry="1.8" fill="#F5C5D1" />
    </svg>
  )
}

function CatWrapped({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="wrapped anxious cat"
    >
      <path
        d="M48 130 Q44 90 100 82 Q156 90 152 130 Q148 175 100 178 Q52 175 48 130Z"
        fill="#C4B5A5"
      />
      <path
        d="M60 100 Q100 92 140 100"
        stroke="#B0A090"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M55 115 Q100 106 145 115"
        stroke="#B0A090"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="100" cy="76" r="34" fill="#2C3E35" />
      <path d="M74 54 L65 28 L92 48Z" fill="#2C3E35" />
      <path d="M126 54 L135 28 L108 48Z" fill="#2C3E35" />
      <path d="M76 52 L69 32 L90 48Z" fill="#F5C5D1" opacity="0.85" />
      <path d="M124 52 L131 33 L110 48Z" fill="#F5C5D1" opacity="0.85" />
      <ellipse cx="86" cy="74" rx="11" ry="13" fill="#F4D76D" />
      <ellipse cx="114" cy="74" rx="11" ry="13" fill="#F4D76D" />
      <ellipse cx="86" cy="75" rx="5" ry="8" fill="#2C3E35" />
      <ellipse cx="114" cy="75" rx="5" ry="8" fill="#2C3E35" />
      <circle cx="89" cy="72" r="2.5" fill="white" />
      <circle cx="117" cy="72" r="2.5" fill="white" />
      <path
        d="M78 62 Q86 57 94 62"
        stroke="#FAF6F0"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M106 62 Q114 57 122 62"
        stroke="#FAF6F0"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M94 88 Q100 85 106 88"
        stroke="#F5C5D1"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="100" cy="83" rx="3" ry="2" fill="#F5C5D1" />
      <ellipse cx="72" cy="132" rx="10" ry="7" fill="#2C3E35" />
      <ellipse cx="128" cy="132" rx="10" ry="7" fill="#2C3E35" />
    </svg>
  )
}

// Cat image URLs for each tier (uploaded cat avatar photos from design team)
const CAT_TIER_IMAGES: Record<number, string> = {
  1: '/manus-storage/cat4_283e8e9c.png',  // superhero cat flying — coping well
  2: '/manus-storage/cat2_214e4198.png',  // dancing with scarf — coping ok
  3: '/manus-storage/cat7_7e3387d4.png',  // hanging from hanger — mild watch
  4: '/manus-storage/cat6_54d6f974.png',  // curled up loaf — watch
  5: '/manus-storage/cat9_064d2a42.png',  // overwhelmed, wide eyes — need support
}

export function CatIllustration({ tier = 1, size = 160, className = '' }: CatIllustrationProps) {
  const catClass = `cat-float ${className}`
  const imgSrc = CAT_TIER_IMAGES[tier] ?? CAT_TIER_IMAGES[1]
  const altTexts: Record<number, string> = {
    1: 'superhero cat flying freely — coping well',
    2: 'cat dancing with a scarf — coping ok',
    3: 'cat hanging from a hanger, slightly droopy — mild watch',
    4: 'cat curled up in a loaf — watch',
    5: 'cat looking overwhelmed with wide eyes — need support',
  }
  return (
    <div
      className={catClass}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <img
        src={imgSrc}
        alt={altTexts[tier] ?? 'cat illustration'}
        width={size}
        height={size}
        style={{ objectFit: 'contain', mixBlendMode: 'multiply' }}
      />
    </div>
  )
}
