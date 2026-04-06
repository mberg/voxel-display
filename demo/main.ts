import { VoxelDisplay } from 'voxel-display'

const container = document.getElementById('display')!

// --- Settings ---

const pixelSizeSlider = document.getElementById('pixel-size') as HTMLInputElement
const distanceSlider = document.getElementById('distance') as HTMLInputElement
const depthSlider = document.getElementById('depth') as HTMLInputElement
const fpsSlider = document.getElementById('fps') as HTMLInputElement
const angleSlider = document.getElementById('angle') as HTMLInputElement
const pitchSlider = document.getElementById('pitch') as HTMLInputElement
const activeColorPicker = document.getElementById('active-color') as HTMLInputElement
const showInactiveCheckbox = document.getElementById('show-inactive') as HTMLInputElement
const cameraSelect = document.getElementById('camera-type') as HTMLSelectElement
const pixelSizeVal = document.getElementById('pixel-size-val')!
const distanceVal = document.getElementById('distance-val')!
const depthVal = document.getElementById('depth-val')!
const fpsVal = document.getElementById('fps-val')!
const angleVal = document.getElementById('angle-val')!
const pitchVal = document.getElementById('pitch-val')!

let currentPixelSize = parseInt(pixelSizeSlider.value)
let currentDistance = parseInt(distanceSlider.value)
let currentDepth = parseInt(depthSlider.value)
let currentFps = parseInt(fpsSlider.value)
let currentAngle = parseInt(angleSlider.value)
let currentPitch = parseInt(pitchSlider.value)
let currentShowInactive = showInactiveCheckbox.checked
let currentCameraType = cameraSelect.value as 'oblique' | 'isometric' | 'orthographic'

function createDisplay() {
  const d = new VoxelDisplay({
    container,
    pixelSize: currentPixelSize,
    voxelHeight: currentDistance,
    depth: currentDepth,
    showInactive: currentShowInactive,
    camera: { type: currentCameraType, angle: currentAngle, pitch: currentPitch },
  })
  const palette = d.getPalette()
  palette[1] = activeColorPicker.value
  d.setPalette(palette)
  return d
}

let display = createDisplay()

function restartAnimation() {
  display.stop()
  display = createDisplay()
  display.run((frame, elapsed) => {
    currentAnim(frame, elapsed)
  }, currentFps)
}

pixelSizeSlider.addEventListener('input', () => {
  currentPixelSize = parseInt(pixelSizeSlider.value)
  pixelSizeVal.textContent = pixelSizeSlider.value
  restartAnimation()
})

depthSlider.addEventListener('input', () => {
  currentDepth = parseInt(depthSlider.value)
  depthVal.textContent = depthSlider.value
  restartAnimation()
})

distanceSlider.addEventListener('input', () => {
  currentDistance = parseInt(distanceSlider.value)
  distanceVal.textContent = distanceSlider.value
  restartAnimation()
})

fpsSlider.addEventListener('input', () => {
  currentFps = parseInt(fpsSlider.value)
  fpsVal.textContent = fpsSlider.value
  restartAnimation()
})

angleSlider.addEventListener('input', () => {
  currentAngle = parseInt(angleSlider.value)
  angleVal.textContent = angleSlider.value
  restartAnimation()
})

pitchSlider.addEventListener('input', () => {
  currentPitch = parseInt(pitchSlider.value)
  pitchVal.textContent = pitchSlider.value
  restartAnimation()
})


showInactiveCheckbox.addEventListener('change', () => {
  currentShowInactive = showInactiveCheckbox.checked
  restartAnimation()
})

cameraSelect.addEventListener('change', () => {
  currentCameraType = cameraSelect.value as 'oblique' | 'isometric' | 'orthographic'
  restartAnimation()
})

activeColorPicker.addEventListener('input', () => {
  const palette = display.getPalette()
  palette[1] = activeColorPicker.value
  display.setPalette(palette)
})

// --- Animations ---

function waveAnimation(frame: number, _elapsed: number) {
  display.clear()
  for (let x = 0; x < display.width; x++) {
    const waveY = Math.sin((x + frame) * 0.15) * 0.5 + 0.5
    const h = Math.floor(waveY * display.height)
    for (let y = 0; y < h; y++) {
      display.setPixel(x, y, 1)
    }
  }
}

function sparkleAnimation(frame: number, _elapsed: number) {
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
}

const FONT: Record<string, number[]> = {
  'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'B': [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  'C': [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  'D': [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  'F': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  'G': [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  'H': [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'I': [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  'J': [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  'K': [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  'M': [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  'N': [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'P': [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  'Q': [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  'S': [0b01110, 0b10001, 0b10000, 0b01110, 0b00001, 0b10001, 0b01110],
  'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'V': [0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b01010, 0b00100],
  'W': [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  'X': [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  'Y': [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  'Z': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  '0': [0b01110, 0b10011, 0b10101, 0b10101, 0b10101, 0b11001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  '3': [0b01110, 0b10001, 0b00001, 0b00110, 0b00001, 0b10001, 0b01110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  '6': [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
  '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  '?': [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100],
  '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100],
  ',': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b01000],
  '-': [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
  ' ': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
}

function drawChar(char: string, startX: number, startY: number, color: number) {
  const glyph = FONT[char]
  if (!glyph) return
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if (glyph[row] & (1 << (4 - col))) {
        display.setPixel(startX + col, startY + (6 - row), color)
      }
    }
  }
}

const scrollTextInput = document.getElementById('scroll-text') as HTMLInputElement
const textInputRow = document.getElementById('text-input-row')!

function getScrollText(): string {
  const val = scrollTextInput.value.toUpperCase()
  return val.length > 0 ? val : ' '
}

function textAnimation(frame: number, _elapsed: number) {
  display.clear()
  const text = getScrollText()
  const charWidth = 6
  const totalWidth = text.length * charWidth + display.width
  const offset = frame % totalWidth
  const startY = Math.floor((display.height - 7) / 2)

  for (let i = 0; i < text.length; i++) {
    const x = i * charWidth - offset + display.width
    if (x > -charWidth && x < display.width) {
      const color = (i % 14) + 1
      drawChar(text[i], x, startY, color)
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

const buttons = document.querySelectorAll<HTMLButtonElement>('#animations button')
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    const name = btn.dataset.anim!
    currentAnim = animations[name]
    textInputRow.style.display = name === 'text' ? '' : 'none'
    display.clear()
  })
})

// Start
display.run((frame, elapsed) => {
  currentAnim(frame, elapsed)
}, currentFps)
