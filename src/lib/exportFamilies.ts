import type { Family } from '../types'

export type FamilyFormat = 'json' | 'csv' | 'xlsx'

const headers = ['מזהה משפחה', 'שם משפחה', 'שם הנופל/ת', 'יישוב', 'תאריך', 'קישור ליזכור', 'סיפור', 'תמונה', 'מקבלת מכתבים']

/** One row per fallen person, so brothers of one family appear on separate rows that share the family name. */
function rows(families: Family[]): string[][] {
  return families.flatMap((f) =>
    f.fallen.map((p) => [f.id, f.name, p.name, p.city, p.date, p.izkor ?? '', p.bio ?? '', p.photo ?? '', f.acceptsLetters ? 'כן' : 'לא']),
  )
}

function save(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

const quote = (v: string) => `"${v.replace(/"/g, '""')}"`

export async function downloadFamilies(families: Family[], format: FamilyFormat) {
  const base = `families-${new Date().toISOString().slice(0, 10)}`
  if (format === 'json') return save(new Blob([JSON.stringify(families, null, 2)], { type: 'application/json' }), `${base}.json`)
  if (format === 'csv') {
    // The BOM makes Excel read the Hebrew as UTF-8.
    const text = [headers, ...rows(families)].map((r) => r.map(quote).join(',')).join('\r\n')
    return save(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }), `${base}.csv`)
  }
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const sheet = [
    headers.map((value) => ({ value, fontWeight: 'bold' as const })),
    ...rows(families).map((r) => r.map((value) => ({ value, type: String }))),
  ]
  const blob = await writeExcelFile(sheet, { rightToLeft: true } as never).toBlob()
  save(blob, `${base}.xlsx`)
}
