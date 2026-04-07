import type { Animation } from './types'

// Each wave layer smoothly transitions to new random targets
interface WaveLayer {
  freq: number
  speed: number
  amp: number
  phase: number
  targetFreq: number
  targetSpeed: number
  targetAmp: number
}

let waves: WaveLayer[] = []

function newTarget(): { targetFreq: number; targetSpeed: number; targetAmp: number } {
  return {
    targetFreq: 0.03 + Math.random() * 0.25,
    targetSpeed: 0.3 + Math.random() * 3,
    targetAmp: 0.05 + Math.random() * 0.4,
  }
}

function initWaves() {
  waves = []
  for (let i = 0; i < 5; i++) {
    const t = newTarget()
    waves.push({
      freq: t.targetFreq,
      speed: t.targetSpeed,
      amp: t.targetAmp,
      phase: Math.random() * Math.PI * 2,
      ...t,
    })
  }
}

initWaves()

export const wave: Animation = {
  name: 'Wave',
  presets: { bgColor: '#fbf4ea', activeColor: '#f09719', fps: 10 },
  onStart() {
    initWaves()
  },
  fn(display, frame) {
    // Smoothly interpolate toward targets and periodically pick new ones
    const lerp = 0.02
    for (const w of waves) {
      w.freq += (w.targetFreq - w.freq) * lerp
      w.speed += (w.targetSpeed - w.speed) * lerp
      w.amp += (w.targetAmp - w.amp) * lerp

      // Randomly pick new targets
      if (Math.random() < 0.005) {
        Object.assign(w, newTarget())
      }
    }

    display.clear()
    for (let x = 0; x < display.width; x++) {
      let sum = 0
      for (const w of waves) {
        sum += Math.sin(x * w.freq + frame * w.speed * 0.05 + w.phase) * w.amp
      }
      const waveY = sum / 2 + 0.5
      const h = Math.max(0, Math.min(display.height, Math.floor(waveY * display.height)))
      for (let y = 0; y < h; y++) {
        display.setPixel(x, display.height - 1 - y, 1)
      }
    }
  },
}
