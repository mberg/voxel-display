import type { Animation } from './types'

let video: HTMLVideoElement | null = null
let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null
let camStream: MediaStream | null = null
let persistentPalette: string[] = ['#1a1a2e']
let persistentColorMap = new Map<string, number>()
let paletteChanged = false

async function startCam() {
  if (video) return
  video = document.createElement('video')
  video.setAttribute('playsinline', '')
  camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
  video.srcObject = camStream
  await video.play()
}

function stopCam() {
  if (camStream) {
    camStream.getTracks().forEach(t => t.stop())
    camStream = null
  }
  if (video) {
    video.srcObject = null
    video = null
  }
  canvas = null
  ctx = null
}

const CAM_PALETTE = [
  '#1a1a2e', // 0: dark bg
]

export const cam: Animation = {
  name: 'Webcam',
  presets: { palette: CAM_PALETTE, fps: 15 },
  async onStart() {
    persistentPalette = ['#1a1a2e']
    persistentColorMap = new Map()
    await startCam()
  },
  onStop() {
    stopCam()
  },
  fn(display) {
    if (!video || video.readyState < 2) return

    const w = display.width
    const h = display.height

    if (!canvas) {
      canvas = new OffscreenCanvas(w, h)
      ctx = canvas.getContext('2d', { willReadFrequently: true })!
    }

    // Mirror horizontally and draw scaled video frame
    ctx!.save()
    ctx!.scale(-1, 1)
    ctx!.drawImage(video!, -w, 0, w, h)
    ctx!.restore()

    const imageData = ctx!.getImageData(0, 0, w, h)
    const pixels = imageData.data

    display.clear()
    paletteChanged = false

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]

        // Skip pure black pixels (treat as background)
        if (r === 0 && g === 0 && b === 0) continue

        // Quantize to 4-bit (16 levels per channel = max 4096 colors)
        const qr = (r >> 4) << 4
        const qg = (g >> 4) << 4
        const qb = (b >> 4) << 4
        const key = `${qr},${qg},${qb}`

        let idx = persistentColorMap.get(key)
        if (idx === undefined) {
          idx = persistentPalette.length
          if (idx >= 255) {
            idx = 1
          } else {
            const hex = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`
            persistentPalette.push(hex)
            persistentColorMap.set(key, idx)
            paletteChanged = true
          }
        }
        // Use brightness as depth — brighter pixels extrude more
        const brightness = (r + g + b) / 765 // 0-1
        const depth = Math.ceil(brightness * 5)
        display.setPixel(x, y, idx, depth)
      }
    }

    // Only update palette when new colors are discovered
    if (paletteChanged) {
      display.setPalette(persistentPalette)
    }
  },
}
