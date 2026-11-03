import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { LetterPaper } from '../components/LetterPaper'
import { Modal } from '../components/Modal'
import { GENERAL_ID, sampleFamily } from '../data/families'
import { useI18n } from '../i18n'
import { downloadPng, readImage } from '../lib/export'
import { useStore } from '../store'
import type { Family, Letter, LetterStatus } from '../types'

const generalFamily: Family = { id: GENERAL_ID, name: 'מכתבים כלליים', fallen: '', city: '', date: '', acceptsLetters: false }

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
  const url = `${window.location.origin}/write/${family.id}`
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 480, color: { dark: '#0f2d5e', light: '#ffffff' } }).then(setQr)
  }, [url])

  const message = `כתבו מכתב למשפחה: ${url}`
  return (
    <Modal title={t(`קישור לכיתה: ${family.fallen || family.name}`, `Class link: ${family.fallen || family.name}`)} onClose={onClose}>
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

function LettersTab({ onView, onPrintAll }: { onView: (letter: Letter) => void; onPrintAll: (letters: Letter[]) => void }) {
  const { t } = useI18n()
  const { families, letters, updateLetter } = useStore()
  const [open, setOpen] = useState<Family | null>(null)
  const [sharing, setSharing] = useState<Family | null>(null)
  const [query, setQuery] = useState('')

  const cards = useMemo(() => {
    const hasGeneral = letters.some((l) => l.familyId === GENERAL_ID)
    return [sampleFamily, ...(hasGeneral ? [generalFamily] : []), ...families]
  }, [families, letters])

  const visible = cards.filter((f) => `${f.fallen} ${f.name} ${f.city}`.includes(query.trim()))
  const openLetters = open ? letters.filter((l) => l.familyId === open.id) : []

  const real = letters.filter((l) => !l.sample)
  const waiting = real.filter((l) => l.status === 'new').length
  const isRealFamily = open && open.id !== sampleFamily.id && open.id !== GENERAL_ID

  const statuses: { value: LetterStatus; he: string; en: string }[] = [
    { value: 'new', he: 'חדש', en: 'New' },
    { value: 'printed', he: 'הודפס', en: 'Printed' },
    { value: 'delivered', he: 'נמסר', en: 'Delivered' },
  ]

  return (
    <>
      <p className="admin-stats">
        {t(`${real.length === 1 ? 'מכתב אחד התקבל' : `${real.length} מכתבים התקבלו`} · ${waiting === 1 ? 'אחד ממתין' : `${waiting} ממתינים`} להדפסה`, `${real.length} ${real.length === 1 ? 'letter' : 'letters'} received · ${waiting} waiting to print`)}
      </p>
      <input
        className="form-input admin-search"
        type="search"
        aria-label={t('חיפוש משפחה', 'Search families')}
        placeholder={t('חיפוש משפחה', 'Search families')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="family-grid">
        {visible.map((f) => {
          const familyLetters = letters.filter((l) => l.familyId === f.id)
          const count = familyLetters.length
          const fresh = familyLetters.filter((l) => l.status === 'new').length
          return (
            <button className={`family-tile admin-tile ${f.id === sampleFamily.id ? 'is-sample' : ''}`} key={f.id} onClick={() => setOpen(f)}>
              <span className="tile-name">{f.fallen || f.name || t('משפחה חדשה', 'New family')}</span>
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
        <Modal title={open.name || t('משפחה חדשה', 'New family')} onClose={() => setOpen(null)}>
          <div className="family-modal-actions">
            {openLetters.length > 0 && (
              <button
                className="btn btn-primary btn-small"
                onClick={() => {
                  setOpen(null)
                  onPrintAll(openLetters)
                }}
              >
                {t('הדפסת כל המכתבים', 'Print all letters')}
              </button>
            )}
            {isRealFamily && (
              <button
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setSharing(open)
                  setOpen(null)
                }}
              >
                {t('קישור ו-QR לכיתה', 'Class link & QR')}
              </button>
            )}
          </div>
          {openLetters.length === 0 ? (
            <p className="modal-text">{t('עדיין אין מכתבים למשפחה הזו.', 'No letters for this family yet.')}</p>
          ) : (
            <ul className="letter-list">
              {openLetters.map((l) => (
                <li key={l.id} className="letter-row">
                  <div>
                    <strong>{l.writer}</strong>
                    {l.sample && <span className="badge">{t('דוגמה', 'Sample')}</span>}
                    {l.isPublic && <span className="badge badge-public">{t('מאושר לפרסום', 'May be public')}</span>}
                    <div className="letter-meta">
                      {new Intl.DateTimeFormat('he-IL').format(l.createdAt)}
                      {l.email && ` · ${l.email}`}
                    </div>
                  </div>
                  <div className="letter-row-actions">
                    <select
                      className="status-select"
                      aria-label={t('סטטוס המכתב', 'Letter status')}
                      value={l.status}
                      onChange={(e) => updateLetter(l.id, { status: e.target.value as LetterStatus })}
                    >
                      {statuses.map((st) => (
                        <option key={st.value} value={st.value}>
                          {t(st.he, st.en)}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setOpen(null)
                        onView(l)
                      }}
                    >
                      {t('צפייה', 'View')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
      {sharing && <ShareModal family={sharing} onClose={() => setSharing(null)} />}
    </>
  )
}

function FamiliesTab() {
  const { t } = useI18n()
  const { families, updateFamily, addFamily, removeFamily } = useStore()
  const [toDelete, setToDelete] = useState<Family | null>(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(families, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'families.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <div className="cta-row admin-family-actions">
        <button className="btn btn-primary" onClick={addFamily}>
          + {t('הוספת משפחה', 'Add family')}
        </button>
        <button className="btn btn-secondary" onClick={exportJson}>
          {t('הורדת הרשימה', 'Download the list')}
        </button>
      </div>
      <div className="family-rows">
        {families.map((f) => (
          <div className="family-row" key={f.id}>
            <input className="form-input" aria-label={t('שם משפחה', 'Family name')} placeholder={t('שם משפחה', 'Family name')} value={f.name} onChange={(e) => updateFamily(f.id, { name: e.target.value })} />
            <input className="form-input" aria-label={t('שם הנופל/ת', 'Name of the fallen')} placeholder={t('שם הנופל/ת', 'Name of the fallen')} value={f.fallen} onChange={(e) => updateFamily(f.id, { fallen: e.target.value })} />
            <input className="form-input" aria-label={t('יישוב', 'Town')} placeholder={t('יישוב', 'Town')} value={f.city} onChange={(e) => updateFamily(f.id, { city: e.target.value })} />
            <input className="form-input" aria-label={t('תאריך', 'Date')} placeholder="D.M.YYYY" dir="ltr" value={f.date} onChange={(e) => updateFamily(f.id, { date: e.target.value })} />
            <textarea className="form-input family-bio" aria-label={t('סיפור קצר, באישור המשפחה', "Short story, with the family's approval")} placeholder={t('סיפור קצר, באישור המשפחה', "Short story, with the family's approval")} rows={2} value={f.bio ?? ''} onChange={(e) => updateFamily(f.id, { bio: e.target.value })} />
            <div className="family-row-actions">
              <label className="btn btn-secondary btn-small file-btn">
                {f.photo ? t('החלפת תמונה', 'Replace photo') : t('הוספת תמונה', 'Add photo')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    try {
                      const { src } = await readImage(file, 600)
                      updateFamily(f.id, { photo: src })
                    } catch {
                      // An unreadable file leaves the current photo in place.
                    }
                  }}
                />
              </label>
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

export function Admin() {
  const { t } = useI18n()
  const [tab, setTab] = useState<'letters' | 'families'>('letters')
  const [viewing, setViewing] = useState<Letter | null>(null)
  const [batch, setBatch] = useState<Letter[] | null>(null)

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
          <h1 className="section-title">{t('המכתבים לפי משפחה', 'Letters by Family')}</h1>
          <p className="demo-note" role="note">
            {t(
              'מסך הדגמה: עדיין אין שמירה. שינויים ומכתבים נמחקים ברענון הדף, והמכתבים המסומנים "דוגמה" אינם אמיתיים.',
              'Demo screen: nothing is saved yet. Changes and letters are lost on refresh, and letters marked "Sample" are not real.',
            )}
          </p>
          <div className="chip-row admin-tabs" role="group" aria-label={t('אזורי ניהול', 'Admin sections')}>
            <button className={`chip ${tab === 'letters' ? 'is-active' : ''}`} aria-pressed={tab === 'letters'} onClick={() => setTab('letters')}>
              {t('מכתבים', 'Letters')}
            </button>
            <button className={`chip ${tab === 'families' ? 'is-active' : ''}`} aria-pressed={tab === 'families'} onClick={() => setTab('families')}>
              {t('עריכת משפחות', 'Edit families')}
            </button>
          </div>
          {tab === 'letters' ? <LettersTab onView={setViewing} onPrintAll={setBatch} /> : <FamiliesTab />}
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
