import { WORLD_MAP_WIDTH, WORLD_MAP_HEIGHT, WORLD_MAP_DATA } from './world-map'
import type { Animation } from './types'

let rendered = false

export const world: Animation = {
  name: 'World Map',
  presets: { bgColor: '#fbf4ea', activeColor: '#f09719' },
  onStart() {
    rendered = false
  },
  fn(display) {
    if (rendered) return
    display.clear()
    const ox = Math.floor((display.width - WORLD_MAP_WIDTH) / 2)
    const oy = Math.floor((display.height - WORLD_MAP_HEIGHT) / 2)
    for (let y = 0; y < WORLD_MAP_HEIGHT; y++) {
      for (let x = 0; x < WORLD_MAP_WIDTH; x++) {
        if (WORLD_MAP_DATA[y * WORLD_MAP_WIDTH + x]) {
          display.setPixel(ox + x, oy + y, 1)
        }
      }
    }
    rendered = true
  },
}
