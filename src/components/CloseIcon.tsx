/** Drawn rather than typed: a ✕ character sits off center, differently in each font. */
export function CloseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} aria-hidden="true">
      <path d="M2 2 12 12M12 2 2 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
