type SpinnerPosition = 'center' | 'top'

export function Spinner({ message, position = 'center' }: { message?: string; position?: SpinnerPosition }) {
  const positionClass = position === 'top' ? 'items-start justify-center pt-5' : 'items-center justify-center'
  return (
    <div className={`fixed inset-0 z-[100] flex ${positionClass} animate-[fadeIn_0.25s_ease-out]`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,theme(colors.green.500/8),transparent_60%)] animate-[fadeIn_0.3s_ease-out]" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center">
          <div
            className="absolute inset-[-120px] rounded-full bg-lime-400/45 blur-3xl animate-[glowPulse_2s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-green-700/30 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_12px_30px_rgba(0,0,0,0.1)] overflow-visible">
            <svg
              className="relative h-8 w-8 animate-spin"
              viewBox="0 0 50 50"
              fill="none"
              aria-label="Loading"
              role="status"
            >
              <defs>
                <linearGradient id="spinnerStroke" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#84cc16" stopOpacity="0.92" />
                  <stop offset="70%" stopColor="#84cc16" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#4d7c0f" stopOpacity="0.92" />
                </linearGradient>
              </defs>
              <circle
                cx="25"
                cy="25"
                r="18"
                stroke="url(#spinnerStroke)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="92 28"
                strokeDashoffset="16"
              />
            </svg>
            <div
              className="absolute inset-[6px] rounded-full border border-black/5"
              aria-hidden="true"
            />
          </div>
        </div>

        {message && (
          <p className="font-figtree text-[var(--sea-ink-soft)] text-lg text-center max-w-sm">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
