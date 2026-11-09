import { toPng } from 'html-to-image'

export async function downloadPng(el: HTMLElement, filename: string) {
  await document.fonts.ready
  const paper = el.querySelector<HTMLElement>('.paper') ?? el
  const dataUrl = await toPng(paper, {
    pixelRatio: Math.max(2, 1400 / paper.getBoundingClientRect().width),
    filter: (node) => !(node instanceof HTMLElement && node.classList.contains('no-export')),
  })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('bad image'))
    }
    img.src = url
  })
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

/**
 * Reads an uploaded image as a JPEG of at most maxSide pixels and maxBytes, so storage space stays predictable.
 * Quality drops in small steps first, and only a photo still too big after that is made smaller.
 * Redrawing the photo also drops hidden details like where it was taken.
 */
export async function readImage(file: File, { maxSide = 1200, maxBytes = 200 * 1024 } = {}): Promise<{ src: string; ratio: number }> {
  const img = await loadImage(file)
  let smallest: Blob | null = null
  for (const side of [maxSide, Math.round(maxSide * 0.83), Math.round(maxSide * 0.67)]) {
    const scale = Math.min(1, side / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')!
    // JPEG has no transparency: without a white base, the clear parts of a PNG would turn black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    for (let quality = 0.8; quality >= 0.6 - 1e-9; quality -= 0.05) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (!blob) throw new Error('bad image')
      if (blob.size <= maxBytes) return { src: await blobToDataUrl(blob), ratio: img.width / img.height }
      smallest = blob
    }
  }
  // A photo this hard to compress keeps the smallest version tried rather than being refused.
  return { src: await blobToDataUrl(smallest!), ratio: img.width / img.height }
}

const SPOTIFY = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([A-Za-z0-9]+)/

export function parseSpotifyUrl(input: string): string | null {
  const m = input.trim().match(SPOTIFY)
  return m ? `https://open.spotify.com/${m[1]}/${m[2]}` : null
}

async function toDataUrl(url: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * The code is kept inside the letter, so it still prints if Spotify later can't be reached.
 * Spotify doesn't document this address, so callers need a fallback for when it stops working.
 */
export async function fetchSpotifyCode(url: string): Promise<string | undefined> {
  const [type, id] = new URL(url).pathname.split('/').slice(1)
  try {
    return await toDataUrl(`https://scannables.scdn.co/uri/plain/svg/000000/white/640/spotify:${type}:${id}`, AbortSignal.timeout(6000))
  } catch {
    return undefined
  }
}

/** Title and cover are a bonus: when Spotify can't be reached the block still works with just the QR. */
export async function fetchSpotifyInfo(url: string): Promise<{ title?: string; cover?: string }> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return {}
    const data = (await res.json()) as { title?: string; thumbnail_url?: string }
    let cover: string | undefined
    if (data.thumbnail_url) {
      try {
        cover = await toDataUrl(data.thumbnail_url)
      } catch {
        cover = undefined
      }
    }
    return { title: data.title, cover }
  } catch {
    return {}
  }
}
