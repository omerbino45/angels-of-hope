export function parseGregDate(str: string): Date | null {
  if (!str) return null
  const parts = str.split('.').map((p) => parseInt(p, 10))
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const [day, month, rawYear] = parts
  const year = rawYear < 100 ? rawYear + 2000 : rawYear
  const d = new Date(year, month - 1, day)
  return isNaN(d.getTime()) ? null : d
}

function hebrewNumeral(num: number): string {
  if (num === 15) return 'טו'
  if (num === 16) return 'טז'
  const values: [number, string][] = [
    [400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'],
    [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'],
    [3, 'ג'], [2, 'ב'], [1, 'א'],
  ]
  let letters = ''
  let remaining = num
  for (const [val, letter] of values) {
    while (remaining >= val) {
      letters += letter
      remaining -= val
    }
  }
  return letters
}

function withGershayim(letters: string): string {
  if (letters.length <= 1) return letters + '׳'
  return letters.slice(0, -1) + '״' + letters.slice(-1)
}

export function hebrewDateStr(date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(date)
    const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10)
    const month = parts.find((p) => p.type === 'month')!.value
    const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10)
    return withGershayim(hebrewNumeral(day)) + ' ב' + month + ' ' + withGershayim(hebrewNumeral(year % 1000))
  } catch {
    return ''
  }
}

export function gregDateStr(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}
