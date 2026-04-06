import { VoxelDisplay } from 'voxel-display'

const container = document.getElementById('display')!
const display = new VoxelDisplay({
  container,
  tile: 8,
  camera: { type: 'isometric', angle: 45 },
})

// --- Animations ---

function waveAnimation(frame: number, _elapsed: number) {
  display.clear()
  for (let x = 0; x < display.width; x++) {
    const waveY = Math.sin((x + frame) * 0.15) * 0.5 + 0.5
    const h = Math.floor(waveY * display.height)
    for (let y = h; y < display.height; y++) {
      const colorIdx = ((x + frame) % 14) + 1
      display.setPixel(x, y, colorIdx)
    }
  }
}

function sparkleAnimation(frame: number, _elapsed: number) {
  // Fade: shift all pixels toward 0
  for (let y = 0; y < display.height; y++) {
    for (let x = 0; x < display.width; x++) {
      const current = display.getPixel(x, y)
      if (current > 0 && Math.random() < 0.15) {
        display.setPixel(x, y, 0)
      }
    }
  }
  // Spark: add random lit pixels
  const sparksPerFrame = 30
  for (let i = 0; i < sparksPerFrame; i++) {
    const x = Math.floor(Math.random() * display.width)
    const y = Math.floor(Math.random() * display.height)
    const color = Math.floor(Math.random() * 15) + 1
    display.setPixel(x, y, color)
  }
}

// Simple 5x7 bitmap font for uppercase + digits
const FONT: Record<string, number[]> = {
  'H': [
    0b10001,
    0b10001,
    0b11111,
    0b10001,
    0b10001,
    0b10001,
    0b10001,
  ],
  'E': [
    0b11111,
    0b10000,
    0b11110,
    0b10000,
    0b10000,
    0b10000,
    0b11111,
  ],
  'L': [
    0b10000,
    0b10000,
    0b10000,
    0b10000,
    0b10000,
    0b10000,
    0b11111,
  ],
  'O': [
    0b01110,
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b01110,
  ],
  'V': [
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b01010,
    0b01010,
    0b00100,
  ],
  'X': [
    0b10001,
    0b10001,
    0b01010,
    0b00100,
    0b01010,
    0b10001,
    0b10001,
  ],
  ' ': [
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b00000,
  ],
}

function drawChar(char: string, startX: number, startY: number, color: number) {
  const glyph = FONT[char]
  if (!glyph) return
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if (glyph[row] & (1 << (4 - col))) {
        display.setPixel(startX + col, startY + row, color)
      }
    }
  }
}

const scrollText = 'HELLO VOXEL '

function textAnimation(frame: number, _elapsed: number) {
  display.clear()
  const charWidth = 6 // 5px + 1px gap
  const totalWidth = scrollText.length * charWidth
  const offset = frame % totalWidth
  const startY = Math.floor((display.height - 7) / 2)

  for (let i = 0; i < scrollText.length; i++) {
    const x = i * charWidth - offset + display.width
    if (x > -charWidth && x < display.width) {
      const color = (i % 14) + 1
      drawChar(scrollText[i], x, startY, color)
    }
  }
}

// --- Animation switching ---

type AnimFn = (frame: number, elapsed: number) => void
const animations: Record<string, AnimFn> = {
  wave: waveAnimation,
  sparkle: sparkleAnimation,
  text: textAnimation,
}

let currentAnim: AnimFn = waveAnimation

const buttons = document.querySelectorAll<HTMLButtonElement>('#controls button')
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    const name = btn.dataset.anim!
    currentAnim = animations[name]
    display.clear()
  })
})

display.run((frame, elapsed) => {
  currentAnim(frame, elapsed)
}, 20)
