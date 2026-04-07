import type { Animation } from './types'

let waveFreq = 0.1

export function setWaveFreq(f: number) {
  waveFreq = f
}

export const wave: Animation = {
  name: 'Wave',
  presets: { bgColor: '#fbf4ea', activeColor: '#f09719', fps: 10 },
  onStart() {},
  fn(display, frame) {
    display.clear()
    const bandWidth = 4
    const halfBand = bandWidth / 2
    const t = frame * 0.05
    for (let x = 0; x < display.width; x++) {
      const center = (Math.cos(x * waveFreq + t) * 0.35 + 0.5) * display.height
      const top = Math.max(0, Math.floor(center - halfBand))
      const bottom = Math.min(display.height - 1, Math.floor(center + halfBand))
      for (let y = top; y <= bottom; y++) {
        display.setPixel(x, y, 1)
      }
    }
  },
}
