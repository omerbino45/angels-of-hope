import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { useI18n } from '../i18n'
import { gregDateStr, hebrewDateStr, parseGregDate } from '../lib/dates'
import { useStore } from '../store'
import type { Family } from '../types'
import logo from '../assets/logo.jpeg'
import g1 from '../assets/gallery-1.jpeg'
import g2 from '../assets/gallery-2.jpeg'
import g3 from '../assets/gallery-3.jpeg'
import g4 from '../assets/gallery-4.jpeg'
import g5 from '../assets/gallery-5.jpeg'
import g6 from '../assets/gallery-6.jpeg'
import g7 from '../assets/gallery-7.jpeg'
import g8 from '../assets/gallery-8.jpeg'
import g9 from '../assets/gallery-9.jpeg'
import p1 from '../assets/partner-1.jpeg'
import p2 from '../assets/partner-2.jpeg'
import p3 from '../assets/partner-3.png'
import p4 from '../assets/partner-4.jpeg'

const gallery = [
  [g1, 'מתנות'],
  [g2, 'מתנות בתא מטען'],
  [g3, 'ילד בצעצועים'],
  [g4, 'פעילות עם ילדה'],
  [g5, 'טקס קהילתי'],
  [g6, 'מתנות'],
  [g7, 'אזכרה של עופר'],
  [g8, 'יום הולדת'],
  [g9, 'משלוחי מנות פורים'],
]

const partners = [
  [p1, 'אמית רננים', 'תיכון אמי"ת רננים רעננה'],
  [p2, 'מכינת עלמה', 'מכינה קדם צבאית לנשים בירושלים'],
  [p3, 'בית ספר שיבולים', 'בית ספר "שיבולים", חינוך ולדורף, נס ציונה'],
  [p4, 'בית מדרש קהילתי גינות שומרון', 'בית מדרש קהילתי, גינות שומרון'],
]

function FamilyCard({ family }: { family: Family }) {
  const { t } = useI18n()
  const d = parseGregDate(family.date)
  return (
    <div className="fcard">
      <div className="fname">{family.name}</div>
      {family.fallen && <div className="family-fallen">{t('לזכר', 'In memory of')}: {family.fallen}</div>}
      {d && (
        <div className="family-date">
          <span className="heb">נפל ביום {hebrewDateStr(d)}</span>
          <span className="greg">{gregDateStr(d)}</span>
        </div>
      )}
      <div className="fline" />
    </div>
  )
}

export function Home() {
  const { t } = useI18n()
  const { families } = useStore()
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [joinOpen, setJoinOpen] = useState(false)

  const pillars = [
    {
      he: 'יצירת גשר אנושי',
      en: 'Human Bridge',
      heText: 'מחברים בין הקהילה למשפחות הגיבורים, כדי שירגישו שהם לא לבד — לא היום ולא בהמשך הדרך.',
      enText: 'Connecting communities to families of heroes so they know they are supported.',
      icon: (
        <>
          <path d="M13 2C13 2 4 7 4 15c0 5 4 9 9 9s9-4 9-9C22 7 13 2 13 2z" />
          <path d="M9 17l4-4 4 4" />
        </>
      ),
    },
    {
      he: 'כוחו של מכתב',
      en: 'Power of a Letter',
      heText: 'כתיבת מכתבים אישיים מהלב שמוקירים תודה, מחבקים ומחזקים את משפחות הגיבורים.',
      enText: "Personal letters expressing gratitude and strength to the heroes' families.",
      icon: (
        <>
          <rect x="3" y="5" width="20" height="16" rx="2" />
          <path d="M3 9l10 6 10-6" />
        </>
      ),
    },
    {
      he: 'קהילה מחזקת',
      en: 'Strengthening Community',
      heText: 'חיבור גופים ואנשים לסיפורי הגבורה כדי להבטיח שהם לא לבד בנשיאת הכאב.',
      enText: 'Connecting organizations so no one carries the pain alone.',
      icon: (
        <>
          <circle cx="9" cy="9" r="4" />
          <circle cx="19" cy="9" r="4" />
          <path d="M2 22c0-4 3-6 7-6 4 0 7 2 7 6" />
          <path d="M17 16c2 0 7 1 7 6" />
        </>
      ),
    },
  ]

  const letterCards = [
    ['כתיבה מהלב', 'Writing from the Heart', 'כל מכתב נכתב בחריצות ובאהבה, מתוך הרצון להמחיש למשפחות שהם חשובים ומוערכים.', 'Each letter written with care and love.'],
    ['קשירת קשרים', 'Building Bonds', 'המכתבים יוצרים קשר אנושי אמיתי בין הקהילה למשפחות, ממחישים שיש מי שמתעניין.', 'Letters create genuine human bonds.'],
    ['זיכרון נצחי', 'Eternal Memory', 'המכתבים נשמרים כזיכרון נצחי של הקהילה שלא שכחה את הגבורה והאומץ.', 'Letters preserved as eternal memory of heroism.'],
  ]

  return (
    <>
      <section className="hero">
        <svg className="wave-tl" viewBox="0 0 300 240" fill="none" aria-hidden="true">
          <path d="M0,0 Q80,55 35,125 Q0,195 55,240 L0,240 Z" fill="rgba(37,99,168,0.09)" />
          <path d="M0,0 Q45,75 8,155 L0,155 Z" fill="rgba(201,168,76,0.07)" />
        </svg>
        <svg className="wave-br" viewBox="0 0 240 190" fill="none" aria-hidden="true">
          <path d="M240,190 Q165,135 205,75 Q240,18 185,0 L240,0 Z" fill="rgba(37,99,168,0.08)" />
        </svg>
        <div className="hero-grid">
          <div className="hero-main">
            <img className="hero-logo" src={logo} alt={t('מלאכים של תקווה לוגו', 'Angels of Hope logo')} />
            <h1 className="hero-title">{t('מלאכים של תקווה', 'Angels of Hope')}</h1>
            <p className="hero-tagline">
              {t('נותנים יותר ממתנה, נותנים חיבוק של קהילה. מחבקים משפחות שכולות', "Giving more than a gift, giving a community's embrace")}
            </p>
            <Link className="hero-cta" to="/write">
              {t('כתבו מכתב מהלב ✍️', 'Write a Letter from the Heart ✍️')}
            </Link>
          </div>
          <div className="hero-vision">
            <p className="section-label">{t('על הפרויקט', 'About the Project')}</p>
            <h2 className="section-title">{t('החזון והלב', 'The Vision & the Heart')}</h2>
            <p className="section-text">
              {t(
                'פרויקט שנולד מתוך כאב והפך לאור. אנו פועלים מהלב למען הילדים והנשים שאיבדו את יקיריהם, ובונים להם עולם של תקווה ושייכות.',
                'A project born from pain, transformed into light. We act from the heart for children and women who have lost their loved ones, building for them a world of hope and belonging.',
              )}
            </p>
            <p className="section-text hero-vision-2">
              {t(
                'המטרה שלנו פשוטה אך עמוקה: להביא רגעים של שמחה ותחושת שייכות דרך מכתבים אישיים ומתנות מותאמות אישית, שמחבקים את הלב ומבשרים שהם לא לבד.',
                'Our goal is simple yet deep: to bring moments of joy and belonging through personal letters and personalized gifts that embrace the heart and say they are not alone.',
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="letters">
        <div className="container">
          <p className="section-label">{t('מכתבים מהלב', 'Letters from the Heart')}</p>
          <h2 className="section-title">{t('כל מכתב — זיכרון נצחי', 'Every Letter — An Eternal Memory')}</h2>
          <p className="section-text">
            {t(
              'מכתב אחד יכול להאיר יום שלם. בחרו משפחה, עצבו דף אישי וכתבו מהלב. אנחנו נדאג שהמכתב יגיע אליהם.',
              "One letter can light up an entire day. Choose a family, design a personal page and write from the heart. We'll make sure it reaches them.",
            )}
          </p>
          <div className="letters-grid">
            {letterCards.map(([he, en, heText, enText]) => (
              <div className="letter-card" key={en}>
                <h3 className="letter-card-title">{t(he, en)}</h3>
                <p className="letter-card-text">{t(heText, enText)}</p>
              </div>
            ))}
          </div>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/write">
              {t('כתבו מכתב', 'Write a Letter')}
            </Link>
            <button className="btn btn-secondary" onClick={() => setJoinOpen(true)}>
              {t('הצטרפו לקהילה', 'Join the Community')}
            </button>
          </div>
        </div>
      </section>

      <section className="pillars">
        <div className="container">
          <div className="center">
            <p className="section-label">{t('מה אנחנו עושים', 'What We Do')}</p>
            <h2 className="section-title">{t('חיבור קהילות לסיפורי הגבורה', 'Connecting Communities to Stories of Heroism')}</h2>
          </div>
          <div className="pillars-grid">
            {pillars.map((p) => (
              <div className="pillar-card" key={p.en}>
                <div className="pillar-icon">
                  <svg viewBox="0 0 26 26" fill="none" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    {p.icon}
                  </svg>
                </div>
                <h3 className="pillar-title">{t(p.he, p.en)}</h3>
                <p className="pillar-text">{t(p.heText, p.enText)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="families-section">
        <div className="families-header">
          <p className="families-label">{t('המשפחות שמלווים', 'Families We Support')}</p>
          <h2 className="families-title">{t('משפחות שכבר יצרנו קשר 💙', "Families We've Connected With 💙")}</h2>
        </div>
        <div className="marquee-wrap">
          <div className="marquee-track">
            {[...families, ...families].map((f, i) => (
              <FamilyCard key={`${f.id}-${i}`} family={f} />
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container center">
          <p className="section-label">{t('מהמשפחות', 'From the Families')}</p>
          <h2 className="section-title">{t('מה שהמכתבים עושים', 'What the Letters Do')}</h2>
          <div className="testimonial-grid">
            {[1, 2, 3].map((n) => (
              <div className="testimonial-slot" key={n}>
                {t('כאן תופיע תגובה של משפחה', "A family's response will appear here")}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="quote-section">
        <div className="container center">
          <span className="quote-mark" aria-hidden="true">"</span>
          <p className="quote-text">
            {t(
              'עם ישראל לא שוכח את הגיבורים ואת משפחותיהם שנושאות את הכאב והכבוד יחד',
              'The people of Israel do not forget its heroes and the families who carry both the pain and the honor together',
            )}
          </p>
          <p className="quote-sub">{t('בזכותכן אנו ממשיכים לבנות, לחלום ולהאמין', 'Because of you we continue to build, to dream, and to believe')}</p>
        </div>
      </section>

      <section className="gallery">
        <div className="container">
          <p className="section-label">{t('רגעים של אור', 'Moments of Light')}</p>
          <h2 className="section-title">{t('גלריית תמונות', 'Photo Gallery')}</h2>
          <div className="gallery-grid">
            {gallery.map(([src, alt], i) => (
              <button className="gallery-btn" key={i} onClick={() => setLightbox(src)} aria-label={alt}>
                <img className="gallery-img" src={src} alt={alt} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="partners">
        <div className="container center">
          <p className="section-label">{t('קהילה מחזקת', 'A Strengthening Community')}</p>
          <h2 className="section-title">{t('יצירת קשר אנושי', 'Building Human Connection')}</h2>
          <p className="section-text partners-text">
            {t(
              'מאחורי כל מכתב עומדת קהילה שלמה. גופים שונים מצטרפים אלינו במסע הזה: כותבים, לומדים את סיפוריהם של הגיבורים, ותורמים מזמנם למען המשפחות.',
              'Behind every letter stands an entire community. Various organizations join us on this journey: writing, learning the stories of the heroes, and giving their time for the families.',
            )}
          </p>
          <div className="partners-grid">
            {partners.map(([src, alt, caption]) => (
              <div className="partner-item" key={caption}>
                <div className="partner-logo">
                  <img src={src} alt={alt} loading="lazy" />
                </div>
                <p className="partner-caption">{caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label={t('סגירה', 'Close')}>
            ✕
          </button>
          <img src={lightbox} alt="" />
        </div>
      )}

      {joinOpen && (
        <Modal title={t('הצטרפו לקהילה', 'Join the Community')} onClose={() => setJoinOpen(false)}>
          <p className="modal-text">
            {t(
              'בקרוב תוכלו להצטרף לקהילת הכותבים ולשלוח מדי פעם מכתב קטן למשפחות ששמחות לקבל. עד אז, אפשר כבר לכתוב מכתב.',
              'Soon you will be able to join our community of writers and send small letters to families who would like to receive them. Until then, you can already write a letter.',
            )}
          </p>
          <Link className="btn btn-primary" to="/write">
            {t('כתבו מכתב', 'Write a Letter')}
          </Link>
        </Modal>
      )}
    </>
  )
}
