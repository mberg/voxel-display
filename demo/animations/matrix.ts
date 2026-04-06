import type { VoxelDisplay } from 'voxel-display'
import type { Animation } from './types'

const MATRIX_PALETTE = [
  '#0a0a0a', // 0: off (near black)
  '#00ff41', // 1: bright matrix green
  '#00cc33', // 2: medium green
  '#009922', // 3: dark green
  '#006611', // 4: deeper green
  '#003308', // 5: faintest green
  '#33ff66', // 6: light green
  '#66ff99', // 7: pale green
  '#00ff88', // 8: mint green
  '#88ffaa', // 9: bright mint
  '#00dd55', // 10: mid green
  '#22bb44', // 11: muted green
  '#44ff77', // 12: soft green
  '#00ffcc', // 13: teal green
  '#aaffcc', // 14: ghost green
  '#ffffff', // 15: white (lead character)
]

interface Drop {
  x: number
  y: number
  speed: number
  length: number
}

let drops: Drop[] = []

function initDrops(width: number, height: number) {
  drops = []
  for (let i = 0; i < width; i++) {
    if (Math.random() < 0.4) {
      drops.push({
        x: i,
        y: -Math.floor(Math.random() * height),
        speed: 0.5 + Math.random() * 1.5,
        length: 3 + Math.floor(Math.random() * 10),
      })
    }
  }
}

export const matrix: Animation = {
  name: 'Matrix',
  presets: { palette: MATRIX_PALETTE },
  onStart(display: VoxelDisplay) {
    display.clear()
    initDrops(display.width, display.height)
  },
  fn(display) {
    display.clear()
    const width = display.width
    const height = display.height

    // Spawn new drops
    for (let x = 0; x < width; x++) {
      if (Math.random() < 0.02) {
        drops.push({
          x,
          y: -Math.floor(Math.random() * 5),
          speed: 0.5 + Math.random() * 1.5,
          length: 3 + Math.floor(Math.random() * 10),
        })
      }
    }

    // Update and draw drops
    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i]
      drop.y += drop.speed

      const headY = Math.floor(drop.y)

      for (let j = 0; j < drop.length; j++) {
        const py = headY - j
        if (py < 0 || py >= height) continue

        if (j === 0) {
          display.setPixel(drop.x, py, 15) // white head
        } else if (j < 3) {
          display.setPixel(drop.x, py, 1)  // bright green
        } else if (j < 6) {
          display.setPixel(drop.x, py, 2)  // medium green
        } else {
          display.setPixel(drop.x, py, 3)  // dark green fade
        }
      }

      if (headY - drop.length > height) {
        drops[i] = drops[drops.length - 1]
        drops.pop()
      }
    }
  },
}
