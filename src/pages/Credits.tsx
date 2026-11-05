import { Fragment } from 'react'
import credits from '../../CREDITS.md?raw'
import { useI18n } from '../i18n'

interface Section {
  heading: string
  rows: string[][]
}

// CREDITS.md is the one list of credits. This page shows its tables.
function parseSections(markdown: string): Section[] {
  const sections: Section[] = []
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) sections.push({ heading: line.slice(3).trim(), rows: [] })
    else if (line.startsWith('|') && !line.startsWith('| ---') && sections.length) {
      sections[sections.length - 1].rows.push(line.slice(1, -1).split(' | ').map((cell) => cell.trim()))
    }
  }
  return sections.map((section) => ({ ...section, rows: section.rows.slice(1) }))
}

const sectionText: Record<string, { he: string; en: string; noteHe: string; noteEn: string }> = {
  'Unit flags and emblems': {
    he: 'דגלים וסמלי יחידות',
    en: 'Unit flags and emblems',
    noteHe: 'מתוך ויקישיתוף. הקבצים שונו: הוקטנו, הרקע הוסר, נוסף קו מתאר לבן, ועל חלק מהדגלים הונח סמל היחידה. הסמלים עצמם עשויים להיות כפופים גם לכללי צה"ל. סמלי המוסד והשב"כ נבנו מקובצי לוגו שסופקו לאתר, והשימוש בהם עשוי להיות כפוף לכללי הארגונים.',
    noteEn: "From Wikimedia Commons. The files were changed: resized, background removed, white outline added, and on some flags the unit's emblem was placed. The insignia may also be subject to IDF rules. The Mossad and Shin Bet emblems were built from logo files supplied for this site, and their use may be subject to those organizations' rules.",
  },
  Stickers: {
    he: 'סטיקרים',
    en: 'Stickers',
    noteHe: 'הקבצים שונו: הוקטנו, הרקע הוסר ונוסף קו מתאר לבן.',
    noteEn: 'The files were changed: resized, background removed and a white outline added.',
  },
  'Letter backgrounds': {
    he: 'רקעים למכתב',
    en: 'Letter backgrounds',
    noteHe: 'צילומים ברישיון CC0. הצילומים עובדו כדי לפנות מקום לטקסט. שאר הרקעים נוצרו בקוד עבור האתר.',
    noteEn: 'CC0 photos, edited to make room for text. The other backgrounds were generated with code for this site.',
  },
  Fonts: {
    he: 'גופנים',
    en: 'Fonts',
    noteHe: 'גופנים ברישיון SIL Open Font License.',
    noteEn: 'Fonts under the SIL Open Font License.',
  },
}

const licenseUrl = (license: string) => {
  const cc = license.match(/^CC (BY(?:-SA)?) (\d\.\d)$/)
  if (cc) return `https://creativecommons.org/licenses/${cc[1].toLowerCase()}/${cc[2]}/`
  if (license === 'CC0') return 'https://creativecommons.org/publicdomain/zero/1.0/'
  if (license === 'OFL') return 'https://openfontlicense.org/'
  if (license === 'MIT') return 'https://opensource.org/license/mit'
  return null
}

function Cell({ value }: { value: string }) {
  const parts = value.split(/(\[[^\]]+\]\(https:\/\/[^)\s]+\))/)
  return (
    <bdi>
      {parts.map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\((https:\/\/[^)\s]+)\)$/)
        return link ? (
          <a key={i} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      })}
    </bdi>
  )
}

export function Credits() {
  const { t } = useI18n()
  const sections = parseSections(credits).filter((section) => section.rows.length > 0)

  return (
    <section className="credits">
      <div className="container">
        <p className="section-label">{t('תודות', 'Thanks')}</p>
        <h1 className="section-title">{t('קרדיטים', 'Credits')}</h1>
        <p className="section-text">
          {t(
            'התמונות, הסמלים והגופנים באתר הגיעו מיוצרים ששיתפו אותם ברישיון פתוח. תודה לכולם. לחיצה על שם קובץ פותחת את המקור, ולחיצה על רישיון פותחת את תנאיו.',
            'The images, emblems and fonts on this site come from creators who shared them under open licenses. Thank you to all of them. Select a file name to open its source, or a license to read its terms.',
          )}
        </p>

        {sections.map((section) => {
          const text = sectionText[section.heading]
          return (
            <div className="credits-group" key={section.heading}>
              <h2 className="credits-heading">{text ? t(text.he, text.en) : section.heading}</h2>
              {text && <p className="credits-note">{t(text.noteHe, text.noteEn)}</p>}
              <div className="credits-table-wrap">
                <table className="credits-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('יצירה', 'Work')}</th>
                      <th scope="col">{t('רישיון', 'License')}</th>
                      <th scope="col">{t('יוצר / מקור', 'Author / source')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map(([work, license, author], i) => {
                      const url = licenseUrl(license)
                      return (
                        <tr key={i}>
                          <td><Cell value={work} /></td>
                          <td className="credits-license">
                            {url ? <a href={url} target="_blank" rel="noreferrer">{license}</a> : license}
                          </td>
                          <td><Cell value={author ?? ''} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
