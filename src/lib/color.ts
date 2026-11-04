// Accepts #rgb, #rrggbb (the # is optional), rgb(r, g, b) and "r, g, b". Returns #rrggbb, or null if it isn't a color.
export function parseColor(input: string): string | null {
  const value = input.trim().toLowerCase()
  const hex = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/)
  if (hex) {
    const digits = hex[1]
    return `#${digits.length === 3 ? [...digits].map((c) => c + c).join('') : digits}`
  }
  const rgb = value.match(/^(?:rgb\s*\()?\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*\)?$/)
  if (!rgb) return null
  const channels = rgb.slice(1).map(Number)
  if (channels.some((n) => n > 255)) return null
  return `#${channels.map((n) => n.toString(16).padStart(2, '0')).join('')}`
}
