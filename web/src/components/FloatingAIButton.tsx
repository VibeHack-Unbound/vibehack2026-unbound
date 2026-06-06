type Props = {
  onClick: () => void
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* 4-pointed star / sparkle */}
      <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" />
      <circle cx="19" cy="4" r="1.2" />
      <circle cx="5" cy="18" r="1" />
    </svg>
  )
}

export function FloatingAIButton({ onClick }: Props) {
  return (
    <button
      className="fab-ai"
      onClick={onClick}
      aria-label="open cat agent"
      type="button"
    >
      <SparkleIcon />
    </button>
  )
}
