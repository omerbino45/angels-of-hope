import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { FilterButton, RefreshIcon, ShareIcon } from '../components/FilterButton'
import { LetterPaper } from '../components/LetterPaper'
import { Modal } from '../components/Modal'
import { emptyFallen, fallenLabel, familySearchText } from '../data/families'
import { useI18n } from '../i18n'
import { deleteLetter, exportLetters, loadLetters, updateLetterStatus, uploadFallenPhoto } from '../lib/db'
import { downloadPng, readImage } from '../lib/export'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import type { Fallen, Family, Letter, LetterSource, LetterStatus } from '../types'

function LetterViewer({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <Modal title={t(`המכתב של ${letter.writer}`, `Letter from ${letter.writer}`)} onClose={onClose} wide>
      <div className="viewer-actions no-print">
        <button
          className="btn btn-primary"
          disabled={busy}
          onClick={async () => {
            if (!ref.current) return
            setBusy(true)
            try {
              await downloadPng(ref.current, `letter-${letter.id}.png`)
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? t('מכינים...', 'Preparing...') : t('הורדת תמונה', 'Download image')}
        </button>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          {t('הדפסה / PDF', 'Print / PDF')}
        </button>
      </div>
      <LetterPaper ref={ref} design={letter.design} greeting={letter.greeting} text={letter.text} signature={letter.signature} />
    </Modal>
  )
}

function ShareModal({ family, onClose }: { family: Family; onClose: () => void }) {
  const { t } = useI18n()
  // The copied link and the QR code mark themselves, so each letter shows which one brought the writer.
  const base = `${window.location.origin}/write/${family.id}`
  const url = `${base}?from=link`
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(`${base}?from=qr`, { margin: 1, width: 480, color: { dark: '#0f2d5e', light: '#ffffff' } }).then(setQr)
  }, [base])

  const message = `כתבו מכתב למשפחה: ${url}`
  return (
    <Modal title={t(`קישור/QR: ${fallenLabel(family) || family.name}`, `Link/QR: ${fallenLabel(family) || family.name}`)} onClose={onClose}>
      <div className="share-box">
        <p className="modal-text">
          {t('הקרינו את הקוד בהרצאה או שלחו את הקישור לקבוצה. כל מי שסורק מגיע ישר לדף הכתיבה של המשפחה הזו.', "Show this code during a talk or send the link to a group. Whoever scans it lands straight on this family's writing page.")}
        </p>
        {qr && <img className="share-qr" src={qr} alt={t('קוד QR לדף הכתיבה', 'QR code for the writing page')} />}
        <p className="share-url">{url}</p>
        <div className="share-actions">
          <button
            className="btn btn-primary btn-small"
            onClick={async () => {
              await navigator.clipboard.writeText(url)
              setCopied(true)
            }}
          >
            {copied ? t('הועתק ✓', 'Copied ✓') : t('העתקת קישור', 'Copy link')}
          </button>
          <a className="btn btn-secondary btn-small" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
            {t('שליחה בוואטסאפ', 'Send on WhatsApp')}
          </a>
        </div>
      </div>
    </Modal>
  )
}

function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

interface LettersTabProps {
  letters: Letter[]
  loading: boolean
  failed: boolean
  onRefresh: () => void
  onStatus: (ids: string[], status: LetterStatus) => void
  onDelete: (letter: Letter) => Promise<boolean>
  onView: (letter: Letter) => void
  onPrintAll: (letters: Letter[]) => void
}

type StatusFilter = 'all' | LetterStatus
type SortBy = 'list' | 'new' | 'latest'

const statuses: { value: LetterStatus; he: string; en: string }[] = [
  { value: 'new', he: 'חדש', en: 'New' },
  { value: 'printed', he: 'הודפס', en: 'Printed' },
  { value: 'delivered', he: 'נמסר', en: 'Delivered' },
]
const filters: { value: StatusFilter; he: string; en: string }[] = [
  { value: 'all', he: 'כל המכתבים', en: 'All letters' },
  { value: 'new', he: 'חדשים, ממתינים להדפסה', en: 'New, waiting to print' },
  { value: 'printed', he: 'הודפסו, ממתינים למסירה', en: 'Printed, waiting to deliver' },
  { value: 'delivered', he: 'נמסרו', en: 'Delivered' },
]


const sourceLabels: Record<LetterSource | 'unknown', { he: string; en: string }> = {
  random: { he: 'בחירה אקראית', en: 'Random family' },
  list: { he: 'נבחרה מהרשימה', en: 'Chosen from the list' },
  link: { he: 'קישור', en: 'Link' },
  qr: { he: 'סריקת QR', en: 'QR scan' },
  direct: { he: 'כניסה ישירה', en: 'Direct address' },
  unknown: { he: 'מקור לא ידוע', en: 'Unknown source' },
}
const sourceOf = (l: Letter) => l.source ?? 'unknown'

/** Finds a letter by the writer's name, email or phone. */
const matchesWriter = (l: Letter, q: string) => {
  const needle = q.toLowerCase()
  return [l.writer, l.email, l.phone].some((v) => v.toLowerCase().includes(needle))
}

interface FamilyLettersModalProps {
  family: Family
  letters: Letter[]
  initialStatus: StatusFilter
  onClose: () => void
  onStatus: (ids: string[], status: LetterStatus) => void
  onDelete: (letter: Letter) => Promise<boolean>
  onView: (letter: Letter) => void
  onPrint: (letters: Letter[]) => void
  onShare: () => void
}

function FamilyLettersModal({ family, letters, initialStatus, onClose, onStatus, onDelete, onView, onPrint, onShare }: FamilyLettersModalProps) {
  const { t } = useI18n()
  const [status, setStatus] = useState<StatusFilter>(initialStatus)
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [newestFirst, setNewestFirst] = useState(true)
  const [source, setSource] = useState<LetterSource | 'unknown' | 'all'>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [deleteFailed, setDeleteFailed] = useState(false)

  const shown = useMemo(() => {
    const q = query.trim()
    // Dates are the writer's local days, so "to" includes the whole of that day.
    const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity
    const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity
    return letters
      .filter((l) => (status === 'all' || l.status === status) && (source === 'all' || sourceOf(l) === source) && (!q || matchesWriter(l, q)) && l.createdAt >= start && l.createdAt <= end)
      .sort((a, b) => (newestFirst ? b.createdAt - a.createdAt : a.createdAt - b.createdAt))
  }, [letters, status, source, query, from, to, newestFirst])
  const shownNew = shown.filter((l) => l.status === 'new')
  const activeFilters = [status !== 'all', source !== 'all', Boolean(query.trim()), Boolean(from || to), !newestFirst].filter(Boolean).length
  const clearFilters = () => {
    setStatus('all')
    setSource('all')
    setQuery('')
    setFrom('')
    setTo('')
    setNewestFirst(true)
  }

  return (
    <Modal title={family.name || t('משפחה חדשה', 'New family')} onClose={onClose} wide>
      <div className="family-modal-actions">
        {shown.length > 0 && (
          <button className="btn btn-primary btn-small" onClick={() => onPrint(shown)}>
            {t(`הדפסת ${shown.length === 1 ? 'המכתב' : `${shown.length} המכתבים`}`, `Print ${shown.length === 1 ? 'the letter' : `${shown.length} letters`}`)}
          </button>
        )}
        {shownNew.length > 0 && (
          <button className="btn btn-secondary btn-small" onClick={() => onStatus(shownNew.map((l) => l.id), 'printed')}>
            {t(`סימון ${shownNew.length === 1 ? 'החדש' : `${shownNew.length} החדשים`} כהודפסו`, `Mark ${shownNew.length} new as printed`)}
          </button>
        )}
        <button className="btn btn-secondary btn-small btn-icon-text" onClick={onShare}>
          <ShareIcon />
          {t('קישור/QR', 'Link/QR')}
        </button>
      </div>

      {letters.length > 0 && (
        <div className="filter-bar">
          <p className="filter-bar-summary">
            {shown.length === letters.length
              ? t(letters.length === 1 ? 'מכתב אחד' : `${letters.length} מכתבים`, letters.length === 1 ? '1 letter' : `${letters.length} letters`)
              : t(`מוצגים ${shown.length} מתוך ${letters.length}`, `Showing ${shown.length} of ${letters.length}`)}
            {activeFilters > 0 && (
              <button className="btn-link" onClick={clearFilters}>
                {t('ניקוי הסינון', 'Clear filters')}
              </button>
            )}
          </p>
          <FilterButton open={filtersOpen} active={activeFilters} onClick={() => setFiltersOpen((o) => !o)} />
        </div>
      )}
      {letters.length > 0 && filtersOpen && (
        <div className="letter-filters">
          <div className="chip-row" role="group" aria-label={t('סינון לפי סטטוס', 'Filter by status')}>
            {filters.map((f) => (
              <button key={f.value} className={`chip ${status === f.value ? 'is-active' : ''}`} aria-pressed={status === f.value} onClick={() => setStatus(f.value)}>
                {t(f.he, f.en)} ({f.value === 'all' ? letters.length : letters.filter((l) => l.status === f.value).length})
              </button>
            ))}
          </div>
          <div className="letter-filter-fields">
            <label className="toolbar-field letter-filter-search">
              <span className="toolbar-label-visible">{t('שם, מייל או טלפון של הכותב', "Writer's name, email or phone")}</span>
              <input className="form-input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <div className="letter-filter-dates">
              <label className="toolbar-field">
                <span className="toolbar-label-visible">{t('מתאריך', 'From')}</span>
                <input className="form-input" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="toolbar-field">
                <span className="toolbar-label-visible">{t('עד תאריך', 'To')}</span>
                <input className="form-input" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
              </label>
            </div>
            <label className="toolbar-field">
              <span className="toolbar-label-visible">{t('איך הגיעו למשפחה', 'How they reached the family')}</span>
              <select className="toolbar-select" value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
                <option value="all">{t('הכול', 'Any')}</option>
                {(Object.keys(sourceLabels) as (keyof typeof sourceLabels)[])
                  .filter((k) => letters.some((l) => sourceOf(l) === k))
                  .map((k) => (
                    <option key={k} value={k}>
                      {t(sourceLabels[k].he, sourceLabels[k].en)} ({letters.filter((l) => sourceOf(l) === k).length})
                    </option>
                  ))}
              </select>
            </label>
            <label className="toolbar-field">
              <span className="toolbar-label-visible">{t('סדר', 'Order')}</span>
              <select className="toolbar-select" value={newestFirst ? 'new' : 'old'} onChange={(e) => setNewestFirst(e.target.value === 'new')}>
                <option value="new">{t('החדשים קודם', 'Newest first')}</option>
                <option value="old">{t('הישנים קודם', 'Oldest first')}</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {deleteFailed && <p className="form-error" role="alert">{t('המחיקה נכשלה. נסו שוב.', 'Deleting failed. Try again.')}</p>}
      {letters.length === 0 ? (
        <p className="modal-text">{t('עדיין אין מכתבים למשפחה הזו.', 'No letters for this family yet.')}</p>
      ) : shown.length === 0 ? (
        <p className="modal-text">{t('אין מכתבים שמתאימים לסינון.', 'No letters match the filter.')}</p>
      ) : (
        <ul className="letter-list">
          {shown.map((l) => (
            <li key={l.id} className="letter-row">
              <div className="letter-info">
                <strong>{l.writer}</strong>
                {l.isPublic && <span className="badge badge-public">{t('מאושר לפרסום', 'May be public')}</span>}
                <span className={`badge badge-source badge-source-${sourceOf(l)}`}>{t(sourceLabels[sourceOf(l)].he, sourceLabels[sourceOf(l)].en)}</span>
                <div className="letter-meta">
                  {new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(l.createdAt)}
                  {l.phone && (
                    <>
                      {' · '}
                      <a href={`tel:${l.phone}`} dir="ltr">{l.phone}</a>
                    </>
                  )}
                  {l.email && (
                    <>
                      {' · '}
                      <a href={`mailto:${l.email}`} dir="ltr">{l.email}</a>
                    </>
                  )}
                </div>
              </div>
              <div className="letter-row-actions">
                <select
                  className="status-select"
                  aria-label={t('סטטוס המכתב', 'Letter status')}
                  value={l.status}
                  onChange={(e) => onStatus([l.id], e.target.value as LetterStatus)}
                >
                  {statuses.map((st) => (
                    <option key={st.value} value={st.value}>
                      {t(st.he, st.en)}
                    </option>
                  ))}
                </select>
                <button className="btn btn-secondary btn-small" onClick={() => onView(l)}>
                  {t('צפייה', 'View')}
                </button>
                <button className="btn-link-danger" onClick={() => setConfirming(l.id)}>
                  {t('מחיקה', 'Delete')}
                </button>
              </div>
              {confirming === l.id && (
                <div className="letter-confirm" role="alert">
                  <span>{t('למחוק את המכתב לצמיתות? אי אפשר לשחזר אותו.', 'Delete this letter for good? It cannot be restored.')}</span>
                  <div className="letter-confirm-actions">
                    <button
                      className="btn btn-danger btn-small"
                      onClick={async () => {
                        setDeleteFailed(false)
                        const ok = await onDelete(l)
                        setConfirming(null)
                        setDeleteFailed(!ok)
                      }}
                    >
                      {t('כן, למחוק', 'Yes, delete')}
                    </button>
                    <button className="btn btn-secondary btn-small" onClick={() => setConfirming(null)}>
                      {t('ביטול', 'Cancel')}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

function LettersTab({ letters, loading, failed, onRefresh, onStatus, onDelete, onView, onPrintAll }: LettersTabProps) {
  const { t } = useI18n()
  const { families } = useStore()
  const [exporting, setExporting] = useState(false)
  const [open, setOpen] = useState<Family | null>(null)
  const [sharing, setSharing] = useState<Family | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [onlyWithLetters, setOnlyWithLetters] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>('list')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilters = [statusFilter !== 'all', sortBy !== 'list', onlyWithLetters && statusFilter === 'all'].filter(Boolean).length

  const q = query.trim()
  const shown = useMemo(() => letters.filter((l) => statusFilter === 'all' || l.status === statusFilter), [letters, statusFilter])
  const byFamily = useMemo(() => {
    const map = new Map<string, Letter[]>()
    for (const l of shown) map.set(l.familyId, [...(map.get(l.familyId) ?? []), l])
    return map
  }, [shown])

  const cards = useMemo(() => {
    const all = families
    // Searching also finds a family by the name of someone who wrote to it.
    const matches = all.filter((f) => !q || familySearchText(f).includes(q) || (byFamily.get(f.id) ?? []).some((l) => matchesWriter(l, q)))
    const withLetters = onlyWithLetters || statusFilter !== 'all' ? matches.filter((f) => byFamily.has(f.id)) : matches
    const fresh = (f: Family) => (byFamily.get(f.id) ?? []).filter((l) => l.status === 'new').length
    const latest = (f: Family) => Math.max(0, ...(byFamily.get(f.id) ?? []).map((l) => l.createdAt))
    if (sortBy === 'new') return [...withLetters].sort((a, b) => fresh(b) - fresh(a))
    if (sortBy === 'latest') return [...withLetters].sort((a, b) => latest(b) - latest(a))
    return withLetters
  }, [families, byFamily, q, onlyWithLetters, statusFilter, sortBy])

  const waiting = letters.filter((l) => l.status === 'new').length

  return (
    <>
      <div className="admin-stats-row">
        <p className="admin-stats">
          {loading
            ? t('טוענים מכתבים...', 'Loading letters...')
            : t(`${letters.length === 1 ? 'מכתב אחד התקבל' : `${letters.length} מכתבים התקבלו`} · ${waiting === 1 ? 'אחד ממתין' : `${waiting} ממתינים`} להדפסה`, `${letters.length} ${letters.length === 1 ? 'letter' : 'letters'} received · ${waiting} waiting to print`)}
        </p>
        <div className="admin-stats-actions">
          <button className="btn btn-secondary btn-small btn-icon-text" disabled={loading} onClick={onRefresh}>
            <RefreshIcon />
            {t('רענון', 'Refresh')}
          </button>
          <button
            className="btn btn-secondary btn-small"
            disabled={exporting}
            title={t('הורדת כל המכתבים לקובץ גיבוי', 'Download all letters as a backup file')}
            onClick={async () => {
              setExporting(true)
              try {
                downloadJson(await exportLetters(), `letters-${new Date().toISOString().slice(0, 10)}.json`)
              } finally {
                setExporting(false)
              }
            }}
          >
            {t('הורדת גיבוי', 'Download backup')}
          </button>
        </div>
      </div>
      {failed && <p className="form-error" role="alert">{t('משהו לא הצליח מול השרת. נסו לרענן.', 'Something failed on the server. Try refreshing.')}</p>}

      <div className="filter-bar">
        <input
          className="form-input admin-search"
          type="search"
          aria-label={t('חיפוש משפחה או כותב', 'Search a family or writer')}
          placeholder={t('חיפוש משפחה או כותב', 'Search a family or writer')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <FilterButton open={filtersOpen} active={activeFilters} onClick={() => setFiltersOpen((o) => !o)} />
      </div>
      {filtersOpen && (
        <div className="letter-filters">
          <div className="chip-row" role="group" aria-label={t('סינון לפי סטטוס', 'Filter by status')}>
            {filters.map((f) => {
              const n = f.value === 'all' ? letters.length : letters.filter((l) => l.status === f.value).length
              return (
                <button key={f.value} className={`chip ${statusFilter === f.value ? 'is-active' : ''}`} aria-pressed={statusFilter === f.value} onClick={() => setStatusFilter(f.value)}>
                  {t(f.he, f.en)} ({n})
                </button>
              )
            })}
          </div>
          <div className="letter-filter-fields">
            <label className="toolbar-field admin-sort">
              <span className="toolbar-label-visible">{t('מיון', 'Sort')}</span>
              <select className="toolbar-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                <option value="list">{t('לפי סדר הרשימה', 'List order')}</option>
                <option value="new">{t('הכי הרבה מכתבים חדשים', 'Most new letters')}</option>
                <option value="latest">{t('המכתב האחרון שהגיע', 'Most recent letter')}</option>
              </select>
            </label>
            {statusFilter === 'all' && (
              <label className="toolbar-check">
                <input type="checkbox" checked={onlyWithLetters} onChange={(e) => setOnlyWithLetters(e.target.checked)} />
                {t('רק משפחות עם מכתבים', 'Only families with letters')}
              </label>
            )}
          </div>
          {activeFilters > 0 && (
            <button
              className="btn-link letter-filter-clear"
              onClick={() => {
                setStatusFilter('all')
                setSortBy('list')
                setOnlyWithLetters(false)
              }}
            >
              {t('ניקוי הסינון', 'Clear filters')}
            </button>
          )}
        </div>
      )}

      {cards.length === 0 && !loading && <p className="modal-text">{t('אין מכתבים שמתאימים לסינון.', 'No letters match this filter.')}</p>}
      <div className="family-grid">
        {cards.map((f) => {
          const familyLetters = byFamily.get(f.id) ?? []
          const count = familyLetters.length
          const fresh = familyLetters.filter((l) => l.status === 'new').length
          return (
            <button className="family-tile admin-tile" key={f.id} onClick={() => setOpen(f)}>
              <span className="tile-name">{fallenLabel(f) || f.name || t('משפחה חדשה', 'New family')}</span>
              <span className="tile-family">{f.name}</span>
              <span className="tile-count">
                {t(count === 1 ? 'מכתב אחד' : `${count} מכתבים`, count === 1 ? '1 letter' : `${count} letters`)}
                {fresh > 0 && <span className="tile-new">{t(fresh === 1 ? 'חדש' : `${fresh} חדשים`, `${fresh} new`)}</span>}
              </span>
            </button>
          )
        })}
      </div>

      {open && (
        <FamilyLettersModal
          family={open}
          letters={letters.filter((l) => l.familyId === open.id)}
          initialStatus={statusFilter}
          onClose={() => setOpen(null)}
          onStatus={onStatus}
          onDelete={onDelete}
          onView={(l) => {
            setOpen(null)
            onView(l)
          }}
          onPrint={(list) => {
            setOpen(null)
            onPrintAll(list)
          }}
          onShare={() => {
            setSharing(open)
            setOpen(null)
          }}
        />
      )}
      {sharing && <ShareModal family={sharing} onClose={() => setSharing(null)} />}
    </>
  )
}

function FamiliesTab() {
  const { t } = useI18n()
  const { families, familiesLoaded, saveState, updateFamily, addFamily, removeFamily } = useStore()
  const [toDelete, setToDelete] = useState<Family | null>(null)
  const [photoError, setPhotoError] = useState(false)

  // Editing the built-in copy would overwrite the database with stale data, so it waits for the real list.
  if (!familiesLoaded) {
    return <p className="modal-text">{t('טוענים את רשימת המשפחות...', 'Loading the list of families...')}</p>
  }

  return (
    <>
      <div className="cta-row admin-family-actions">
        <button className="btn btn-primary" onClick={addFamily}>
          + {t('הוספת משפחה', 'Add family')}
        </button>
        <button className="btn btn-secondary" onClick={() => downloadJson(families, 'families.json')}>
          {t('הורדת הרשימה', 'Download the list')}
        </button>
        <p className={`save-state save-state-${saveState}`} role="status">
          {saveState === 'saving' && t('שומרים...', 'Saving...')}
          {saveState === 'saved' && t('השינויים נשמרו ✓', 'Changes saved ✓')}
          {saveState === 'error' && t('השמירה נכשלה. בדקו את החיבור ונסו לשנות שוב.', 'Saving failed. Check the connection and edit again.')}
        </p>
      </div>
      {photoError && <p className="form-error" role="alert">{t('העלאת התמונה נכשלה.', 'Uploading the photo failed.')}</p>}
      <div className="family-rows">
        {families.map((f) => (
          <div className="family-row" key={f.id}>
            <input className="form-input" aria-label={t('שם משפחה', 'Family name')} placeholder={t('שם משפחה', 'Family name')} value={f.name} onChange={(e) => updateFamily(f.id, { name: e.target.value })} />
            {f.fallen.map((p, i) => {
              const setPerson = (patch: Partial<Fallen>) => updateFamily(f.id, { fallen: f.fallen.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
              const izkorLooksWrong = Boolean(p.izkor) && !/^https:\/\/(www\.)?izkor\.gov\.il\//.test(p.izkor ?? '')
              return (
                <div className="fallen-row" key={i}>
                  <input className="form-input" aria-label={t('שם הנופל/ת', 'Name of the fallen')} placeholder={t('שם הנופל/ת', 'Name of the fallen')} value={p.name} onChange={(e) => setPerson({ name: e.target.value })} />
                  <input className="form-input" aria-label={t('יישוב', 'Town')} placeholder={t('יישוב', 'Town')} value={p.city} onChange={(e) => setPerson({ city: e.target.value })} />
                  <input className="form-input" aria-label={t('תאריך', 'Date')} placeholder="D.M.YYYY" dir="ltr" value={p.date} onChange={(e) => setPerson({ date: e.target.value })} />
                  <div className="fallen-row-wide">
                    <input
                      className="form-input"
                      type="url"
                      dir="ltr"
                      aria-label={t('קישור לדף באתר יזכור', 'Link to the Izkor page')}
                      placeholder={t('קישור לדף באתר יזכור', 'Link to the Izkor page')}
                      value={p.izkor ?? ''}
                      onChange={(e) => setPerson({ izkor: e.target.value.trim() || undefined })}
                    />
                    {izkorLooksWrong && <p className="form-hint form-hint-warn">{t('הקישור צריך להתחיל ב-https://www.izkor.gov.il/', 'The link should start with https://www.izkor.gov.il/')}</p>}
                  </div>
                  <textarea className="form-input fallen-row-wide" aria-label={t('סיפור קצר, באישור המשפחה', "Short story, with the family's approval")} placeholder={t('סיפור קצר, באישור המשפחה', "Short story, with the family's approval")} rows={2} value={p.bio ?? ''} onChange={(e) => setPerson({ bio: e.target.value })} />
                  <div className="fallen-row-wide family-row-actions">
                    <label className="btn btn-secondary btn-small file-btn">
                      {p.photo ? t('החלפת תמונה', 'Replace photo') : t('הוספת תמונה', 'Add photo')}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          e.target.value = ''
                          if (!file) return
                          setPhotoError(false)
                          try {
                            const { src } = await readImage(file, { maxSide: 600, maxBytes: 80 * 1024 })
                            const { path, url } = await uploadFallenPhoto(src)
                            setPerson({ photo: url, photoPath: path })
                          } catch {
                            setPhotoError(true)
                          }
                        }}
                      />
                    </label>
                    {f.fallen.length > 1 && (
                      <button className="btn-link-danger" onClick={() => updateFamily(f.id, { fallen: f.fallen.filter((_, j) => j !== i) })}>
                        {t('הסרת השם הזה', 'Remove this name')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            <div className="family-row-actions">
              <button className="btn btn-secondary btn-small" onClick={() => updateFamily(f.id, { fallen: [...f.fallen, emptyFallen()] })}>
                + {t('הוספת חלל/ה נוסף/ת במשפחה', 'Add another fallen in this family')}
              </button>
              <label className="check-row">
                <input type="checkbox" checked={f.acceptsLetters} onChange={(e) => updateFamily(f.id, { acceptsLetters: e.target.checked })} />
                <span>{t('שמחה לקבל מכתבים', 'Happy to receive letters')}</span>
              </label>
              <button className="btn-link-danger" onClick={() => setToDelete(f)}>
                {t('מחיקה', 'Delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {toDelete && (
        <Modal title={t('למחוק את המשפחה מהרשימה?', 'Remove this family from the list?')} onClose={() => setToDelete(null)}>
          <p className="modal-text">{toDelete.name}</p>
          <div className="cta-row">
            <button className="btn btn-secondary" onClick={() => setToDelete(null)}>
              {t('ביטול', 'Cancel')}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                removeFamily(toDelete.id)
                setToDelete(null)
              }}
            >
              {t('מחיקה', 'Delete')}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function AdminLogin() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <section className="admin-login">
      <div className="admin-login-card">
        <h1 className="admin-login-title">{t('כניסה לניהול', 'Admin sign-in')}</h1>
        <button
          className="form-submit admin-google"
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/admin` } })}
        >
          {t('כניסה עם Google', 'Sign in with Google')}
        </button>
        <details className="admin-password-login">
          <summary>{t('כניסה עם מייל וסיסמה', 'Sign in with email and password')}</summary>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
              setBusy(false)
              setFailed(Boolean(error))
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">{t('מייל', 'Email')}</label>
              <input id="admin-email" className="form-input" type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setFailed(false) }} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">{t('סיסמה', 'Password')}</label>
              <input id="admin-password" className="form-input" type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setFailed(false) }} />
            </div>
            {failed && <p className="form-error" role="alert">{t('המייל או הסיסמה שגויים', 'Wrong email or password')}</p>}
            <button className="btn btn-secondary" type="submit" disabled={busy}>{t('כניסה', 'Sign in')}</button>
          </form>
        </details>
      </div>
    </section>
  )
}

function NotAdmin({ email }: { email?: string }) {
  const { t } = useI18n()
  return (
    <section className="admin-login">
      <div className="admin-login-card">
        <h1 className="admin-login-title">{t('אין הרשאת ניהול', 'No admin access')}</h1>
        <p className="modal-text">
          {t(`החשבון ${email ?? ''} אינו ברשימת המנהלים.`, `The account ${email ?? ''} is not on the admin list.`)}
        </p>
        <button className="btn btn-secondary" onClick={() => supabase.auth.signOut()}>
          {t('יציאה והתחברות בחשבון אחר', 'Sign out and use another account')}
        </button>
      </div>
    </section>
  )
}

export function Admin() {
  const { t } = useI18n()
  // undefined while Supabase is still reading a saved sign-in or finishing a Google redirect.
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setIsAdmin(null)
    if (!session) return
    supabase.rpc('is_admin').then(({ data, error }) => setIsAdmin(!error && data === true))
  }, [session])

  if (session === undefined || (session && isAdmin === null)) {
    return (
      <section className="admin-login">
        <p className="modal-text">{t('בודקים כניסה...', 'Checking sign-in...')}</p>
      </section>
    )
  }
  if (!session) return <AdminLogin />
  if (!isAdmin) return <NotAdmin email={session.user.email} />
  return <AdminPanel onSignOut={() => supabase.auth.signOut()} />
}

function AdminPanel({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useI18n()
  const [tab, setTab] = useState<'letters' | 'families'>('letters')
  const [viewing, setViewing] = useState<Letter | null>(null)
  const [batch, setBatch] = useState<Letter[] | null>(null)
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      setLetters(await loadLetters())
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const changeStatus = async (ids: string[], status: LetterStatus) => {
    const before = letters
    setLetters((l) => l.map((x) => (ids.includes(x.id) ? { ...x, status } : x)))
    try {
      await updateLetterStatus(ids, status)
    } catch {
      setLetters(before)
      setFailed(true)
    }
  }

  const removeLetter = async (letter: Letter) => {
    try {
      await deleteLetter(letter)
      setLetters((l) => l.filter((x) => x.id !== letter.id))
      return true
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (!batch) return
    const done = () => setBatch(null)
    window.addEventListener('afterprint', done, { once: true })
    // Let the batch lay out before the print dialog freezes the page.
    const timer = window.setTimeout(() => window.print(), 150)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('afterprint', done)
    }
  }, [batch])

  return (
    <>
      <section className={`chooser ${viewing ? 'no-print' : ''}`}>
        <div className="container">
          <p className="section-label">{t('ניהול', 'Admin')}</p>
          <div className="admin-title-row">
            <h1 className="section-title">{t('המכתבים לפי משפחה', 'Letters by Family')}</h1>
            <button className="btn btn-secondary btn-small admin-signout" onClick={onSignOut}>
              {t('יציאה', 'Sign out')}
            </button>
          </div>
          <div className="chip-row admin-tabs" role="group" aria-label={t('אזורי ניהול', 'Admin sections')}>
            <button className={`chip ${tab === 'letters' ? 'is-active' : ''}`} aria-pressed={tab === 'letters'} onClick={() => setTab('letters')}>
              {t('מכתבים', 'Letters')}
            </button>
            <button className={`chip ${tab === 'families' ? 'is-active' : ''}`} aria-pressed={tab === 'families'} onClick={() => setTab('families')}>
              {t('עריכת משפחות', 'Edit families')}
            </button>
          </div>
          {tab === 'letters' ? (
            <LettersTab letters={letters} loading={loading} failed={failed} onRefresh={refresh} onStatus={changeStatus} onDelete={removeLetter} onView={setViewing} onPrintAll={setBatch} />
          ) : (
            <FamiliesTab />
          )}
        </div>
      </section>
      {viewing && <LetterViewer letter={viewing} onClose={() => setViewing(null)} />}
      {batch && (
        <div className="print-batch" data-testid="print-batch">
          {batch.map((l) => (
            <LetterPaper key={l.id} design={l.design} greeting={l.greeting} text={l.text} signature={l.signature} />
          ))}
        </div>
      )}
    </>
  )
}
