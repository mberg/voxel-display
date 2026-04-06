export const defaultPalette: string[] = [
  '#fbf4ea', // 0: off
  '#00ff41', // 1: green
  '#ff0040', // 2: red
  '#00d4ff', // 3: cyan
  '#ffdd00', // 4: yellow
  '#ff6600', // 5: orange
  '#aa00ff', // 6: purple
  '#ff69b4', // 7: pink
  '#00ff88', // 8: mint
  '#4488ff', // 9: blue
  '#ff4444', // 10: light red
  '#88ff00', // 11: lime
  '#ff8800', // 12: amber
  '#00ffcc', // 13: teal
  '#ff00ff', // 14: magenta
  '#ffffff', // 15: white
]

/**
 * Darken a hex color by a factor (0 = unchanged, 1 = black).
 */
export function darkenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const f = 1 - amount
  const dr = Math.round(r * f)
  const dg = Math.round(g * f)
  const db = Math.round(b * f)
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`
}

/**
 * Build a Heerich face style map from a single hex color.
 * Top = raw color, sides darkened 20%, front darkened 35%.
 */
export function buildFaceStyle(hex: string, opacity: number = 1): Record<string, { fill: string; stroke: string; strokeWidth: number; fillOpacity?: number }> {
  const o = opacity < 1 ? { fillOpacity: opacity } : {}
  const top = { fill: hex, stroke: darkenHex(hex, 0.4), strokeWidth: 0.5, ...o }
  const side = { fill: darkenHex(hex, 0.2), stroke: darkenHex(hex, 0.4), strokeWidth: 0.5, ...o }
  const front = { fill: darkenHex(hex, 0.35), stroke: darkenHex(hex, 0.5), strokeWidth: 0.5, ...o }
  return { default: top, top, left: side, right: side, front, back: front }
}
