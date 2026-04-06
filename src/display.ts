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
  opacity?: number
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
  private opacity: number
  private opaque: boolean
  private showInactive: boolean
  private palette: string[]
  private camera: VoxelDisplayOptions['camera']
  private container: HTMLElement | null
  private buffer: Uint8Array
  private animationId: number | null = null
  private cachedStyles: ReturnType<typeof buildFaceStyle>[] | null = null

  constructor(options: VoxelDisplayOptions = {}) {
    this.width = options.width ?? 64
    this.height = options.height ?? 32
    this.pixelSize = options.pixelSize ?? 8
    this.voxelHeight = options.voxelHeight ?? 20
    this.depth = options.depth ?? 1
    this.opacity = options.opacity ?? 1
    this.opaque = options.opaque ?? true
    this.showInactive = options.showInactive ?? true
    this.palette = options.palette ?? [...defaultPalette]
    this.camera = options.camera ?? { type: 'orthographic', angle: 6, pitch: 60 }
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

  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity))
    this.cachedStyles = null
  }

  setDepth(depth: number): void {
    this.depth = depth
  }

  getVoxelHeight(): number {
    return this.voxelHeight
  }

  setVoxelHeight(height: number): void {
    this.voxelHeight = height
    this.cachedStyles = null
  }

  setPalette(palette: string[]): void {
    this.palette = [...palette]
    this.cachedStyles = null
  }

  getPalette(): string[] {
    return [...this.palette]
  }

  render(): string {
    const h = new Heerich({
      tile: [this.pixelSize, this.voxelHeight, this.pixelSize],
      camera: this.camera,
    })

    if (!this.cachedStyles) {
      this.cachedStyles = this.palette.map((color, i) => buildFaceStyle(color, i === 0 ? 1 : this.opacity))
    }
    const styles = this.cachedStyles

    // Anchor voxels at grid corners to keep the viewBox stable across frames.
    // Uses a transparent style so they're invisible but still define the bounding box.
    const anchorStyle = { fill: 'none', stroke: 'none', strokeWidth: 0 }
    const maxExtrude = 5
    const corners = [[0, 0], [this.width - 1, 0], [0, this.height - 1], [this.width - 1, this.height - 1]]
    for (const [cx, cy] of corners) {
      h.addGeometry({
        type: 'box',
        position: [cx, -maxExtrude, cy] as [number, number, number],
        size: [1, maxExtrude + 1, 1] as [number, number, number],
        style: { default: anchorStyle },
        opaque: false,
      })
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.buffer[y * this.width + x]
        const isOn = idx > 0
        if (!isOn && !this.showInactive) continue
        // All voxels share the same base at Y=0. Active ones extrude upward (negative Y).
        const extrudeUnits = isOn ? this.depth : 0
        const yPos = -extrudeUnits
        const ySize = extrudeUnits + 1
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
