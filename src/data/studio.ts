import type { StickerRef } from '../types'
import stickerData from './stickers.json'

export interface Theme {
  id: string
  he: string
  en: string
  paper: string
  ink: string
  accent: string
}

export const themes: Theme[] = [
  { id: 'hope', he: 'כחול תקווה', en: 'Hope blue', paper: '#fbf8f1', ink: '#0f2d5e', accent: '#2563a8' },
  { id: 'gold', he: 'זהב חם', en: 'Warm gold', paper: '#f7efdc', ink: '#4a3a17', accent: '#c9a84c' },
  { id: 'white', he: 'לבן נקי', en: 'Clean white', paper: '#ffffff', ink: '#0d1f3c', accent: '#4a89c8' },
  { id: 'sage', he: 'ירוק זית', en: 'Sage', paper: '#eef3ea', ink: '#2d4a35', accent: '#6b8f71' },
  { id: 'blush', he: 'ורוד עדין', en: 'Blush', paper: '#fbeff0', ink: '#5b2a3a', accent: '#c97b8e' },
  { id: 'sky', he: 'תכלת', en: 'Sky', paper: '#eef6fd', ink: '#12385f', accent: '#3f8fd8' },
  { id: 'ocean', he: 'ים', en: 'Ocean', paper: '#e6f2f5', ink: '#0c3b4a', accent: '#1f8aa5' },
  { id: 'mint', he: 'מנטה', en: 'Mint', paper: '#e9f7f2', ink: '#134e43', accent: '#2fa58a' },
  { id: 'olive', he: 'זית', en: 'Olive', paper: '#f2f1df', ink: '#3d4217', accent: '#7f8a2e' },
  { id: 'sand', he: 'חול', en: 'Sand', paper: '#f6efe3', ink: '#4a3b28', accent: '#b08d57' },
  { id: 'terracotta', he: 'טרקוטה', en: 'Terracotta', paper: '#fbeee6', ink: '#6a2f1a', accent: '#c8643c' },
  { id: 'rosegold', he: 'רוז גולד', en: 'Rose gold', paper: '#fbf1ec', ink: '#5c3a32', accent: '#b8776a' },
  { id: 'lavender', he: 'לבנדר', en: 'Lavender', paper: '#f3effb', ink: '#3d2b6b', accent: '#8a6fd1' },
  { id: 'dusk', he: 'כחול לילה', en: 'Night blue', paper: '#0f2d5e', ink: '#f5f0e8', accent: '#c9a84c' },
  { id: 'forest', he: 'ירוק יער', en: 'Forest', paper: '#173a2c', ink: '#f0f5ea', accent: '#c9a84c' },
  { id: 'wine', he: 'בורדו', en: 'Wine', paper: '#4a1622', ink: '#fbeee9', accent: '#e0b27a' },
  { id: 'plum', he: 'שזיף', en: 'Plum', paper: '#3a1c3f', ink: '#f6ecf5', accent: '#d9a6d8' },
  { id: 'charcoal', he: 'פחם', en: 'Charcoal', paper: '#2a2d33', ink: '#f2f0ea', accent: '#c9a84c' },
]

/** The free-drawing page: picking it clears the background and opens the pen, mainly for children. */
export const blankTheme: Theme = { id: 'blank', he: 'דף לציור', en: 'Drawing page', paper: '#ffffff', ink: '#0d1f3c', accent: '#4a89c8' }

export const allThemes = [...themes, blankTheme]

export const patterns = [
  { id: 'plain', he: 'חלק', en: 'Plain' },
  { id: 'lines', he: 'שורות', en: 'Lined' },
  { id: 'frame', he: 'מסגרת', en: 'Frame' },
  { id: 'waves', he: 'גלים', en: 'Waves' },
  { id: 'stars', he: 'מגני דוד', en: 'Stars' },
  { id: 'hearts', he: 'לבבות', en: 'Hearts' },
  { id: 'flag', he: 'דגל ישראל', en: 'Israeli flag' },
]

export const fonts = [
  { id: 'heebo', name: 'Heebo', family: "'Heebo', sans-serif", scale: 1, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { id: 'frank', name: 'Frank Ruhl Libre', family: "'Frank Ruhl Libre', serif", scale: 1, weights: [300, 400, 500, 600, 700, 800, 900] },
  { id: 'david', name: 'David Libre', family: "'David Libre', serif", scale: 1.05, weights: [400, 500, 700] },
  { id: 'varela', name: 'Varela Round', family: "'Varela Round', sans-serif", scale: 1, weights: [400] },
  { id: 'amatic', name: 'Amatic SC', family: "'Amatic SC', cursive", scale: 1.4, weights: [400, 700] },
  { id: 'assistant', name: 'Assistant', family: "'Assistant', sans-serif", scale: 1, weights: [200, 300, 400, 500, 600, 700, 800] },
  { id: 'rubik', name: 'Rubik', family: "'Rubik', sans-serif", scale: 1, weights: [300, 400, 500, 600, 700, 800, 900] },
  { id: 'plex', name: 'IBM Plex Sans Hebrew', family: "'IBM Plex Sans Hebrew', sans-serif", scale: 1, weights: [100, 200, 300, 400, 500, 600, 700] },
  { id: 'alef', name: 'Alef', family: "'Alef', sans-serif", scale: 1, weights: [400, 700] },
  { id: 'miriam', name: 'Miriam Libre', family: "'Miriam Libre', sans-serif", scale: 1, weights: [400, 500, 600, 700] },
  { id: 'fredoka', name: 'Fredoka', family: "'Fredoka', sans-serif", scale: 1, weights: [300, 400, 500, 600, 700] },
  { id: 'secular', name: 'Secular One', family: "'Secular One', sans-serif", scale: 1, weights: [400] },
  { id: 'noto-serif', name: 'Noto Serif Hebrew', family: "'Noto Serif Hebrew', serif", scale: 1, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { id: 'bellefair', name: 'Bellefair', family: "'Bellefair', serif", scale: 1.05, weights: [400] },
  { id: 'suez', name: 'Suez One', family: "'Suez One', serif", scale: 1, weights: [400] },
  { id: 'playpen', name: 'Playpen Sans Hebrew', family: "'Playpen Sans Hebrew', cursive", scale: 1, weights: [100, 200, 300, 400, 500, 600, 700, 800] },
  { id: 'karantina', name: 'Karantina', family: "'Karantina', cursive", scale: 1.3, weights: [300, 400, 700] },
]

export const fontWeights: Record<number, { he: string; en: string }> = {
  100: { he: 'דק מאוד', en: 'Thin' },
  200: { he: 'דק', en: 'Extra light' },
  300: { he: 'קל', en: 'Light' },
  400: { he: 'רגיל', en: 'Regular' },
  500: { he: 'בינוני', en: 'Medium' },
  600: { he: 'חצי בולד', en: 'Semi bold' },
  700: { he: 'בולד', en: 'Bold' },
  800: { he: 'כבד', en: 'Extra bold' },
  900: { he: 'שחור', en: 'Black' },
}

/** Fonts come in different weights, so a change of font keeps the closest one it has. */
export function closestWeight(weights: number[], weight: number) {
  return weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best))
}

export const sizes = [
  { value: 0.85, he: 'קטן', en: 'Small' },
  { value: 1, he: 'רגיל', en: 'Medium' },
  { value: 1.2, he: 'גדול', en: 'Large' },
]

const stickerFiles = import.meta.glob<string>(['../assets/stickers/art/*.webp', '../assets/stickers/units/*.webp'], { eager: true, query: '?url', import: 'default' })
const stickerThumbs = import.meta.glob<string>('../assets/stickers/thumb/**/*.webp', { eager: true, query: '?url', import: 'default' })

export const stickerCategories = stickerData.map((category) => ({
  ...category,
  stickers: category.stickers.map(
    ({ file, ...rest }): StickerRef => ({
      ...rest,
      src: stickerFiles[`../assets/stickers/${file}`],
      thumb: stickerThumbs[`../assets/stickers/thumb/${file}`],
    }),
  ),
}))

export const inkColors = [
  { hex: '#111111', he: 'שחור', en: 'Black' },
  { hex: '#0f2d5e', he: 'כחול כהה', en: 'Navy' },
  { hex: '#2563a8', he: 'כחול', en: 'Blue' },
  { hex: '#0f766e', he: 'טורקיז', en: 'Teal' },
  { hex: '#2f7a3f', he: 'ירוק', en: 'Green' },
  { hex: '#a67c1a', he: 'זהב', en: 'Gold' },
  { hex: '#6a4a2a', he: 'חום', en: 'Brown' },
  { hex: '#c0392b', he: 'אדום', en: 'Red' },
  { hex: '#7a1f33', he: 'בורדו', en: 'Burgundy' },
  { hex: '#5b3a9e', he: 'סגול', en: 'Purple' },
  { hex: '#5f6670', he: 'אפור', en: 'Gray' },
  { hex: '#ffffff', he: 'לבן', en: 'White' },
]

export const penColors = ['#0f2d5e', '#2563a8', '#c9a84c', '#c0392b', '#2f7a3f', '#0d0d0d', '#ffffff']
export const penWidths = [3, 6, 12]

export function writingPrompts(fallen: string | null) {
  const name = fallen ?? 'הגיבורים'
  const nameEn = fallen ?? 'the heroes'
  return [
    { he: 'קוראים לי ___, ורציתי שתדעו ש...', en: 'My name is ___, and I wanted you to know that...' },
    { he: `כששמעתי על ${name}, הדבר שהכי נגע בי היה...`, en: `When I heard about ${nameEn}, what touched me most was...` },
    { he: 'אני חושב/ת עליכם בימים האלה, כי...', en: 'I think of you these days, because...' },
    { he: 'אני רוצה להגיד לכם תודה על...', en: 'I want to thank you for...' },
    { he: 'מה שאני לוקח/ת איתי מהסיפור הזה הוא...', en: 'What I take with me from this story is...' },
    { he: 'אתם לא לבד. אנחנו זוכרים.', en: 'You are not alone. We remember.' },
  ]
}
