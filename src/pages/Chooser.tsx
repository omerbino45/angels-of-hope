import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GENERAL_ID } from '../data/families'
import { useI18n } from '../i18n'
import { gregDateStr, parseGregDate } from '../lib/dates'
import { useStore } from '../store'

const normalize = (s: string) => s.replace(/["'׳״()]/g, '').toLowerCase().trim()

export function Chooser() {
  const { t } = useI18n()
  const { families } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = normalize(query)
    if (!q) return families
    return families.filter((f) => normalize(`${f.fallen} ${f.name} ${f.city}`).includes(q))
  }, [families, query])

  const writeToRandom = () => {
    const open = families.filter((f) => f.acceptsLetters)
    if (open.length === 0) return navigate(`/write/${GENERAL_ID}`)
    navigate(`/write/${open[Math.floor(Math.random() * open.length)].id}`)
  }

  return (
    <section className="chooser">
      <div className="container">
        <div className="center">
          <p className="section-label">{t('כתבו מכתב', 'Write a Letter')}</p>
          <h1 className="section-title">{t('שלחו מכתב מהלב למשפחות השכולות', 'Send a Letter from the Heart')}</h1>
          <p className="section-text chooser-intro">
            {t(
              'מכתב אחד יכול להאיר יום שלם. אפשר לכתוב למשפחה שאנחנו נבחר עבורכם, או לחפש את השם של הגיבור שעליו שמעתם. אחר כך תעצבו דף אישי ותכתבו מהלב.',
              'One letter can light up an entire day. Write to a family we choose for you, or search for the name of the hero you heard about. Then design a personal page and write from the heart.',
            )}
          </p>
          <button className="btn btn-primary btn-large" onClick={writeToRandom}>
            {t('כתבו למשפחה ששמחה לקבל מכתב', 'Write to a family who would love a letter')}
          </button>
        </div>

        <div className="chooser-search">
          <label className="form-label" htmlFor="family-search">
            {t('או חפשו לפי שם הגיבור, המשפחה או היישוב', "Or search by the hero's name, family or town")}
          </label>
          <input
            id="family-search"
            className="form-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('לדוגמה: כהן', 'Search in Hebrew')}
          />
          <p className="chooser-count" aria-live="polite">
            {t(results.length === 1 ? 'משפחה אחת' : `${results.length} משפחות`, results.length === 1 ? '1 family' : `${results.length} families`)}
          </p>
        </div>

        {results.length === 0 ? (
          <div className="chooser-empty">
            <p>{t('לא מצאנו את השם הזה ברשימה.', "We couldn't find that name on the list.")}</p>
            <Link className="btn btn-secondary" to={`/write/${GENERAL_ID}`}>
              {t('כתבו מכתב כללי למשפחות', 'Write a general letter to the families')}
            </Link>
          </div>
        ) : (
          <div className="family-grid">
            {results.map((f) => {
              const d = parseGregDate(f.date)
              return (
                <Link className="family-tile" to={`/write/${f.id}`} key={f.id}>
                  <span className="tile-name">{f.fallen || f.name}</span>
                  <span className="tile-family">{f.name}</span>
                  <span className="tile-meta">
                    {[f.city, d && gregDateStr(d)].filter(Boolean).join(' · ')}
                  </span>
                  <span className="tile-action">{t('כתבו מכתב ←', 'Write a letter →')}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
