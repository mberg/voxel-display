import { VoxelDisplay } from 'voxel-display'
import { wave, matrix, text, setTextSource, world, mic, type Animation } from './animations'

const container = document.getElementById('display')!

// --- Settings ---

const pixelSizeSlider = document.getElementById('pixel-size') as HTMLInputElement
const distanceSlider = document.getElementById('distance') as HTMLInputElement
const depthSlider = document.getElementById('depth') as HTMLInputElement
const fpsSlider = document.getElementById('fps') as HTMLInputElement
const angleSlider = document.getElementById('angle') as HTMLInputElement
const pitchSlider = document.getElementById('pitch') as HTMLInputElement
const opacitySlider = document.getElementById('opacity') as HTMLInputElement
const activeColorPicker = document.getElementById('active-color') as HTMLInputElement
const bgColorPicker = document.getElementById('bg-color') as HTMLInputElement
const cameraSelect = document.getElementById('camera-type') as HTMLSelectElement
const pixelSizeVal = document.getElementById('pixel-size-val')!
const distanceVal = document.getElementById('distance-val')!
const depthVal = document.getElementById('depth-val')!
const fpsVal = document.getElementById('fps-val')!
const angleVal = document.getElementById('angle-val')!
const pitchVal = document.getElementById('pitch-val')!
const opacityVal = document.getElementById('opacity-val')!
const scrollTextInput = document.getElementById('scroll-text') as HTMLInputElement
const textInputRow = document.getElementById('text-input-row')!

let currentPixelSize = parseInt(pixelSizeSlider.value)
let currentDistance = parseInt(distanceSlider.value)
let currentDepth = parseInt(depthSlider.value)
let currentFps = parseInt(fpsSlider.value)
let currentAngle = parseInt(angleSlider.value)
let currentPitch = parseInt(pitchSlider.value)
let currentOpacity = parseInt(opacitySlider.value) / 100
let currentCameraType = cameraSelect.value as 'oblique' | 'isometric' | 'orthographic'

// Wire up text input to scrolling text animation
setTextSource(() => {
  const val = scrollTextInput.value.toUpperCase()
  return val.length > 0 ? val : ' '
})

function createDisplay() {
  const d = new VoxelDisplay({
    container,
    pixelSize: currentPixelSize,
    extrudeHeight: currentDistance,
    depth: currentDepth,
    opacity: currentOpacity,
    camera: { type: currentCameraType, angle: currentAngle, pitch: currentPitch },
  })
  const palette = d.getPalette()
  palette[0] = bgColorPicker.value
  palette[1] = activeColorPicker.value
  d.setPalette(palette)
  return d
}

let display = createDisplay()

function restartDisplay() {
  display.stop()
  display.disconnect()
  display = createDisplay()
  if (remoteActive) {
    connectRemote()
  } else {
    applyPresets(currentAnim)
    if (currentAnim.onStart) currentAnim.onStart(display)
    display.run((frame, elapsed) => {
      currentAnim.fn(display, frame, elapsed)
    }, currentFps)
  }
}

pixelSizeSlider.addEventListener('input', () => {
  currentPixelSize = parseInt(pixelSizeSlider.value)
  pixelSizeVal.textContent = pixelSizeSlider.value
  restartDisplay()
})

depthSlider.addEventListener('input', () => {
  currentDepth = parseInt(depthSlider.value)
  depthVal.textContent = depthSlider.value
  restartDisplay()
})

distanceSlider.addEventListener('input', () => {
  currentDistance = parseInt(distanceSlider.value)
  distanceVal.textContent = distanceSlider.value
  restartDisplay()
})

fpsSlider.addEventListener('input', () => {
  currentFps = parseInt(fpsSlider.value)
  fpsVal.textContent = fpsSlider.value
  restartDisplay()
})

angleSlider.addEventListener('input', () => {
  currentAngle = parseInt(angleSlider.value)
  angleVal.textContent = angleSlider.value
  restartDisplay()
})

pitchSlider.addEventListener('input', () => {
  currentPitch = parseInt(pitchSlider.value)
  pitchVal.textContent = pitchSlider.value
  restartDisplay()
})

opacitySlider.addEventListener('input', () => {
  currentOpacity = parseInt(opacitySlider.value) / 100
  opacityVal.textContent = opacitySlider.value
  display.setOpacity(currentOpacity)
})


const pitchLabel = document.getElementById('pitch-label')!

function updatePitchVisibility() {
  pitchLabel.style.display = currentCameraType === 'orthographic' ? '' : 'none'
}
updatePitchVisibility()

cameraSelect.addEventListener('change', () => {
  currentCameraType = cameraSelect.value as 'oblique' | 'isometric' | 'orthographic'
  updatePitchVisibility()
  restartDisplay()
})

activeColorPicker.addEventListener('input', () => {
  const palette = display.getPalette()
  palette[1] = activeColorPicker.value
  display.setPalette(palette)
})

bgColorPicker.addEventListener('input', () => {
  const palette = display.getPalette()
  palette[0] = bgColorPicker.value
  display.setPalette(palette)
})

// --- Animations ---

const DEFAULT_BG = '#fbf4ea'
const DEFAULT_ACTIVE = '#f09719'

function applyPresets(anim: Animation) {
  const presets = anim.presets
  if (presets?.palette) {
    display.setPalette(presets.palette)
  } else {
    const palette = display.getPalette()
    palette[0] = presets?.bgColor ?? DEFAULT_BG
    palette[1] = presets?.activeColor ?? DEFAULT_ACTIVE
    display.setPalette(palette)
  }
  // Update color pickers to reflect presets
  bgColorPicker.value = presets?.palette?.[0] ?? presets?.bgColor ?? DEFAULT_BG
  activeColorPicker.value = presets?.activeColor ?? DEFAULT_ACTIVE
}

const animations: Record<string, Animation> = {
  wave, matrix, text, world, eq: mic,
}

let currentAnim: Animation = wave

const remoteRow = document.getElementById('remote-row')!
const remoteUrlInput = document.getElementById('remote-url') as HTMLInputElement
let remoteActive = false

function connectRemote() {
  const url = remoteUrlInput.value.trim()
  if (!url) return
  display.stop()
  display.connect(url)
  remoteActive = true
}

function disconnectRemote() {
  if (remoteActive) {
    display.disconnect()
    remoteActive = false
  }
}

const buttons = document.querySelectorAll<HTMLButtonElement>('#animations button')
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    const name = btn.dataset.anim!
    // Reset depth to 1 on mode switch
    currentDepth = 1
    depthSlider.value = '1'
    depthVal.textContent = '1'
    // Stop previous animation's resources
    disconnectRemote()
    if (currentAnim.onStop) currentAnim.onStop()
    textInputRow.style.display = name === 'text' ? '' : 'none'
    remoteRow.style.display = name === 'remote' ? '' : 'none'
    if (name === 'remote') {
      connectRemote()
      return
    }
    currentAnim = animations[name]
    restartDisplay()
  })
})

remoteUrlInput.addEventListener('change', () => {
  if (remoteActive) connectRemote()
})

const remoteConnectBtn = document.getElementById('remote-connect') as HTMLButtonElement
remoteConnectBtn.addEventListener('click', () => {
  connectRemote()
})

// Start
display.run((frame, elapsed) => {
  currentAnim.fn(display, frame, elapsed)
}, currentFps)
