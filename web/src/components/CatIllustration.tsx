export type CatMood = 'happy' | 'sad' | 'anxious' | 'neutral'

export function CatIllustration({ mood = 'neutral', size = 'large' }: { mood?: CatMood; size?: 'small' | 'large' }) {
  return (
    <svg
      aria-label={`${mood} Unbound cat`}
      className={`cat-illustration ${mood} ${size}`}
      role="img"
      viewBox="0 0 220 190"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className="cat-tail">
        <path
          d="M164 126C202 114 204 75 181 70C164 66 156 82 164 92C172 103 188 92 181 82"
          fill="none"
          stroke="#2C3E35"
          strokeLinecap="round"
          strokeWidth="18"
        />
      </g>
      <g className="cat-body">
        <path d="M62 178C53 145 63 103 109 101C158 99 177 139 164 178H62Z" fill="#2C3E35" />
        <path d="M54 94C54 52 78 28 111 28C146 28 170 53 170 94C170 133 147 153 112 153C76 153 54 133 54 94Z" fill="#2C3E35" />
        <path d="M69 46L53 12L92 31Z" fill="#2C3E35" />
        <path d="M151 45L171 13L132 30Z" fill="#2C3E35" />
        <path d="M75 48L66 27L88 39Z" fill="#F5C5D1" opacity="0.9" />
        <path d="M145 48L159 28L135 39Z" fill="#F5C5D1" opacity="0.9" />
        <g className="cat-eyes">
          <ellipse cx="90" cy="88" fill="#F4D76D" rx="12" ry="15" />
          <ellipse cx="132" cy="88" fill="#F4D76D" rx="12" ry="15" />
          <ellipse cx="90" cy="88" fill="#2C3E35" rx="3" ry="8" />
          <ellipse cx="132" cy="88" fill="#2C3E35" rx="3" ry="8" />
        </g>
        <path className="cat-mouth happy-mouth" d="M101 111C105 119 118 119 122 111" fill="none" stroke="#F5C5D1" strokeLinecap="round" strokeWidth="5" />
        <path className="cat-mouth sad-mouth" d="M100 119C106 110 116 110 122 119" fill="none" stroke="#F5C5D1" strokeLinecap="round" strokeWidth="5" />
        <path className="cat-mouth neutral-mouth" d="M101 115H122" fill="none" stroke="#F5C5D1" strokeLinecap="round" strokeWidth="5" />
        <path className="anxious-mark" d="M154 58L167 45M162 68L178 62" stroke="#5B9FD8" strokeLinecap="round" strokeWidth="5" />
        <path className="rain-drop" d="M47 42C41 51 38 57 38 63C38 70 43 75 50 75C57 75 62 70 62 63C62 57 56 49 47 42Z" fill="#5B9FD8" />
      </g>
    </svg>
  )
}
