import { useState } from 'react'

type Props = {
  onClick: () => void
}

export function FloatingAIButton({ onClick }: Props) {
  const [showTooltip, setShowTooltip] = useState(true)

  return (
    <div className="fab-ai-wrap">
      {showTooltip && (
        <div className="fab-tooltip">
          how are you doing today?
          <button
            className="fab-tooltip-close"
            onClick={(e) => {
              e.stopPropagation()
              setShowTooltip(false)
            }}
            type="button"
            aria-label="dismiss tooltip"
          >
            ×
          </button>
        </div>
      )}
      <button
        className="fab-ai"
        onClick={onClick}
        aria-label="open cat agent"
        type="button"
      >
        <img
          src="/cats/cat-agent.webp"
          alt="cat agent"
          className="fab-cat-img"
        />
      </button>
    </div>
  )
}
