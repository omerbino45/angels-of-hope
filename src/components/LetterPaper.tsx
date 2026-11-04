import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { getBackgroundImage } from '../data/backgrounds'
import { allThemes, fonts } from '../data/studio'
import { useI18n } from '../i18n'
import type { LetterDesign, LetterItem, StickerRef, Stroke } from '../types'

const A4_RATIO = 141.4

interface Props {
  design: LetterDesign
  greeting: string
  text: string
  signature?: string
  editable?: boolean
  drawing?: boolean
  pen?: { color: string; width: number }
  onText?: (text: string) => void
  onItems?: (items: LetterItem[]) => void
  onStrokes?: (strokes: Stroke[]) => void
  textRef?: React.RefObject<HTMLDivElement | null>
}

function svgUri(body: string, size: number) {
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'>${body}</svg>`)}")`
}

const star = (cx: number, cy: number, r: number) => {
  const pts = (rot: number) =>
    [0, 1, 2].map((i) => {
      const a = rot + (i * 2 * Math.PI) / 3
      return `${(cx + r * Math.sin(a)).toFixed(2)},${(cy - r * Math.cos(a)).toFixed(2)}`
    }).join(' ')
  return [pts(0), pts(Math.PI)]
}

function starSvg(cx: number, cy: number, r: number, color: string, width: number) {
  return star(cx, cy, r)
    .map((p) => `<polygon points='${p}' fill='none' stroke='${color}' stroke-width='${width}'/>`)
    .join('')
}

// The text color a page gets until the writer picks one.
export function autoInk(bgId: string, themeInk: string) {
  const bg = getBackgroundImage(bgId)
  return bg ? (bg.tone === 'dark' ? '#f7f2e8' : '#0d1f3c') : themeInk
}

export function PaperBackground({ bgId, accent, flagColor }: { bgId: string; accent: string; flagColor: string }) {
  if (bgId === 'frame') {
    return (
      <div className="bg-layer">
        <div className="bg-frame" style={{ borderColor: accent }} />
      </div>
    )
  }
  if (bgId === 'waves') {
    return (
      <div className="bg-layer">
        <svg className="bg-wave bg-wave-tl" viewBox="0 0 300 240" aria-hidden="true">
          <path d="M0,0 Q80,55 35,125 Q0,195 55,240 L0,240 Z" fill={accent} opacity=".18" />
          <path d="M0,0 Q45,75 8,155 L0,155 Z" fill={accent} opacity=".14" />
        </svg>
        <svg className="bg-wave bg-wave-br" viewBox="0 0 240 190" aria-hidden="true">
          <path d="M240,190 Q165,135 205,75 Q240,18 185,0 L240,0 Z" fill={accent} opacity=".18" />
        </svg>
      </div>
    )
  }
  if (bgId === 'stars') {
    return (
      <div
        className="bg-layer bg-tile-repeat"
        style={{ backgroundImage: svgUri(`<g opacity='.13'>${starSvg(30, 30, 11, accent, 1.2)}</g>`, 60) }}
      />
    )
  }
  if (bgId === 'hearts') {
    return (
      <div
        className="bg-layer bg-tile-repeat"
        style={{
          backgroundImage: svgUri(
            `<path opacity='.13' fill='${accent}' d='M30 42 C16 32 14 24 19 20 C23 17 28 19 30 23 C32 19 37 17 41 20 C46 24 44 32 30 42 Z'/>`,
            60,
          ),
        }}
      />
    )
  }
  if (bgId === 'flag') {
    return (
      <div className="bg-layer">
        <div className="bg-stripe bg-stripe-top" style={{ background: flagColor }} />
        <div className="bg-stripe bg-stripe-bottom" style={{ background: flagColor }} />
        <div
          className="bg-flag-star"
          style={{ backgroundImage: svgUri(`<g opacity='.1'>${starSvg(50, 50, 40, flagColor, 4)}</g>`, 100) }}
        />
      </div>
    )
  }
  return null
}

export function StickerVisual({ sticker }: { sticker: StickerRef }) {
  return <img className="sticker-img" src={sticker.src} alt={sticker.he} draggable={false} />
}

function ItemContent({ item }: { item: LetterItem }) {
  if (item.type === 'sticker') return <StickerVisual sticker={item.sticker} />
  if (item.type === 'image') return <img className="item-image" src={item.src} alt="" draggable={false} style={{ aspectRatio: String(item.ratio) }} />
  const { song } = item
  return (
    <div className="song-block">
      <div className="song-top">
        {song.cover && <img className="song-cover" src={song.cover} alt="" draggable={false} />}
        <img className="song-qr" src={song.qr} alt="QR" draggable={false} />
      </div>
      {song.title && <div className="song-title">{song.title}</div>}
      {song.lines && <div className="song-lines">{song.lines}</div>}
    </div>
  )
}

export const LetterPaper = forwardRef<HTMLDivElement, Props>(function LetterPaper(
  { design, greeting, text, signature, editable, drawing, pen, onText, onItems, onStrokes, textRef },
  ref,
) {
  const { t, lang } = useI18n()
  const paperRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const localTextRef = useRef<HTMLDivElement>(null)
  const editorRef = textRef ?? localTextRef
  const [selected, setSelected] = useState<string | null>(null)
  const [minHeight, setMinHeight] = useState(A4_RATIO)
  const [runsPastPage, setRunsPastPage] = useState(false)
  const [liveStroke, setLiveStroke] = useState<string | null>(null)

  const theme = allThemes.find((x) => x.id === design.themeId) ?? allThemes[0]
  const font = fonts.find((x) => x.id === design.fontId) ?? fonts[0]
  const bgImage = getBackgroundImage(design.bgId)
  const onDarkPaper = bgImage ? bgImage.tone === 'dark' : false
  const themeIsDark = theme.ink.startsWith('#f')
  const ink = design.ink ?? autoInk(design.bgId, theme.ink)
  const accent = bgImage ? (onDarkPaper ? '#e6c86e' : themeIsDark ? '#2563a8' : theme.accent) : theme.accent
  const fontRatio = design.baseRatio * design.size * font.scale

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (editable) {
      // Keeps pasted content plain so a letter only ever holds text. Older browsers fall back to the paste handler.
      try {
        el.contentEditable = 'plaintext-only'
      } catch {
        el.contentEditable = 'true'
      }
      if (text && !el.textContent) el.textContent = text
    }
    // Only runs at mount: after that the DOM owns the text while the user types.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selected) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.paper-item')) setSelected(null)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [selected])

  // An image background repeats past the first page, so a longer letter gets a panel to stay readable over it.
  useLayoutEffect(() => {
    const paper = paperRef.current
    const editor = editorRef.current
    if (!paper || !editor) return
    const update = () => {
      const box = paper.getBoundingClientRect()
      if (!box.width) return
      setRunsPastPage(((editor.getBoundingClientRect().bottom - box.top) / box.width) * 100 > A4_RATIO)
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(editor)
    obs.observe(paper)
    return () => obs.disconnect()
  }, [])

  // A sticker placed low on the page, or a tall photo, extends the sheet instead of being clipped.
  useLayoutEffect(() => {
    const paper = paperRef.current
    const overlay = overlayRef.current
    if (!paper || !overlay) return
    const update = () => {
      const width = paper.getBoundingClientRect().width
      if (!width) return
      let bottom = A4_RATIO
      overlay.querySelectorAll<HTMLElement>('.paper-item').forEach((el) => {
        bottom = Math.max(bottom, ((el.offsetTop + el.offsetHeight) / width) * 100 + 2)
      })
      setMinHeight(bottom)
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(paper)
    overlay.querySelectorAll('.paper-item').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [design.items])

  const moveItem = (id: string, patch: Partial<Pick<LetterItem, 'x' | 'y' | 'w'>>) => {
    onItems?.(design.items.map((it) => (it.id === id ? ({ ...it, ...patch } as LetterItem) : it)))
  }

  const startDrag = (e: ReactPointerEvent<HTMLElement>, item: LetterItem) => {
    if (!editable || drawing) return
    setSelected(item.id)
    const paper = paperRef.current!
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const width = paper.getBoundingClientRect().width
    const height = paper.getBoundingClientRect().height
    const startX = e.clientX
    const startY = e.clientY
    const onMove = (ev: PointerEvent) => {
      const x = Math.min(1 - item.w, Math.max(0, item.x + (ev.clientX - startX) / width))
      const y = Math.min(height / width - 0.03, Math.max(0, item.y + (ev.clientY - startY) / width))
      moveItem(item.id, { x, y })
    }
    const onUp = () => {
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
    }
    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }

  const startResize = (e: ReactPointerEvent<HTMLElement>, item: LetterItem) => {
    e.stopPropagation()
    const paper = paperRef.current!
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const width = paper.getBoundingClientRect().width
    const startX = e.clientX
    const onMove = (ev: PointerEvent) => {
      const w = Math.min(1 - item.x, Math.max(0.06, item.w + (ev.clientX - startX) / width))
      moveItem(item.id, { w })
    }
    const onUp = () => {
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
    }
    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }

  const onItemKey = (e: React.KeyboardEvent, item: LetterItem) => {
    const step = e.shiftKey ? 0.05 : 0.01
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onItems?.(design.items.filter((x) => x.id !== item.id))
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      moveItem(item.id, { x: Math.max(0, item.x - step) })
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      moveItem(item.id, { x: Math.min(1 - item.w, item.x + step) })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveItem(item.id, { y: Math.max(0, item.y - step) })
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveItem(item.id, { y: item.y + step })
    }
  }

  const startStroke = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pen) return
    e.preventDefault()
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const rect = paperRef.current!.getBoundingClientRect()
    const toPoint = (ev: { clientX: number; clientY: number }) =>
      `${(((ev.clientX - rect.left) / rect.width) * 1000).toFixed(1)},${(((ev.clientY - rect.top) / rect.width) * 1000).toFixed(1)}`
    let points = toPoint(e)
    // A tap with no movement still has to leave a dot.
    points = `${points} ${points}`
    setLiveStroke(points)
    const onMove = (ev: PointerEvent) => {
      points += ` ${toPoint(ev)}`
      setLiveStroke(points)
    }
    const onUp = () => {
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
      setLiveStroke(null)
      onStrokes?.([...design.strokes, { id: crypto.randomUUID(), color: pen.color, width: pen.width, points }])
    }
    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }

  return (
    <div ref={ref} className="paper-export">
      <div
        ref={paperRef}
        className="paper"
        style={{ background: theme.paper, color: ink, fontFamily: font.family }}
      >
        <div className="paper-inner" style={{ minHeight: `${minHeight}cqw` }}>
          {bgImage ? (
            <div className="bg-layer bg-photo" style={{ backgroundImage: `url("${bgImage.src}")` }} />
          ) : (
            <PaperBackground bgId={design.bgId} accent={theme.accent} flagColor={themeIsDark ? '#4a89c8' : '#1f4fa8'} />
          )}
          <div
            className={`paper-content ${bgImage ? `on-photo-${bgImage.tone}` : ''} ${bgImage && runsPastPage ? 'runs-past-page' : ''}`}
            style={{
              fontSize: `${fontRatio * 100}cqw`,
              ...(bgImage?.pad?.t !== undefined && { paddingTop: `${bgImage.pad.t}cqw` }),
              ...(bgImage?.pad?.b !== undefined && { paddingBottom: `${bgImage.pad.b}cqw` }),
              ...(bgImage?.pad?.r !== undefined && { paddingRight: `${bgImage.pad.r}cqw` }),
              ...(bgImage?.pad?.l !== undefined && { paddingLeft: `${bgImage.pad.l}cqw` }),
            }}
          >
            <p className="paper-greeting" style={{ color: accent }}>{greeting}</p>
            <div
              ref={editorRef}
              className={`paper-text ${design.bgId === 'lines' ? 'paper-lined' : ''}`}
              style={design.bgId === 'lines' ? { ['--line' as string]: `${theme.accent}55` } : undefined}
              dir={lang === 'he' ? 'rtl' : 'ltr'}
              role={editable ? 'textbox' : undefined}
              aria-multiline={editable ? true : undefined}
              aria-label={editable ? t('תוכן המכתב', 'Letter text') : undefined}
              data-placeholder={t('כתבו כאן את המכתב שלכם...', 'Write your letter here...')}
              suppressContentEditableWarning
              onInput={(e) => {
                const el = e.currentTarget
                // Browsers leave a stray newline behind when everything is deleted, which hides the placeholder.
                if (el.innerText.trim() === '') el.textContent = ''
                onText?.(el.innerText)
              }}
              onPaste={(e) => {
                e.preventDefault()
                document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
              }}
            >
              {editable ? null : text}
            </div>
            {signature && <p className="paper-sign">{signature}</p>}
            <p className="paper-foot" style={{ color: accent }}>מלאכים של תקווה</p>
          </div>

          <svg className="stroke-layer" viewBox="0 0 1000 6000" aria-hidden="true">
            {design.strokes.map((s) => (
              <polyline key={s.id} points={s.points} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {liveStroke && pen && (
              <polyline points={liveStroke} fill="none" stroke={pen.color} strokeWidth={pen.width} strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>

          <div ref={overlayRef} className="item-layer">
            {design.items.map((item) => (
              <div
                key={item.id}
                className={`paper-item ${selected === item.id ? 'is-selected' : ''} ${editable ? 'is-editable' : ''}`}
                style={{ left: `${item.x * 100}cqw`, top: `${item.y * 100}cqw`, width: `${item.w * 100}cqw` }}
                tabIndex={editable ? 0 : undefined}
                role={editable ? 'group' : undefined}
                aria-label={editable ? t('פריט על הדף. גררו להזזה, Delete למחיקה', 'Item on the page. Drag to move, Delete to remove') : undefined}
                onPointerDown={(e) => startDrag(e, item)}
                onFocus={() => editable && setSelected(item.id)}
                onKeyDown={(e) => editable && onItemKey(e, item)}
              >
                <ItemContent item={item} />
                {editable && selected === item.id && (
                  <>
                    <button
                      className="item-delete no-export no-print"
                      aria-label={t('מחיקת פריט', 'Remove item')}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onItems?.(design.items.filter((x) => x.id !== item.id))}
                    >
                      ✕
                    </button>
                    <span className="item-resize no-export no-print" onPointerDown={(e) => startResize(e, item)} aria-hidden="true" />
                  </>
                )}
              </div>
            ))}
          </div>

          {editable && drawing && <div className="draw-capture no-print no-export" onPointerDown={startStroke} />}
        </div>
      </div>
    </div>
  )
})
