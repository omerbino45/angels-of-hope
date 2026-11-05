import { forwardRef, Fragment, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { getBackgroundImage } from '../data/backgrounds'
import { allThemes, fonts } from '../data/studio'
import { useI18n } from '../i18n'
import type { LetterDesign, LetterItem, StickerRef, Stroke } from '../types'
import { CloseIcon } from './CloseIcon'

const A4_RATIO = 141.4
const DEFAULT_PAD_TOP = 9
const DEFAULT_PAD_BOTTOM = 8

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

export function StickerVisual({ sticker, small }: { sticker: StickerRef; small?: boolean }) {
  return <img className="sticker-img" src={small && sticker.thumb ? sticker.thumb : sticker.src} alt={sticker.he} decoding="async" draggable={false} />
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

/** How far down the lowest drawn line reaches, as a fraction of the paper's width. */
function strokesBottom(strokes: Stroke[]) {
  let lowest = 0
  for (const stroke of strokes) {
    for (const point of stroke.points.split(' ')) lowest = Math.max(lowest, Number(point.split(',')[1]))
  }
  return lowest / 1000
}

const itemCenter = (el: Element) => {
  const box = el.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

// Pulls a dragged angle onto the nearest quarter turn when it's close, so a sticker can be put back perfectly straight.
function snapRotation(degrees: number) {
  const nearest = Math.round(degrees / 90) * 90
  const snapped = Math.abs(degrees - nearest) < 4 ? nearest : degrees
  return ((snapped % 360) + 360) % 360
}

export const LetterPaper = forwardRef<HTMLDivElement, Props>(function LetterPaper(
  { design, greeting, text, signature, editable, drawing, pen, onText, onItems, onStrokes, textRef },
  ref,
) {
  const { t, lang } = useI18n()
  const paperRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const flowRef = useRef<HTMLDivElement>(null)
  const localTextRef = useRef<HTMLDivElement>(null)
  const editorRef = textRef ?? localTextRef
  const [selected, setSelected] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(1)
  // Where the text starts and ends on the sheet, in cqw.
  const [textStart, setTextStart] = useState(0)
  const [textBottom, setTextBottom] = useState(0)
  const [liveStroke, setLiveStroke] = useState<string | null>(null)
  const rotateDragged = useRef(false)

  const theme = allThemes.find((x) => x.id === design.themeId) ?? allThemes[0]
  const font = fonts.find((x) => x.id === design.fontId) ?? fonts[0]
  const bgImage = getBackgroundImage(design.bgId)
  const onDarkPaper = bgImage ? bgImage.tone === 'dark' : false
  const themeIsDark = theme.ink.startsWith('#f')
  const panelIsDark = bgImage ? onDarkPaper : themeIsDark
  const ink = design.ink ?? autoInk(design.bgId, theme.ink)
  const accent = bgImage ? (onDarkPaper ? '#e6c86e' : themeIsDark ? '#2563a8' : theme.accent) : theme.accent
  // A frame's lines run where the sign-off normally sits, so it moves into the clear space beside them.
  const padTop = bgImage?.pad?.t ?? DEFAULT_PAD_TOP
  const padBottom = bgImage?.pad?.b ?? DEFAULT_PAD_BOTTOM
  const footPosition = bgImage?.pad?.foot !== undefined ? { bottom: `${bgImage.pad.foot}cqw` } : design.bgId === 'frame' ? { bottom: '4.2cqw' } : undefined
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

  // Pages are added or dropped to fit whatever reaches lowest: the text, a sticker or a drawing.
  useLayoutEffect(() => {
    const paper = paperRef.current
    const editor = editorRef.current
    const flow = flowRef.current
    const overlay = overlayRef.current
    if (!paper || !editor || !flow || !overlay) return
    const update = () => {
      const box = paper.getBoundingClientRect()
      if (!box.width) return
      const lastText = flow.lastElementChild!.getBoundingClientRect().bottom
      let bottom = lastText - box.top
      overlay.querySelectorAll<HTMLElement>('.paper-item').forEach((el) => {
        bottom = Math.max(bottom, el.getBoundingClientRect().bottom - box.top)
      })
      const pageHeight = (box.width * A4_RATIO) / 100
      setPageCount(Math.max(1, Math.ceil(bottom / pageHeight), Math.ceil(strokesBottom(design.strokes) * box.width / pageHeight)))
      setTextStart(((editor.getBoundingClientRect().top - flow.getBoundingClientRect().top) / box.width) * 100)
      setTextBottom(((lastText - box.top) / box.width) * 100)
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(paper)
    obs.observe(editor)
    overlay.querySelectorAll('.paper-item').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [design.items, design.strokes, pageCount])

  const moveItem = (id: string, patch: Partial<Pick<LetterItem, 'x' | 'y' | 'w'>> & { rotation?: number }) => {
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
    const box = target.parentElement!
    const center = itemCenter(box)
    const startDist = Math.hypot(e.clientX - center.x, e.clientY - center.y)
    const heightRatio = box.offsetHeight / box.offsetWidth
    const rotated = item.type === 'sticker' && Boolean(item.rotation)
    const onMove = (ev: PointerEvent) => {
      if (rotated) {
        // The handle can point any way once rotated, so size follows its distance from the sticker's center, which stays put.
        const w = Math.min(1, Math.max(0.06, (item.w * Math.hypot(ev.clientX - center.x, ev.clientY - center.y)) / startDist))
        moveItem(item.id, { w, x: item.x + (item.w - w) / 2, y: item.y + ((item.w - w) * heightRatio) / 2 })
        return
      }
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

  const startRotate = (e: ReactPointerEvent<HTMLElement>, item: Extract<LetterItem, { type: 'sticker' }>) => {
    e.stopPropagation()
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const center = itemCenter(target.parentElement!)
    const angleAt = (ev: { clientX: number; clientY: number }) => (Math.atan2(ev.clientY - center.y, ev.clientX - center.x) * 180) / Math.PI
    const startAngle = angleAt(e)
    const startRotation = item.rotation ?? 0
    rotateDragged.current = false
    const onMove = (ev: PointerEvent) => {
      const delta = angleAt(ev) - startAngle
      // A tiny slip during a tap shouldn't count as a drag.
      if (!rotateDragged.current && Math.abs(delta) < 2) return
      rotateDragged.current = true
      moveItem(item.id, { rotation: snapRotation(startRotation + delta) })
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
        style={{ color: ink, fontFamily: font.family }}
      >
        <div className="paper-inner" style={{ height: `${pageCount * A4_RATIO}cqw` }}>
          {Array.from({ length: pageCount }, (_, page) => (
            <div key={page} className={`paper-sheet ${bgImage ? `on-photo-${bgImage.tone}` : ''}`} style={{ background: theme.paper, top: `${page * A4_RATIO}cqw`, height: `${A4_RATIO}cqw` }}>
              {bgImage ? (
                <div className="bg-layer bg-photo" style={{ backgroundImage: `url("${bgImage.src}")` }} />
              ) : (
                <PaperBackground bgId={design.bgId} accent={theme.accent} flagColor={themeIsDark ? '#4a89c8' : '#1f4fa8'} />
              )}
              {design.textPanel && (() => {
                const top = padTop + (page === 0 ? textStart : 0)
                const end = Math.min(A4_RATIO - padBottom, textBottom - page * A4_RATIO)
                if (end <= top) return null
                return (
                  <div
                    className={`text-panel ${panelIsDark ? 'text-panel-dark' : ''}`}
                    style={{
                      fontSize: `${fontRatio * 100}cqw`,
                      top: `${top}cqw`,
                      height: `${end - top}cqw`,
                      right: `calc(${bgImage?.pad?.r ?? 8}cqw - 1em)`,
                      left: `calc(${bgImage?.pad?.l ?? 8}cqw - 1em)`,
                    }}
                  />
                )
              })()}
              {design.bgId === 'lines' && (
                <div
                  className="paper-lined"
                  style={{
                    ['--line' as string]: `${theme.accent}55`,
                    fontSize: `${fontRatio * 100}cqw`,
                    top: `${padTop + (page === 0 ? textStart : 0)}cqw`,
                    bottom: `${padBottom}cqw`,
                  }}
                />
              )}
              <p className={`paper-foot ${bgImage && bgImage.pad?.foot === undefined ? `paper-foot-on-${bgImage.tone}` : ''}`} style={{ color: accent, ...footPosition }}>
                <span>
                  מלאכים של תקווה
                  {pageCount > 1 && <> · <bdi dir="ltr">{page + 1}/{pageCount}</bdi></>}
                </span>
              </p>
            </div>
          ))}
          <div
            className="paper-content"
            style={{
              fontSize: `${fontRatio * 100}cqw`,
              paddingTop: `${padTop}cqw`,
              paddingBottom: `${padBottom}cqw`,
              ...(bgImage?.pad?.r !== undefined && { paddingRight: `${bgImage.pad.r}cqw` }),
              ...(bgImage?.pad?.l !== undefined && { paddingLeft: `${bgImage.pad.l}cqw` }),
            }}
          >
            <div
              ref={flowRef}
              className={`paper-flow ${bgImage ? `on-photo-${bgImage.tone}` : ''} ${design.textPanel ? 'has-text-panel' : ''}`}
              onClick={(e) => {
                // The empty part of a page belongs to the letter: clicking it continues the text.
                if (!editable || drawing) return
                const target = e.target as HTMLElement
                if (target !== e.currentTarget && !target.classList.contains('page-break')) return
                const el = editorRef.current!
                el.focus()
                const range = document.createRange()
                range.selectNodeContents(el)
                range.collapse(false)
                const sel = window.getSelection()
                sel?.removeAllRanges()
                sel?.addRange(range)
              }}
            >
              {/* Full-width floats sit across each page's bottom and top margins, so the one text box wraps past them onto the next page. */}
              {Array.from({ length: pageCount }, (_, page) => (
                <Fragment key={page}>
                  <div className="page-break page-break-strut" style={{ height: `${A4_RATIO - padTop - padBottom}cqw` }} />
                  <div className="page-break page-break-gap" style={{ height: `${padTop + padBottom}cqw` }} />
                </Fragment>
              ))}
              <p className="paper-greeting" style={{ color: accent }}>{greeting}</p>
              <div
                ref={editorRef}
                className="paper-text"
                dir={lang === 'he' ? 'rtl' : 'ltr'}
                role={editable ? 'textbox' : undefined}
                aria-multiline={editable ? true : undefined}
                aria-label={editable ? t('תוכן המכתב', 'Letter text') : undefined}
                data-placeholder={t('כתבו כאן את המכתב שלכם...', 'Write your letter here...')}
                style={{ fontWeight: design.weight }}
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
            </div>
          </div>

          <svg className="stroke-layer" viewBox={`0 0 1000 ${pageCount * A4_RATIO * 10}`} style={{ height: `${pageCount * A4_RATIO}cqw` }} aria-hidden="true">
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
                style={{ left: `${item.x * 100}cqw`, top: `${item.y * 100}cqw`, width: `${item.w * 100}cqw`, ...(item.type === 'sticker' && item.rotation ? { transform: `rotate(${item.rotation}deg)` } : undefined) }}
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
                      // Keeps the X reading as an X on a rotated sticker.
                      style={item.type === 'sticker' && item.rotation ? { transform: `rotate(${-item.rotation}deg)` } : undefined}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onItems?.(design.items.filter((x) => x.id !== item.id))}
                    >
                      <CloseIcon size={12} />
                    </button>
                    <span className="item-resize no-export no-print" onPointerDown={(e) => startResize(e, item)} aria-hidden="true" />
                    {item.type === 'sticker' && (
                      <button
                        className="item-rotate no-export no-print"
                        title={t('גררו לסיבוב, לחיצה מסובבת ב-15 מעלות', 'Drag to rotate, tap to turn 15 degrees')}
                        aria-label={t('סיבוב הסטיקר', 'Rotate sticker')}
                        onPointerDown={(e) => startRotate(e, item)}
                        onClick={() => {
                          if (!rotateDragged.current) moveItem(item.id, { rotation: snapRotation((item.rotation ?? 0) + 15) })
                          rotateDragged.current = false
                        }}
                      >
                        ↻
                      </button>
                    )}
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
