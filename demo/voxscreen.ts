import { VoxelDisplay } from 'voxel-display'
import { wave, matrix, text, world, mic, cam, qr } from './animations'
import type { Animation } from './animations'

const params = new URLSearchParams(window.location.search)

const url = params.get('url')
const mode = params.get('mode') ?? (url ? 'remote' : 'wave')
const pixelSize = parseInt(params.get('pixelSize') ?? '18')
const extrudeHeight = parseInt(params.get('extrude') ?? '20')
const depth = parseInt(params.get('depth') ?? '1')
const angle = parseInt(params.get('angle') ?? '0')
const pitch = parseInt(params.get('pitch') ?? '60')
const fps = parseInt(params.get('fps') ?? '10')
const interval = parseInt(params.get('interval') ?? '500')

const container = document.getElementById('display')!

const display = new VoxelDisplay({
  container,
  pixelSize,
  extrudeHeight,
  depth,
  camera: { type: 'orthographic', angle, pitch },
})

// Scale SVG to fill the viewport
const observer = new MutationObserver(() => {
  const svg = container.querySelector('svg')
  if (!svg) return
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.style.width = '100vw'
  svg.style.height = '100vh'
})
observer.observe(container, { childList: true, subtree: true })

const animations: Record<string, Animation> = {
  wave, matrix, text, world, eq: mic, webcam: cam, qrcode: qr,
}

if (mode === 'remote' && url) {
  display.connect(url, { interval })
} else {
  const anim = animations[mode]
  if (anim) {
    if (anim.presets?.palette) display.setPalette(anim.presets.palette)
    if (anim.onStart) anim.onStart(display)
    display.run((frame, elapsed) => {
      anim.fn(display, frame, elapsed)
    }, fps)
  }
}
