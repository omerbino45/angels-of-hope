import { useI18n } from '../i18n'

/** A funnel button that opens a filter panel. The number shows how many filters are on while the panel is closed. */
export function FilterButton({ open, active, onClick }: { open: boolean; active: number; onClick: () => void }) {
  const { t } = useI18n()
  return (
    <button
      type="button"
      className={`filter-btn ${open ? 'is-open' : ''} ${active ? 'has-active' : ''}`}
      aria-expanded={open}
      aria-label={t(active ? `סינון, ${active} פעילים` : 'סינון', active ? `Filters, ${active} on` : 'Filters')}
      title={t('סינון', 'Filters')}
      onClick={onClick}
    >
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <path d="M3 4h14l-5.5 6.5V16l-3 1.5v-7L3 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <span className="filter-btn-label">{t('סינון', 'Filters')}</span>
      {active > 0 && <span className="filter-btn-count">{active}</span>}
    </button>
  )
}

export function RefreshIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3.7h-3.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <circle cx="15" cy="4.5" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="5" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="15" cy="15.5" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="m7.1 8.9 5.8-3.3M7.1 11.1l5.8 3.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
