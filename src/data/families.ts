import type { Fallen, Family } from '../types'

// Ids stay fixed, so a class link to a family keeps working when the list changes.
/** [name, city, date, link to the person's page on izkor.gov.il] */
const raw: [string, string, [string, string, string, string?][]][] = [
  ['f1', 'משפחת הרשקוביץ', [['נתנאל הרשקוביץ', 'קדמת עדן', '10.10.24', 'https://www.izkor.gov.il/%D7%A0%D7%AA%D7%A0%D7%90%D7%9C%20%D7%94%D7%A8%D7%A9%D7%A7%D7%95%D7%91%D7%99%D7%A5/en_f65ec02fc7b3cfdf6203537e00f839d5']]],
  ['f2', 'משפחת מרנץ', [['צבי מתיתיהו מרנץ', 'גבע אדם', '10.10.24', 'https://www.izkor.gov.il/%D7%A6%D7%91%D7%99%20%D7%9E%D7%AA%D7%99%D7%AA%D7%99%D7%94%D7%95%20%D7%9E%D7%A8%D7%A0%D7%A5/en_fa3ee0156459531ae671c2907a4fbba1']]],
  ['f3', 'משפחת אביטבול', [['אליאב עמרם אביטבול', 'איתן', '26.10.24', 'https://www.izkor.gov.il/%D7%90%D7%9C%D7%99%D7%90%D7%91%20%D7%A2%D7%9E%D7%A8%D7%9D%20%D7%90%D7%91%D7%99%D7%98%D7%91%D7%95%D7%9C/en_d0113f1e3c459b18ced3a7d10e160ef8']]],
  ['f4', 'משפחת בן משה', [['מיכאל בן משה', 'אשקלון', '7.10.23', 'https://www.izkor.gov.il/%D7%9E%D7%99%D7%9B%D7%90%D7%9C%20%D7%91%D7%9F%20%D7%9E%D7%A9%D7%94/en_ce014d450eb35e0bcd4823895c83fd2f']]],
  ['f5', 'משפחת קלמנזון', [['אלחנן קלמנזון', 'עותניאל', '8.10.23', 'https://www.izkor.gov.il/%D7%90%D7%9C%D7%97%D7%A0%D7%9F%20%D7%9E%D7%90%D7%99%D7%A8%20%D7%A7%D7%9C%D7%9E%D7%A0%D7%96%D7%95%D7%9F/en_038713149fcf18c7183b9b1572606ea4']]],
  ['f6', 'משפחת רובינשטיין', [['שגיא יעקב רובינשטיין', 'קיבוץ לביא', '8.12.24', 'https://www.izkor.gov.il/%D7%A9%D7%92%D7%99%D7%90%20%D7%99%D7%A2%D7%A7%D7%91%20%D7%A8%D7%95%D7%91%D7%99%D7%A0%D7%A9%D7%98%D7%99%D7%99%D7%9F/en_d651a562786e9a8eeb17e4ca2f6a4df5']]],
  ['f7', 'משפחת אלמליח', [['גלעד אלמליח', 'ירושלים', '26.10.24', 'https://www.izkor.gov.il/%D7%92%D7%9C%D7%A2%D7%93%20%D7%90%D7%9C%D7%9E%D7%9C%D7%99%D7%97/en_714344606dc8a2ca759b9c9eae3ffabd']]],
  ['f8', 'משפחת בן הרוש', [['דניאל יעקב בן הרוש', 'צופים', '18.12.23', 'https://www.izkor.gov.il/%D7%93%D7%A0%D7%99%D7%90%D7%9C%20%D7%99%D7%A2%D7%A7%D7%91%20%D7%91%D7%9F%20%D7%94%D7%A8%D7%95%D7%A9/en_70331b9e79c41bd38bf6d0bd4c6c6284']]],
  ['f9', 'משפחת פלד', [['יותם פלד', 'ראש העין', '17.8.24', 'https://www.izkor.gov.il/%D7%99%D7%95%D7%AA%D7%9D%20%D7%99%D7%A6%D7%97%D7%A7%20%D7%A4%D7%9C%D7%93/en_06c8ebeb5c706eedf08af5eba2029b5e']]],
  ['f10', 'משפחת שמיר', [['מרדכי (מוטי) שמיר', 'חוות יאיר', '7.10.23', 'https://www.izkor.gov.il/%D7%9E%D7%A8%D7%93%D7%9B%D7%99%20%D7%9E%D7%95%D7%98%D7%99%20%D7%A9%D7%9E%D7%99%D7%A8/en_4f5410b507b93bc27a7a61aaff2cd67a']]],
  ['f11', 'משפחת כהן', [['אוריאל כהן', 'צור הדסה', '19.12.23', 'https://www.izkor.gov.il/%D7%90%D7%95%D7%A8%D7%99%D7%90%D7%9C%20%D7%9B%D7%94%D7%9F/en_00704ab7bfadfeba03c12c8ad45de408']]],
  ['f12', 'משפחת שני', [['גבריאל שני', 'עלי', '30.1.24', 'https://www.izkor.gov.il/%D7%92%D7%91%D7%A8%D7%99%D7%90%D7%9C%20%D7%A9%D7%A0%D7%99/en_b73ba2181790e6686d3084590251deb9']]],
  ['f13', 'משפחת מאיר', [['דוד מאיר', 'תקוע', '7.10.23', 'https://www.izkor.gov.il/%D7%93%D7%95%D7%93%20%D7%97%D7%99%D7%99%D7%9D%20%D7%9E%D7%90%D7%99%D7%A8/en_2d641888ac255414d0ad7c44b02a64b4']]],
  ['f14', 'משפחת הרץ', [['נחמן נתן הרץ', 'אלעזר', '6.5.24', 'https://www.izkor.gov.il/%D7%A0%D7%97%D7%9E%D7%9F%20%D7%A0%D7%AA%D7%9F%20%D7%94%D7%A8%D7%A5/en_efb6137fc074abdb13fdc75bc30f2ebc']]],
  ['f15', 'משפחת סלוטקי', [['ישי סלוטקי', 'יד בנימין', '7.10.23', 'https://www.izkor.gov.il/%D7%99%D7%A9%D7%99%20%D7%A1%D7%9C%D7%95%D7%98%D7%A7%D7%99/en_0628638115d328557b91ba5e90f42475'], ['נועם סלוטקי', 'רחובות', '7.10.23', 'https://www.izkor.gov.il/%D7%A0%D7%95%D7%A2%D7%9D%20%D7%A1%D7%9C%D7%95%D7%98%D7%A7%D7%99/en_e9f6ae2cb4b7ac5693644e8937cdc44b']]],
  ['f17', 'משפחת אליהו', [['ידידה אליהו', 'רמת גלעד', '3.11.23', 'https://www.izkor.gov.il/%D7%99%D7%93%D7%99%D7%93%D7%99%D7%94%20%D7%90%D7%9C%D7%99%D7%94%D7%95/en_ee34efdcee8eb0a6db6b096ba3a15db8']]],
  ['f18', 'משפחת פיזם', [['שי אוריאל פיזם', 'עין הנציב', '15.12.23', 'https://www.izkor.gov.il/%D7%A9%D7%99%20%D7%90%D7%95%D7%A8%D7%99%D7%90%D7%9C%20%D7%A4%D7%99%D7%96%D7%9D/en_06c46f702e04d0593c5307811c6bdfeb']]],
  ['f19', 'משפחת הרשקוביץ', [['יוסף חיים הרשקוביץ', 'גוש עציון', '10.11.23', 'https://www.izkor.gov.il/%D7%99%D7%95%D7%A1%D7%A3%20%D7%97%D7%99%D7%99%D7%9D%20(%D7%99%D7%95%D7%A1%D7%99)%20%D7%94%D7%A8%D7%A9%D7%A7%D7%95%D7%91%D7%99%D7%A5/en_a3a9a56f86d8ed6a2a6dc5a4f1609ac5']]],
  ['f20', 'משפחת פליישמן', [['ינון פליישמן', 'ירושלים', '29.10.23', 'https://www.izkor.gov.il/%D7%99%D7%A0%D7%95%D7%9F%20%D7%A4%D7%9C%D7%99%D7%99%D7%A9%D7%9E%D7%9F/en_1b6501df411f52a43a930f2e22880b2d']]],
  ['f21', 'משפחת מויאל', [['שאול מויאל', 'אלוני שילה', '26.10.24', 'https://www.izkor.gov.il/%D7%A9%D7%90%D7%95%D7%9C%20%D7%9E%D7%95%D7%99%D7%90%D7%9C/en_7a6dc36c69d4f40980c4b0b18d7d11e0']]],
  ['f22', 'משפחת לובר', [['אלישע יהונתן לובר', 'יצהר', '25.10.23', 'https://www.izkor.gov.il/%D7%90%D7%9C%D7%99%D7%A9%D7%A2%20%D7%99%D7%94%D7%95%D7%A0%D7%AA%D7%9F%20%D7%9C%D7%95%D7%91%D7%A8/en_83f73f20264607d93c183c56aae2e6e1']]],
  ['f23', 'משפחת נולר', [['נדב אלחנן נולר', 'ירושלים', '1.7.24', 'https://www.izkor.gov.il/%D7%A0%D7%93%D7%91%20%D7%90%D7%9C%D7%97%D7%A0%D7%9F%20%D7%A0%D7%95%D7%9C%D7%A8/en_95f055e3452c0945d267fb0f3d29919a']]],
  ['f24', 'משפחת וינקלשטיין', [['אלעד יעקב וינקלשטיין', 'עין הנציב', '6.01.25', 'https://www.izkor.gov.il/%D7%90%D7%9C%D7%A2%D7%93%20%D7%99%D7%A2%D7%A7%D7%91%20%D7%95%D7%99%D7%A0%D7%A7%D7%9C%D7%A9%D7%98%D7%99%D7%99%D7%9F/en_31750171b690c0f59b8232d96c0a9042']]],
  ['f25', 'משפחת פרידמן', [['אברהם פרידמן', 'עין הנציב', '4.02.25', 'https://www.izkor.gov.il/%D7%90%D7%91%D7%A8%D7%94%D7%9D%20%D7%A6%D7%91%D7%99%20(%D7%A6%D7%91%D7%99%D7%A7%D7%94)%20%D7%A4%D7%A8%D7%99%D7%93%D7%9E%D7%9F/en_a3ea548ec9f6a2d115b9565fc956f41a']]],
  ['f26', 'משפחת גורדון', [['נפתלי יונה גורדון', 'ירושלים', '7.12.23', 'https://www.izkor.gov.il/%D7%A0%D7%A4%D7%AA%D7%9C%D7%99%20%D7%99%D7%95%D7%A0%D7%94%20%D7%92%D7%95%D7%A8%D7%93%D7%95%D7%9F/en_c5094c5229ada0f8d409c3dbfa9740f5']]],
  ['f27', 'משפחת גניזת', [['רוני גניזת', 'גבעת שמואל', '9.10.24', 'https://www.izkor.gov.il/%D7%A8%D7%95%D7%A0%D7%99%20%D7%92%D7%A0%D7%99%D7%96%D7%AA/en_cd0d87987564499740aeb36f7a73890c']]],
  ['f28', 'משפחת גאלדור', [['עמר משה גאלדור', 'ירושלים', '19.11.24', 'https://www.izkor.gov.il/%D7%A2%D7%9E%D7%A8%20%D7%9E%D7%A9%D7%94%20%D7%92%D7%90%D7%9C%D7%93%D7%95%D7%A8/en_fb43c72e06abb297fdd46ac6245e332c']]],
  ['f29', 'משפחת שבתאי', [['גיא שבתאי', 'ירושלים', '8.11.2024', 'https://www.izkor.gov.il/%D7%92%D7%99%D7%90%20%D7%A9%D7%91%D7%AA%D7%90%D7%99/en_4aca02273cdb803691932223a857c57d']]],
  ['f30', 'משפחת מאיר יונג', [['עפר מאיר יונג', 'תל אביב', '4.2.2025', 'https://www.izkor.gov.il/%D7%A2%D7%A4%D7%A8%20%D7%99%D7%95%D7%A0%D7%92/en_510c021a8af53f2c24e78872ab557307']]],
  ['f31', 'משפחת נדלין', [['יעקב נדלין', 'אור עקיבא', '13.10.2023', 'https://www.izkor.gov.il/%D7%99%D7%A2%D7%A7%D7%91%20%D7%A0%D7%93%D7%9C%D7%99%D7%9F/en_1b33425ced48613dc74eecad95e54056']]],
  ['f32', 'משפחת גבאי', [['אלירז גבאי', 'באר יעקב', '30.12.2023', 'https://www.izkor.gov.il/%D7%90%D7%9C%D7%99%D7%A8%D7%96%20%D7%92%D7%91%D7%90%D7%99/en_94da08281a3b6373e76fd60b71a70997']]],
  ['f33', 'משפחת מושיוף', [['רפאל אליאס מושיוף', 'תל אביב', '22.1.2024', 'https://www.izkor.gov.il/%D7%A8%D7%A4%D7%90%D7%9C%20%D7%90%D7%9C%D7%99%D7%90%D7%A1%20%D7%9E%D7%95%D7%A9%D7%99%D7%95%D7%A3/en_5ba0a15cfa1072e712bfa695926eaa83']]],
  ['f34', 'משפחת זגייה', [['דניאל קאסאו זגייה', 'ירושלים', '22.1.2024', 'https://www.izkor.gov.il/%D7%93%D7%A0%D7%99%D7%90%D7%9C%20%D7%A7%D7%90%D7%A1%D7%90%D7%95%20(%D7%93%D7%A0%D7%99)%20%D7%96%D7%92%D7%99%D7%99%D7%94/en_bfe3b481deac47a207f5cf02fb2ee92b']]],
  ['f35', 'משפחת זירנשיין', [['יבגני זירנשיין', 'זכרון יעקב', '8.12.2024', 'https://www.izkor.gov.il/%D7%99%D7%91%D7%92%D7%A0%D7%99%20%D7%96%D7%99%D7%A0%D7%A8%D7%A9%D7%99%D7%99%D7%9F/en_8fcf1fae60cd0343b5153585d006fc9a']]],
]

/** Shown until the database answers, and if it can't be reached. */
export const initialFamilies: Family[] = raw.map(([id, name, fallen], i) => ({
  id,
  name,
  sortOrder: i + 1,
  fallen: fallen.map(([fallenName, city, date, izkor]) => ({ name: fallenName, city, date, izkor })),
  acceptsLetters: true,
}))

/** The Slotki brothers were once listed as two families; an old f16 class link now opens their one family. */
export const mergedFamilyIds: Record<string, string> = { f16: 'f15' }

export const emptyFallen = (): Fallen => ({ id: crypto.randomUUID(), name: '', city: '', date: '' })

/** Joins several names the way Hebrew does, "א, ב וג". */
function joinNames(names: string[]) {
  return names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} ו${names[names.length - 1]}`
}

/** "ישי ונועם סלוטקי" for brothers who share the family name, otherwise each full name. */
export function fallenLabel(family: Family) {
  const names = family.fallen.map((p) => p.name.trim()).filter(Boolean)
  const last = family.name.replace(/^משפחת\s*/, '').trim()
  if (names.length > 1 && last && names.every((n) => n.endsWith(` ${last}`))) {
    return `${joinNames(names.map((n) => n.slice(0, -last.length - 1)))} ${last}`
  }
  return joinNames(names)
}

/** The name each person went by: a nickname in parentheses, like מוטי in "מרדכי (מוטי) שמיר", or else the first name. */
export function calledNames(family: Family | null) {
  const names = (family?.fallen ?? []).map((p) => p.name.match(/\((.+?)\)/)?.[1] ?? p.name.trim().split(' ')[0]).filter(Boolean)
  return names.length ? joinNames(names) : null
}

export const familySearchText = (family: Family) => `${family.name} ${family.fallen.map((p) => `${p.name} ${p.city}`).join(' ')}`

/** Every distinct value of one field across a family's fallen, so brothers who fell together show one date. */
export const distinct = (family: Family, field: 'city' | 'date') => [...new Set(family.fallen.map((p) => p[field]).filter(Boolean))]

/** Letters used to have a "general" address with no family. Old links to it now open a random family instead. */
export const LEGACY_GENERAL_ID = 'general'

export function pickRandomFamily(families: Family[]) {
  const open = families.filter((f) => f.acceptsLetters)
  return open.length ? open[Math.floor(Math.random() * open.length)] : null
}
