import type { Animation } from './types'

export const sparkle: Animation = {
  name: 'Sparkle',
  fn(display) {
    for (let y = 0; y < display.height; y++) {
      for (let x = 0; x < display.width; x++) {
        const current = display.getPixel(x, y)
        if (current > 0 && Math.random() < 0.15) {
          display.setPixel(x, y, 0)
        }
      }
    }
    const sparksPerFrame = 30
    for (let i = 0; i < sparksPerFrame; i++) {
      const x = Math.floor(Math.random() * display.width)
      const y = Math.floor(Math.random() * display.height)
      const color = Math.floor(Math.random() * 15) + 1
      display.setPixel(x, y, color)
    }
  },
}
