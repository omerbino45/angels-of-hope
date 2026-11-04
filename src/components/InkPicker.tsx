import { useRef, useState } from 'react'
import { inkColors } from '../data/studio'
import { useI18n } from '../i18n'
import { parseColor } from '../lib/color'

interface Props {
  // Undefined means the color follows the theme or background.
  value: string | undefined
  autoColor: string
  onChange: (color: string | undefined) => void
}

export function InkPicker({ value, autoColor, onChange }: Props) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const inPalette = value === undefined || inkColors.some((c) => c.hex === value)
  const [customOpen, setCustomOpen] = useState(!inPalette)
  const [draft, setDraft] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const current = value ?? autoColor
  const typed = draft ?? value ?? ''
  const invalid = draft !== null && draft.trim() !== '' && parseColor(draft) === null

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <>
      <div className="toolbar-group toolbar-group-ink">
        <button
          ref={buttonRef}
          type="button"
          className="ink-button"
          aria-expanded={open}
          aria-controls="ink-panel"
          onClick={() => setOpen(!open)}
        >
          <span className="toolbar-label">{t('צבע טקסט', 'Text color')}</span>
          <span className="ink-dot" style={{ background: current }} />
        </button>
      </div>

      {open && (
        <div
          id="ink-panel"
          className="ink-panel"
          onKeyDown={(e) => {
            if (e.key === 'Escape') close()
          }}
        >
          <div className="ink-swatches" role="group" aria-label={t('צבע טקסט', 'Text color')}>
            <button type="button" className={`ink-chip ${value === undefined ? 'is-active' : ''}`} aria-pressed={value === undefined} onClick={() => onChange(undefined)}>
              <span className="ink-dot ink-dot-small" style={{ background: autoColor }} />
              {t('אוטומטי', 'Auto')}
            </button>
            {inkColors.map((c) => (
              <button
                key={c.hex}
                type="button"
                className={`swatch ${value === c.hex ? 'is-active' : ''}`}
                style={{ background: c.hex }}
                title={t(c.he, c.en)}
                aria-label={t(c.he, c.en)}
                aria-pressed={value === c.hex}
                onClick={() => onChange(c.hex)}
              />
            ))}
            <button type="button" className={`ink-chip ${!inPalette ? 'is-active' : ''}`} aria-expanded={customOpen} onClick={() => setCustomOpen(!customOpen)}>
              <span className="ink-dot ink-dot-small ink-dot-rainbow" />
              {t('צבע אחר', 'Other color')}
            </button>
          </div>

          {customOpen && (
            <div className="ink-custom">
              <label className="ink-field">
                <span className="toolbar-label-visible">{t('בחירה חופשית', 'Pick any color')}</span>
                <input className="toolbar-color" type="color" value={current} onChange={(e) => onChange(e.target.value)} />
              </label>
              <label className="ink-field">
                <span className="toolbar-label-visible">HEX / RGB</span>
                <input
                  className={`ink-text ${invalid ? 'is-invalid' : ''}`}
                  type="text"
                  dir="ltr"
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  placeholder="#0f2d5e"
                  aria-invalid={invalid}
                  aria-describedby="ink-hint"
                  value={typed}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    const parsed = parseColor(e.target.value)
                    if (parsed) onChange(parsed)
                  }}
                  onBlur={() => setDraft(null)}
                />
              </label>
              <span id="ink-hint" className={`ink-hint ${invalid ? 'is-invalid' : ''}`} dir="auto">
                {t('למשל', 'For example')} <bdi>#0f2d5e</bdi> {t('או', 'or')} <bdi>rgb(15, 45, 94)</bdi>
              </span>
            </div>
          )}
        </div>
      )}
    </>
  )
}
