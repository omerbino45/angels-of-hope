import data from './backgrounds.json'

export interface BackgroundImage {
  id: string
  he: string
  en: string
  tone: 'light' | 'dark'
  /** Extra space, in percent of the page width, that keeps text clear of the image's main subject. */
  pad?: { t?: number; r?: number; b?: number; l?: number }
  src: string
  thumb: string
}

const full = import.meta.glob<string>('../assets/backgrounds/full/*.jpg', { eager: true, query: '?url', import: 'default' })
const thumbs = import.meta.glob<string>('../assets/backgrounds/thumb/*.jpg', { eager: true, query: '?url', import: 'default' })

export const backgroundCategories = data.map((category) => ({
  ...category,
  items: category.items.map(
    (item): BackgroundImage => ({
      ...item,
      tone: item.tone as BackgroundImage['tone'],
      src: full[`../assets/backgrounds/full/${item.id}.jpg`],
      thumb: thumbs[`../assets/backgrounds/thumb/${item.id}.jpg`],
    }),
  ),
}))

const byId = new Map(backgroundCategories.flatMap((category) => category.items).map((item) => [item.id, item]))

export const getBackgroundImage = (id: string) => byId.get(id)
