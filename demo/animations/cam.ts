import type { Animation } from './types'

let video: HTMLVideoElement | null = null
let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null
let camStream: MediaStream | null = null

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

const GRAYSCALE_PALETTE = [
  '#1a1a2e', // 0: dark bg
  '#333333', // 1
  '#555555', // 2
  '#777777', // 3
  '#999999', // 4
  '#bbbbbb', // 5
  '#dddddd', // 6
  '#ffffff', // 7
]

export const cam: Animation = {
  name: 'Webcam',
  presets: { palette: GRAYSCALE_PALETTE, fps: 15, angle: 0, pitch: 70 },
  async onStart() {
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

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]

        const brightness = (r + g + b) / 765 // 0-1
        if (brightness < 0.05) continue // dark = background

        // Map brightness to grayscale palette index (1-7)
        const shade = Math.min(7, Math.max(1, Math.ceil(brightness * 7)))
        const depth = Math.ceil(brightness * 5)
        display.setPixel(x, y, shade, depth)
      }
    }
  },
}
