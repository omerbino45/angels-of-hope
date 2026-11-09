import candle from '../assets/stickers/icons/candle.svg'
import { stickerByKey } from '../data/studio'
import type { Fallen, Family, Letter, LetterDesign, LetterItem, LetterStatus } from '../types'
import { supabase } from './supabase'

interface FallenRow {
  id: string
  name: string
  city: string
  date: string
  izkor: string | null
  bio: string | null
  photo_path: string | null
  sort_order: number
}

interface FamilyRow {
  id: string
  name: string
  accepts_letters: boolean
  sort_order: number
  fallen: FallenRow[]
}

interface LetterRow {
  id: string
  family_id: string
  greeting: string
  text: string
  signature: string
  writer: string
  email: string
  phone: string
  is_public: boolean
  status: LetterStatus
  design: StoredDesign
  created_at: string
}

/**
 * How a letter's design is kept in the database. Stickers are stored by their file name rather than the built
 * address, which changes on every deploy, and uploaded photos by their path in the letter-images bucket.
 */
type StoredItem =
  | { type: 'sticker'; id: string; x: number; y: number; w: number; rotation?: number; key: string; he: string; en: string; flag?: boolean; emblem?: boolean }
  | { type: 'image'; id: string; x: number; y: number; w: number; ratio: number; path: string }
  | Extract<LetterItem, { type: 'song' }>

type StoredDesign = Omit<LetterDesign, 'items'> & { items: StoredItem[] }

const photoUrl = (path: string) => supabase.storage.from('photos').getPublicUrl(path).data.publicUrl

export async function loadFamilies(): Promise<Family[]> {
  const { data, error } = await supabase
    .from('families')
    .select('id, name, accepts_letters, sort_order, fallen (id, name, city, date, izkor, bio, photo_path, sort_order)')
    .order('sort_order')
  if (error) throw error
  return (data as FamilyRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    acceptsLetters: row.accepts_letters,
    sortOrder: row.sort_order,
    fallen: [...row.fallen]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({
        id: p.id,
        name: p.name,
        city: p.city,
        date: p.date,
        izkor: p.izkor ?? undefined,
        bio: p.bio ?? undefined,
        photoPath: p.photo_path ?? undefined,
        photo: p.photo_path ? photoUrl(p.photo_path) : undefined,
      })),
  }))
}

/** Writes a family and its fallen as they are now, removing any fallen that were taken off it. */
export async function saveFamily(family: Family) {
  const { error } = await supabase
    .from('families')
    .upsert({ id: family.id, name: family.name, accepts_letters: family.acceptsLetters, sort_order: family.sortOrder ?? 0 })
  if (error) throw error
  const rows = family.fallen.map((p: Fallen, i) => ({
    id: p.id,
    family_id: family.id,
    name: p.name,
    city: p.city,
    date: p.date,
    izkor: p.izkor || null,
    bio: p.bio || null,
    photo_path: p.photoPath ?? null,
    sort_order: i,
  }))
  if (rows.length) {
    const { error: fallenError } = await supabase.from('fallen').upsert(rows)
    if (fallenError) throw fallenError
  }
  const keep = rows.map((r) => r.id)
  let removal = supabase.from('fallen').delete().eq('family_id', family.id)
  if (keep.length) removal = removal.not('id', 'in', `(${keep.join(',')})`)
  const { error: removeError } = await removal
  if (removeError) throw removeError
}

export async function deleteFamily(id: string) {
  const { error } = await supabase.from('families').delete().eq('id', id)
  if (error) throw error
}

export async function uploadFallenPhoto(dataUrl: string) {
  const path = `${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('photos').upload(path, await (await fetch(dataUrl)).blob(), { contentType: 'image/jpeg' })
  if (error) throw error
  return { path, url: photoUrl(path) }
}

/** Uploads the letter's photos, then saves the letter. Nothing is shown as sent unless this succeeds. */
export async function sendLetter(letter: Letter) {
  const items: StoredItem[] = []
  for (const item of letter.design.items) {
    if (item.type === 'image') {
      const path = `${letter.id}/${item.id}.jpg`
      const { error } = await supabase.storage
        .from('letter-images')
        .upload(path, await (await fetch(item.src)).blob(), { contentType: 'image/jpeg' })
      if (error) throw error
      items.push({ type: 'image', id: item.id, x: item.x, y: item.y, w: item.w, ratio: item.ratio, path })
    } else if (item.type === 'sticker') {
      const { sticker } = item
      items.push({ type: 'sticker', id: item.id, x: item.x, y: item.y, w: item.w, rotation: item.rotation, key: sticker.key, he: sticker.he, en: sticker.en, flag: sticker.flag, emblem: sticker.emblem })
    } else {
      items.push(item)
    }
  }
  // No .select() afterwards: visitors may add letters but not read them back.
  const { error } = await supabase.from('letters').insert({
    id: letter.id,
    family_id: letter.familyId,
    greeting: letter.greeting,
    text: letter.text,
    signature: letter.signature,
    writer: letter.writer,
    email: letter.email,
    phone: letter.phone,
    is_public: letter.isPublic,
    design: { ...letter.design, items } satisfies StoredDesign,
  })
  if (error) throw error
}

/** Admin only: the access rules return nothing to anyone else. */
export async function loadLetters(): Promise<Letter[]> {
  const { data, error } = await supabase.from('letters').select('*').order('created_at', { ascending: false })
  if (error) throw error
  const rows = data as LetterRow[]
  const paths = rows.flatMap((r) => r.design.items.flatMap((it) => (it.type === 'image' ? [it.path] : [])))
  const signed = new Map<string, string>()
  if (paths.length) {
    const { data: urls, error: signError } = await supabase.storage.from('letter-images').createSignedUrls(paths, 60 * 60 * 6)
    if (signError) throw signError
    urls.forEach((u) => u.path && u.signedUrl && signed.set(u.path, u.signedUrl))
  }
  return rows.map((r) => ({
    id: r.id,
    familyId: r.family_id,
    greeting: r.greeting,
    text: r.text,
    signature: r.signature,
    writer: r.writer,
    email: r.email,
    phone: r.phone,
    isPublic: r.is_public,
    status: r.status,
    createdAt: new Date(r.created_at).getTime(),
    design: {
      ...r.design,
      items: r.design.items.map((it): LetterItem => {
        if (it.type === 'image') return { type: 'image', id: it.id, x: it.x, y: it.y, w: it.w, ratio: it.ratio, path: it.path, src: signed.get(it.path) ?? '' }
        if (it.type === 'sticker') {
          // A sticker removed from the gallery since the letter was sent shows as a candle instead of a broken image.
          const sticker = stickerByKey.get(it.key) ?? { key: it.key, src: candle, he: it.he, en: it.en }
          return { type: 'sticker', id: it.id, x: it.x, y: it.y, w: it.w, rotation: it.rotation, sticker }
        }
        return it
      }),
    },
  }))
}

export async function updateLetterStatus(ids: string[], status: LetterStatus) {
  const { error } = await supabase.from('letters').update({ status }).in('id', ids)
  if (error) throw error
}

/** Removes the letter's photos first, so a failure leaves the letter in place to try again rather than orphaned files. */
export async function deleteLetter(letter: Letter) {
  const paths = letter.design.items.flatMap((it) => (it.type === 'image' && it.path ? [it.path] : []))
  if (paths.length) {
    const { error } = await supabase.storage.from('letter-images').remove(paths)
    if (error) throw error
  }
  const { error } = await supabase.from('letters').delete().eq('id', letter.id)
  if (error) throw error
}

/** Every letter exactly as stored, for keeping a copy outside Supabase. */
export async function exportLetters() {
  const { data, error } = await supabase.from('letters').select('*').order('created_at')
  if (error) throw error
  return data
}
