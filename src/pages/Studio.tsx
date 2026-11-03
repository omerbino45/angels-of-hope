import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { LetterPaper, StickerVisual } from '../components/LetterPaper'
import { Modal } from '../components/Modal'
import { GENERAL_ID } from '../data/families'
import { backgrounds, blankTheme, fonts, penColors, penWidths, sizes, stickerCategories, themes, writingPrompts } from '../data/studio'
import { useI18n } from '../i18n'
import { gregDateStr, hebrewDateStr, parseGregDate } from '../lib/dates'
import { downloadPng, fetchSpotifyInfo, parseSpotifyUrl, readImage } from '../lib/export'
import { useStore } from '../store'
import type { Family, LetterDesign, LetterItem, StickerRef } from '../types'

type Tab = 'stickers' | 'draw' | 'image' | 'song' | 'prompts'

const newId = () => crypto.randomUUID()

function greetingFor(family: Family | null, en: boolean) {
  if (!family) return en ? 'Dear families,' : 'למשפחות היקרות,'
  const name = family.name.replace(/^משפחת\s*/, '')
  return en ? `Dear ${family.name},` : `למשפחת ${name} היקרה,`
}

function FallenPanel({ family }: { family: Family | null }) {
  const { t } = useI18n()
  const [more, setMore] = useState(false)
  if (!family) {
    return (
      <div className="fallen-card">
        <h2 className="fallen-name">{t('מכתב למשפחות', 'A letter to the families')}</h2>
        <p className="fallen-bio">
          {t('המכתב הזה יועבר למשפחה ששמחה לקבל מכתב. כתבו מהלב.', 'This letter will reach a family who would love to receive one. Write from the heart.')}
        </p>
      </div>
    )
  }
  const d = parseGregDate(family.date)
  return (
    <div className="fallen-card">
      <div className="fallen-photo">
        {family.photo ? (
          <img src={family.photo} alt={family.fallen} />
        ) : (
          <span aria-hidden="true">🕯️</span>
        )}
      </div>
      <p className="fallen-label">{t('לזכר', 'In memory of')}</p>
      <h2 className="fallen-name">{family.fallen || family.name}</h2>
      <p className="fallen-family">{family.name}</p>
      <button className="fallen-toggle" aria-expanded={more} onClick={() => setMore((v) => !v)}>
        {more ? t('הסתרת הפרטים', 'Hide details') : t('פרטים נוספים', 'More details')}
      </button>
      <div className={`fallen-more ${more ? 'is-open' : ''}`}>
        {family.city && <p className="fallen-meta">{family.city}</p>}
        {d && (
          <p className="fallen-meta">
            נפל ביום {hebrewDateStr(d)}
            <br />
            {gregDateStr(d)}
          </p>
        )}
        <p className="fallen-bio">
          {family.bio ||
            t('הסיפור המלא והתמונה יתווספו כאן באישור המשפחה.', "The full story and photo will be added here with the family's approval.")}
        </p>
        <a className="fallen-link" href="https://www.izkor.gov.il/" target="_blank" rel="noreferrer">
          {t('לאתר יזכור', 'Visit Izkor')} ↗
        </a>
      </div>
    </div>
  )
}

export function Studio() {
  const { t, lang } = useI18n()
  const { familyId } = useParams()
  const { families, addLetter } = useStore()
  const navigate = useNavigate()

  const isGeneral = familyId === GENERAL_ID
  const family = families.find((f) => f.id === familyId) ?? null

  const [design, setDesign] = useState<LetterDesign>(() => ({
    themeId: 'hope',
    bgId: 'plain',
    fontId: 'heebo',
    size: 1,
    baseRatio: window.innerWidth < 640 ? 0.05 : 0.031,
    items: [],
    strokes: [],
  }))
  const [text, setText] = useState('')
  const [tab, setTab] = useState<Tab | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [penColor, setPenColor] = useState(penColors[0])
  const [penWidth, setPenWidth] = useState(penWidths[1])
  const [category, setCategory] = useState(stickerCategories[0].id)
  const [songUrl, setSongUrl] = useState('')
  const [songLines, setSongLines] = useState('')
  const [songError, setSongError] = useState('')
  const [songBusy, setSongBusy] = useState(false)
  const [imageError, setImageError] = useState('')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [writer, setWriter] = useState('')
  const [email, setEmail] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [formError, setFormError] = useState('')
  const [signoff, setSignoff] = useState('')
  const [sent, setSent] = useState(false)
  const [exporting, setExporting] = useState(false)

  const exportRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const paperColRef = useRef<HTMLDivElement>(null)

  const greeting = useMemo(() => greetingFor(family, lang === 'en'), [family, lang])
  const prompts = useMemo(() => writingPrompts(family?.fallen || null), [family])

  const dirty = !sent && (text.trim() !== '' || design.items.length > 0 || design.strokes.length > 0)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (!family && !isGeneral) {
    return (
      <section className="chooser">
        <div className="container center">
          <h1 className="section-title">{t('לא מצאנו את המשפחה הזו', "We couldn't find this family")}</h1>
          <Link className="btn btn-primary" to="/write">
            {t('חזרה לבחירת משפחה', 'Back to choosing a family')}
          </Link>
        </div>
      </section>
    )
  }

  const patch = (p: Partial<LetterDesign>) => setDesign((d) => ({ ...d, ...p }))
  const setItems = (items: LetterItem[]) => patch({ items })

  const switchTab = (next: Tab) => {
    const opening = tab !== next
    setTab(opening ? next : null)
    setDrawing(opening && next === 'draw')
  }

  /** New items land in the part of the page currently on screen, not at the top of a long sheet. */
  const placementY = (w: number) => {
    const rect = paperColRef.current?.querySelector('.paper')?.getBoundingClientRect()
    if (!rect) return 0.1
    const visibleMid = (Math.max(rect.top, 80) + Math.min(rect.bottom, window.innerHeight - 180)) / 2
    return Math.max(0.02, (visibleMid - rect.top) / rect.width - w / 2)
  }

  const addItem = (item: LetterItem) => setItems([...design.items, item])

  const addSticker = (sticker: StickerRef) => {
    const w = sticker.kind === 'emoji' ? 0.12 : 0.2
    addItem({
      id: newId(),
      type: 'sticker',
      sticker,
      w,
      x: 0.5 - w / 2 + (design.items.length % 5) * 0.03,
      y: placementY(w),
    })
  }

  const onImage = async (file: File | undefined) => {
    setImageError('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageError(t('אפשר להעלות קובצי תמונה בלבד.', 'Only image files can be uploaded.'))
      return
    }
    try {
      const { src, ratio } = await readImage(file)
      const w = ratio > 1 ? 0.5 : 0.35
      addItem({ id: newId(), type: 'image', src, ratio, w, x: 0.5 - w / 2, y: placementY(w / ratio) })
    } catch {
      setImageError(t('לא הצלחנו לקרוא את התמונה הזו.', "We couldn't read this image."))
    }
  }

  const addSong = async () => {
    setSongError('')
    const url = parseSpotifyUrl(songUrl)
    if (!url) {
      setSongError(t('הדביקו קישור לשיר מספוטיפיי (open.spotify.com).', 'Paste a Spotify song link (open.spotify.com).'))
      return
    }
    setSongBusy(true)
    const [qr, info] = await Promise.all([
      QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: '#0f2d5e', light: '#ffffff' } }),
      fetchSpotifyInfo(url),
    ])
    setSongBusy(false)
    addItem({
      id: newId(),
      type: 'song',
      song: { url, qr, title: info.title, cover: info.cover, lines: songLines.trim() },
      w: 0.42,
      x: 0.29,
      y: placementY(0.3),
    })
    setSongUrl('')
    setSongLines('')
    setTab(null)
  }

  const insertPrompt = (prompt: string) => {
    const el = textRef.current
    if (!el) return
    const current = el.textContent ?? ''
    el.textContent = current ? `${current.replace(/\n+$/, '')}\n${prompt}` : prompt
    setText(el.innerText)
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  const pickTheme = (id: string) => {
    if (id === blankTheme.id) {
      patch({ themeId: id, bgId: 'plain', ink: undefined })
      setTab('draw')
      setDrawing(true)
    } else {
      patch({ themeId: id, ink: undefined })
    }
  }

  const exportPng = async () => {
    if (!exportRef.current) return
    setExporting(true)
    try {
      await downloadPng(exportRef.current, 'letter.png')
    } finally {
      setExporting(false)
    }
  }

  const openSubmit = () => {
    setFormError('')
    setDrawing(false)
    setSubmitOpen(true)
  }

  const submit = () => {
    if (!writer.trim()) {
      setFormError(t('נא למלא שם.', 'Please enter your name.'))
      return
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError(t('כתובת המייל לא נראית תקינה.', "That email address doesn't look right."))
      return
    }
    addLetter({
      id: newId(),
      familyId: family?.id ?? GENERAL_ID,
      greeting,
      text,
      design,
      writer: writer.trim(),
      email: email.trim(),
      isPublic,
      signature,
      status: 'new',
      createdAt: Date.now(),
    })
    setSubmitOpen(false)
    setSent(true)
    window.scrollTo({ top: 0 })
  }

  const signature = `${signoff || t('באהבה,', 'With love,')} ${writer.trim()}`.trim()

  const empty = text.trim() === '' && design.items.length === 0 && design.strokes.length === 0

  const promptList = (
    <div className="prompt-list">
      {prompts.map((p) => (
        <button key={p.en} className="prompt-btn" onClick={() => insertPrompt(t(p.he, p.en))}>
          {t(p.he, p.en)}
        </button>
      ))}
    </div>
  )

  if (sent) {
    return (
      <section className="chooser">
        <div className="container center">
          <div className="envelope-scene" aria-hidden="true">
            <div className="envelope-letter">
              <LetterPaper design={design} greeting={greeting} text={text} signature={signature} />
            </div>
            <div className="envelope">
              <div className="envelope-flap" />
              <div className="envelope-seal">💙</div>
            </div>
          </div>
          <h1 className="section-title">{t('תודה רבה! 💙', 'Thank You! 💙')}</h1>
          <p className="section-text sent-text">
            {t('המכתב שלך יועבר למשפחה בקרוב. מכתב אחד יכול להאיר יום שלם.', 'Your letter will be delivered soon. One letter can light up an entire day.')}
          </p>
          <div className="cta-row cta-center">
            <button className="btn btn-primary" onClick={() => navigate('/write')}>
              {t('כתבו מכתב נוסף', 'Write another letter')}
            </button>
            <Link className="btn btn-secondary" to="/">
              {t('חזרה לדף הבית', 'Back to home')}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="studio">
      <div className="studio-grid">
        <div className="studio-paper-col" ref={paperColRef}>
          <div className="toolbar no-print">
            <div className="toolbar-group">
              <span className="toolbar-label" id="themes-label">{t('ערכת נושא', 'Theme')}</span>
              <div className="swatches" role="group" aria-labelledby="themes-label">
                {[...themes, blankTheme].map((th) => (
                  <button
                    key={th.id}
                    className={`swatch ${design.themeId === th.id ? 'is-active' : ''}`}
                    style={{ background: th.paper, color: th.accent }}
                    title={t(th.he, th.en)}
                    aria-label={t(th.he, th.en)}
                    aria-pressed={design.themeId === th.id}
                    onClick={() => pickTheme(th.id)}
                  >
                    {th.id === blankTheme.id ? '✎' : <span className="swatch-dot" style={{ background: th.accent }} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="toolbar-group">
              <label className="toolbar-label" htmlFor="font-select">{t('גופן', 'Font')}</label>
              <select id="font-select" className="toolbar-select" value={design.fontId} onChange={(e) => patch({ fontId: e.target.value })}>
                {fonts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {t(f.he, f.en)}
                  </option>
                ))}
              </select>
            </div>
            <div className="toolbar-group">
              <label className="toolbar-label" htmlFor="bg-select">{t('רקע', 'Background')}</label>
              <select id="bg-select" className="toolbar-select" value={design.bgId} onChange={(e) => patch({ bgId: e.target.value })}>
                {backgrounds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {t(b.he, b.en)}
                  </option>
                ))}
              </select>
            </div>
            <div className="toolbar-group">
              <label className="toolbar-label" htmlFor="size-select">{t('גודל', 'Size')}</label>
              <select id="size-select" className="toolbar-select" value={design.size} onChange={(e) => patch({ size: Number(e.target.value) })}>
                {sizes.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(s.he, s.en)}
                  </option>
                ))}
              </select>
            </div>
            <div className="toolbar-group desktop-only">
              <label className="toolbar-label" htmlFor="ink-input">{t('צבע טקסט', 'Text color')}</label>
              <input
                id="ink-input"
                className="toolbar-color"
                type="color"
                value={design.ink ?? [...themes, blankTheme].find((x) => x.id === design.themeId)!.ink}
                onChange={(e) => patch({ ink: e.target.value })}
              />
            </div>
          </div>

          <LetterPaper
            ref={exportRef}
            design={design}
            greeting={greeting}
            text={text}
            editable
            drawing={drawing}
            pen={{ color: penColor, width: penWidth }}
            onText={setText}
            onItems={setItems}
            onStrokes={(strokes) => patch({ strokes })}
            textRef={textRef}
          />

          <div className="dock no-print">
            {tab && (
              <div className="dock-panel">
                {tab === 'stickers' && (
                  <>
                    <div className="chip-row" role="group" aria-label={t('קטגוריות', 'Categories')}>
                      {stickerCategories.map((c) => (
                        <button key={c.id} className={`chip ${category === c.id ? 'is-active' : ''}`} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                          {t(c.he, c.en)}
                        </button>
                      ))}
                    </div>
                    <div className="sticker-grid">
                      {stickerCategories
                        .find((c) => c.id === category)!
                        .stickers.map((s, i) => (
                          <button
                            key={i}
                            className="sticker-btn"
                            aria-label={s.kind === 'emoji' ? s.value : s.kind === 'unit' ? s.label : t('דגל ישראל', 'Israeli flag')}
                            onClick={() => addSticker(s)}
                          >
                            <StickerVisual sticker={s} />
                          </button>
                        ))}
                    </div>
                  </>
                )}
                {tab === 'draw' && (
                  <div className="draw-tools">
                    <button className={`chip ${drawing ? 'is-active' : ''}`} aria-pressed={drawing} onClick={() => setDrawing((v) => !v)}>
                      {drawing ? t('✎ העט פעיל, ציירו על הדף', '✎ Pen on, draw on the page') : t('✎ הפעלת העט', '✎ Turn pen on')}
                    </button>
                    <div className="swatches" role="group" aria-label={t('צבע עט', 'Pen color')}>
                      {penColors.map((c) => (
                        <button key={c} className={`swatch swatch-pen ${penColor === c ? 'is-active' : ''}`} style={{ background: c }} aria-label={c} aria-pressed={penColor === c} onClick={() => setPenColor(c)} />
                      ))}
                    </div>
                    <div className="swatches" role="group" aria-label={t('עובי עט', 'Pen width')}>
                      {penWidths.map((w) => (
                        <button key={w} className={`swatch swatch-width ${penWidth === w ? 'is-active' : ''}`} aria-label={String(w)} aria-pressed={penWidth === w} onClick={() => setPenWidth(w)}>
                          <span style={{ width: w + 3, height: w + 3 }} />
                        </button>
                      ))}
                    </div>
                    <button className="chip" disabled={design.strokes.length === 0} onClick={() => patch({ strokes: design.strokes.slice(0, -1) })}>
                      {t('ביטול קו', 'Undo line')}
                    </button>
                    <button className="chip" disabled={design.strokes.length === 0} onClick={() => patch({ strokes: [] })}>
                      {t('ניקוי הציור', 'Clear drawing')}
                    </button>
                  </div>
                )}
                {tab === 'image' && (
                  <div className="image-tool">
                    <label className="btn btn-secondary file-btn">
                      {t('בחירת תמונה מהמכשיר', 'Choose an image')}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          onImage(e.target.files?.[0])
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <p className="dock-hint">{t('אפשר גם תמונה משותפת שלכם עם הגיבור, אם יש לכם כזו.', 'You can also add a photo of yours with the hero, if you have one.')}</p>
                    {imageError && <p className="form-error" role="alert">{imageError}</p>}
                  </div>
                )}
                {tab === 'song' && (
                  <div className="song-tool">
                    <label className="form-label" htmlFor="song-url">{t('קישור לשיר בספוטיפיי', 'Spotify song link')}</label>
                    <input id="song-url" className="form-input" dir="ltr" value={songUrl} onChange={(e) => setSongUrl(e.target.value)} placeholder="https://open.spotify.com/track/..." />
                    <label className="form-label" htmlFor="song-lines">{t('כמה מילים שלכם על השיר (לא חובה)', 'A few words about the song (optional)')}</label>
                    <textarea id="song-lines" className="form-input song-lines-input" rows={2} value={songLines} onChange={(e) => setSongLines(e.target.value)} />
                    {songError && <p className="form-error" role="alert">{songError}</p>}
                    <button className="btn btn-secondary" disabled={songBusy} onClick={addSong}>
                      {songBusy ? t('מוסיפים...', 'Adding...') : t('הוספה למכתב', 'Add to the letter')}
                    </button>
                  </div>
                )}
                {tab === 'prompts' && promptList}
              </div>
            )}
            <div className="dock-bar">
              <div className="dock-tabs" role="group" aria-label={t('כלים', 'Tools')}>
                {(
                  [
                    ['stickers', 'סטיקרים', 'Stickers'],
                    ['draw', 'ציור', 'Draw'],
                    ['image', 'תמונה', 'Photo'],
                    ['song', 'שיר', 'Song'],
                  ] as [Tab, string, string][]
                ).map(([id, he, en]) => (
                  <button key={id} className={`dock-tab ${tab === id ? 'is-active' : ''}`} aria-pressed={tab === id} onClick={() => switchTab(id)}>
                    {t(he, en)}
                  </button>
                ))}
                <button className={`dock-tab mobile-only ${tab === 'prompts' ? 'is-active' : ''}`} aria-pressed={tab === 'prompts'} onClick={() => switchTab('prompts')}>
                  {t('הצעות', 'Ideas')}
                </button>
              </div>
              <div className="dock-actions">
                <button className="dock-action" onClick={() => window.print()}>
                  {t('הדפסה / PDF', 'Print / PDF')}
                </button>
                <button className="dock-action" disabled={exporting} onClick={exportPng}>
                  {exporting ? t('מכינים...', 'Preparing...') : t('הורדת תמונה', 'Save image')}
                </button>
                <button className="btn btn-primary dock-send" disabled={empty} onClick={openSubmit}>
                  {t('סיימתי, שליחה 💙', 'Done, send 💙')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="studio-side no-print">
          <Link className="back-link" to="/write">
            {t('→ בחירת משפחה אחרת', '← Choose another family')}
          </Link>
          <FallenPanel family={family} />
          <div className="prompts desktop-only">
            <h3 className="prompts-title">{t('לא יודעים איך להתחיל?', 'Not sure how to start?')}</h3>
            <p className="prompts-tip">
              {t('אין צורך במילים גדולות. כמה שורות כנות ואישיות מספיקות כדי שהמשפחה תרגיש שזוכרים.', 'No need for big words. A few honest, personal lines are enough for a family to feel remembered.')}
            </p>
            {promptList}
          </div>
        </aside>
      </div>

      {submitOpen && (
        <Modal title={t('כמעט סיימנו', 'Almost done')} onClose={() => setSubmitOpen(false)} wide>
          <div className="submit-grid">
          <div className="submit-preview">
            <LetterPaper design={design} greeting={greeting} text={text} signature={signature} />
          </div>
          <div>
          <div className="form-group">
            <label className="form-label" htmlFor="writer-signoff">{t('מילות סיום', 'Closing words')}</label>
            <input id="writer-signoff" className="form-input" value={signoff} placeholder={t('באהבה,', 'With love,')} onChange={(e) => setSignoff(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="writer-name">{t('שם מלא', 'Full Name')}</label>
            <input id="writer-name" className="form-input" value={writer} onChange={(e) => { setWriter(e.target.value); setFormError('') }} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="writer-email">{t('כתובת מייל (לא חובה)', 'Email (optional)')}</label>
            <input id="writer-email" className="form-input" type="email" dir="ltr" value={email} onChange={(e) => { setEmail(e.target.value); setFormError('') }} />
          </div>
          <label className="check-row">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            <span>{t('אפשר להציג את המכתב גם לאחרים, באישור המשפחה', 'This letter may also be shown to others, with the family\'s approval')}</span>
          </label>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <button className="form-submit" onClick={submit}>
            {t('שלחו את המכתב 💙', 'Send the Letter 💙')}
          </button>
          </div>
          </div>
        </Modal>
      )}

      {blocker.state === 'blocked' && (
        <Modal title={t('לצאת בלי לשלוח?', 'Leave without sending?')} onClose={() => blocker.reset()}>
          <p className="modal-text">{t('המכתב לא נשמר ויימחק אם תצאו מהדף.', "Your letter isn't saved and will be lost if you leave.")}</p>
          <div className="cta-row">
            <button className="btn btn-primary" onClick={() => blocker.reset()}>
              {t('להמשיך לכתוב', 'Keep writing')}
            </button>
            <button className="btn btn-secondary" onClick={() => blocker.proceed()}>
              {t('לצאת בלי לשמור', 'Leave anyway')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
