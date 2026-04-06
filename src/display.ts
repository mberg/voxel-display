import { Heerich } from 'heerich'
import { defaultPalette, buildFaceStyle } from './palette.js'

export interface VoxelDisplayOptions {
  width?: number
  height?: number
  pixelSize?: number
  voxelHeight?: number
  palette?: string[]
  camera?: {
    type?: 'oblique' | 'perspective' | 'orthographic' | 'isometric'
    angle?: number
    distance?: number
    pitch?: number
  }
  depth?: number
  opaque?: boolean
  showInactive?: boolean
  container?: HTMLElement
}

export class VoxelDisplay {
  readonly width: number
  readonly height: number
  private pixelSize: number
  private voxelHeight: number
  private depth: number
  private opaque: boolean
  private showInactive: boolean
  private palette: string[]
  private camera: VoxelDisplayOptions['camera']
  private container: HTMLElement | null
  private buffer: Uint8Array
  private animationId: number | null = null

  constructor(options: VoxelDisplayOptions = {}) {
    this.width = options.width ?? 64
    this.height = options.height ?? 32
    this.pixelSize = options.pixelSize ?? 8
    this.voxelHeight = options.voxelHeight ?? 10
    this.depth = options.depth ?? 1
    this.opaque = options.opaque ?? true
    this.showInactive = options.showInactive ?? true
    this.palette = options.palette ?? [...defaultPalette]
    this.camera = options.camera ?? { type: 'orthographic', angle: 315, pitch: 45 }
    this.container = options.container ?? null
    this.buffer = new Uint8Array(this.width * this.height)
  }

  setPixel(x: number, y: number, colorIndex: number): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
    this.buffer[y * this.width + x] = colorIndex
  }

  getPixel(x: number, y: number): number {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0
    return this.buffer[y * this.width + x]
  }

  clear(): void {
    this.buffer.fill(0)
  }

  fill(colorIndex: number): void {
    this.buffer.fill(colorIndex)
  }

  setRow(y: number, data: number[]): void {
    if (y < 0 || y >= this.height) return
    const offset = y * this.width
    for (let x = 0; x < Math.min(data.length, this.width); x++) {
      this.buffer[offset + x] = data[x]
    }
  }

  setRegion(x: number, y: number, w: number, h: number, data: number[]): void {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.setPixel(x + dx, y + dy, data[dy * w + dx])
      }
    }
  }

  setPalette(palette: string[]): void {
    this.palette = [...palette]
  }

  getPalette(): string[] {
    return [...this.palette]
  }

  render(): string {
    const h = new Heerich({
      tile: this.pixelSize,
      camera: this.camera,
    })

    // Pre-compute face styles for each palette entry
    const styles = this.palette.map(color => buildFaceStyle(color))

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.buffer[y * this.width + x]
        const isOn = idx > 0
        if (!isOn && !this.showInactive) continue
        // Y axis is vertical (down in SVG). Active pixels stick UP.
        // voxelHeight is the extrusion Z size in pixels, convert to voxel units.
        const extrudeUnits = (this.voxelHeight / this.pixelSize) * this.depth
        const yPos = isOn ? -extrudeUnits : 0
        const ySize = isOn ? extrudeUnits + 1 : 1
        h.addGeometry({
          type: 'box',
          position: [x, yPos, y] as [number, number, number],
          size: [1, ySize, 1] as [number, number, number],
          style: styles[idx] ?? styles[0],
          opaque: this.opaque,
        })
      }
    }

    let svg = h.toSVG({ padding: 10 })
    // Heerich sets style="width:100%; height:100%" which prevents actual sizing
    svg = svg.replace('style="width:100%; height:100%;"', '')
    // Set explicit width/height from viewBox so 1 SVG unit = 1 screen pixel
    const vbMatch = svg.match(/viewBox="([^"]*)"/)
    if (vbMatch) {
      const parts = vbMatch[1].split(' ')
      return svg.replace('<svg', `<svg width="${parts[2]}" height="${parts[3]}"`)
    }
    return svg
  }

  renderTo(el?: HTMLElement): void {
    const target = el ?? this.container
    if (!target) return
    target.innerHTML = this.render()
  }

  run(callback: (frame: number, elapsed: number) => void, fps: number = 30): void {
    this.stop()
    const interval = 1000 / fps
    let frame = 0
    let lastTime = 0
    const startTime = performance.now()

    const loop = (now: number) => {
      this.animationId = requestAnimationFrame(loop)
      const delta = now - lastTime
      if (delta < interval) return
      lastTime = now - (delta % interval)
      callback(frame, now - startTime)
      this.renderTo()
      frame++
    }

    this.animationId = requestAnimationFrame(loop)
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}
