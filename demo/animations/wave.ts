import type { Animation } from './types'

export const wave: Animation = {
  name: 'Wave',
  presets: { bgColor: '#fbf4ea', activeColor: '#f09719' },
  fn(display, frame) {
    display.clear()
    for (let x = 0; x < display.width; x++) {
      const waveY = Math.sin((x + frame) * 0.15) * 0.5 + 0.5
      const h = Math.floor(waveY * display.height)
      for (let y = 0; y < h; y++) {
        display.setPixel(x, y, 1)
      }
    }
  },
}
