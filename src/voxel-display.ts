import { Heerich } from 'heerich'
import { defaultPalette, buildFaceStyle } from './palette.js'
import { decodeImageUrl } from './remote.js'

/** Camera projection settings for the 3D voxel view. */
export interface CameraOptions {
  /** Projection type. */
  type?: 'oblique' | 'perspective' | 'orthographic' | 'isometric'
  /** Horizontal rotation in degrees. */
  angle?: number
  /** Oblique recession amount. */
  distance?: number
  /** Vertical tilt (0 = side view, 90 = top-down). Orthographic only. */
  pitch?: number
}

/** Options for creating a VoxelDisplay instance. */
export interface VoxelDisplayOptions {
  /** Grid width in pixels. Default: 64 */
  width?: number
  /** Grid height in pixels. Default: 32 */
  height?: number
  /** Size of each voxel face in screen pixels (always square). Default: 18 */
  pixelSize?: number
  /** Height of each extrusion layer in screen pixels. Default: 20 */
  extrudeHeight?: number
  /** Array of hex color strings. Index 0 is the background/inactive color. */
  palette?: string[]
  /** Camera projection settings. */
  camera?: CameraOptions
  /** Number of voxel layers active pixels extrude. Default: 1 */
  depth?: number
  /** Opacity of active voxels (0–1). Default: 1 */
  opacity?: number
  /** Whether voxels occlude neighbors behind them. Default: true */
  opaque?: boolean
  /** Whether to render inactive (index 0) pixels. Default: true */
  showInactive?: boolean
  /** DOM element to render into. */
  container?: HTMLElement
}

/** Options for the {@link VoxelDisplay.connect} method. */
export interface ConnectOptions {
  /** Polling interval in milliseconds. Default: 500 */
  interval?: number
}

/**
 * A 2D pixel framebuffer rendered as 3D voxels in SVG.
 *
 * The display uses a 64×32 grid by default (matching Tidbyt dimensions).
 * Each pixel maps to a colored voxel that can extrude upward based on
 * depth settings. The coordinate system uses screen conventions: y=0 is
 * the top row, y increases downward.
 *
 * @example
 * ```ts
 * const display = new VoxelDisplay({
 *   container: document.getElementById('display'),
 *   width: 64,
 *   height: 32,
 * })
 *
 * display.setPixel(10, 5, 1)
 * display.renderTo()
 * ```
 */
export class VoxelDisplay {
  /** Grid width in pixels. */
  readonly width: number
  /** Grid height in pixels. */
  readonly height: number
  private pixelSize: number
  private extrudeHeight: number
  private depth: number
  private opacity: number
  private opaque: boolean
  private showInactive: boolean
  private palette: string[]
  private camera: CameraOptions
  private container: HTMLElement | null
  private buffer: Uint8Array
  private depthBuffer: Uint8Array
  private animationId: number | null = null
  private cachedStyles: ReturnType<typeof buildFaceStyle>[] | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private remoteAnimationId: number | null = null

  constructor(options: VoxelDisplayOptions = {}) {
    this.width = options.width ?? 64
    this.height = options.height ?? 32
    this.pixelSize = options.pixelSize ?? 18
    this.extrudeHeight = options.extrudeHeight ?? 20
    this.depth = options.depth ?? 1
    this.opacity = options.opacity ?? 1
    this.opaque = options.opaque ?? true
    this.showInactive = options.showInactive ?? true
    this.palette = options.palette ?? [...defaultPalette]
    this.camera = options.camera ?? { type: 'orthographic', angle: 0, pitch: 60 }
    this.container = options.container ?? null
    this.buffer = new Uint8Array(this.width * this.height)
    this.depthBuffer = new Uint8Array(this.width * this.height)
  }

  // ---------------------------------------------------------------------------
  // Framebuffer
  // ---------------------------------------------------------------------------

  /**
   * Set a pixel's color (and optionally its per-pixel extrusion depth).
   * Out-of-bounds coordinates are silently ignored.
   *
   * @param x - Column (0 = left).
   * @param y - Row (0 = top).
   * @param colorIndex - Palette index (0 = inactive/background).
   * @param depth - Per-pixel extrusion depth. Overrides the global depth for this pixel.
   */
  setPixel(x: number, y: number, colorIndex: number, depth?: number): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
    this.buffer[y * this.width + x] = colorIndex
    if (depth !== undefined) {
      this.depthBuffer[y * this.width + x] = depth
    }
  }

  /**
   * Get the palette index at a pixel position.
   * Returns 0 for out-of-bounds coordinates.
   */
  getPixel(x: number, y: number): number {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0
    return this.buffer[y * this.width + x]
  }

  /** Clear the framebuffer and depth buffer (all pixels to index 0). */
  clear(): void {
    this.buffer.fill(0)
    this.depthBuffer.fill(0)
  }

  /** Fill all pixels with a single palette index. */
  fill(colorIndex: number): void {
    this.buffer.fill(colorIndex)
  }

  /** Set an entire row from an array of palette indices. */
  setRow(y: number, data: number[]): void {
    if (y < 0 || y >= this.height) return
    const offset = y * this.width
    for (let x = 0; x < Math.min(data.length, this.width); x++) {
      this.buffer[offset + x] = data[x]
    }
  }

  /** Set a rectangular region from a flat array of palette indices. */
  setRegion(x: number, y: number, w: number, h: number, data: number[]): void {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.setPixel(x + dx, y + dy, data[dy * w + dx])
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Display properties
  // ---------------------------------------------------------------------------

  /** Set the opacity of active voxels (0–1). */
  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity))
    this.cachedStyles = null
  }

  /** Set the global extrusion depth (number of layers). */
  setDepth(depth: number): void {
    this.depth = depth
  }

  /** Get the current extrusion height per layer. */
  getExtrudeHeight(): number {
    return this.extrudeHeight
  }

  /** Set the extrusion height per layer in screen pixels. */
  setExtrudeHeight(height: number): void {
    this.extrudeHeight = height
    this.cachedStyles = null
  }

  /** Replace the color palette. Index 0 is the background/inactive color. */
  setPalette(palette: string[]): void {
    this.palette = [...palette]
    this.cachedStyles = null
  }

  /** Get a copy of the current palette. */
  getPalette(): string[] {
    return [...this.palette]
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  /** Render the current framebuffer to an SVG string. */
  render(): string {
    const h = new Heerich({
      tile: [this.pixelSize, Math.max(1, this.extrudeHeight), this.pixelSize],
      camera: this.camera,
    })

    if (!this.cachedStyles) {
      this.cachedStyles = this.palette.map((color, i) => buildFaceStyle(color, i === 0 ? 1 : this.opacity))
    }
    const styles = this.cachedStyles

    // Anchor voxels at grid corners to keep the viewBox stable across frames.
    const anchorStyle = { fill: 'none', stroke: 'none', strokeWidth: 0 }
    const maxExtrude = 5
    const corners = [[0, 0], [this.width - 1, 0], [0, this.height - 1], [this.width - 1, this.height - 1]]
    for (const [cx, cy] of corners) {
      h.addGeometry({
        type: 'box',
        position: [cx, -maxExtrude, this.height - 1 - cy] as [number, number, number],
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
        const baseHeight = this.pixelSize / Math.max(1, this.extrudeHeight)
        const pixelDepth = this.depthBuffer[y * this.width + x]
        const extrudeUnits = isOn ? (pixelDepth || this.depth) : 0
        const yPos = -extrudeUnits
        const ySize = extrudeUnits + baseHeight
        h.addGeometry({
          type: 'box',
          position: [x, yPos, this.height - 1 - y] as [number, number, number],
          size: [1, ySize, 1] as [number, number, number],
          style: styles[idx] ?? styles[0],
          opaque: this.opaque,
        })
      }
    }

    let svg = h.toSVG({ padding: 10 })
    svg = svg.replace('style="width:100%; height:100%;"', '')
    const vbMatch = svg.match(/viewBox="([^"]*)"/)
    if (vbMatch) {
      const parts = vbMatch[1].split(' ')
      return svg.replace('<svg', `<svg width="${parts[2]}" height="${parts[3]}"`)
    }
    return svg
  }

  /** Render into a DOM element (defaults to the constructor's container). */
  renderTo(el?: HTMLElement): void {
    const target = el ?? this.container
    if (!target) return
    target.innerHTML = this.render()
  }

  // ---------------------------------------------------------------------------
  // Animation
  // ---------------------------------------------------------------------------

  /**
   * Start an animation loop. Calls `callback` at the specified frame rate,
   * then automatically calls `renderTo()` after each frame.
   *
   * @param callback - Called each frame with `(frameNumber, elapsedMs)`.
   * @param fps - Target frames per second. Default: 30.
   */
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

  /** Stop the animation loop. */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  // ---------------------------------------------------------------------------
  // Remote image source
  // ---------------------------------------------------------------------------

  /**
   * Load a single image from a URL and render it to the display.
   * The image is decoded via canvas, scaled to fit the display dimensions,
   * and its colors are extracted into the palette automatically.
   */
  async loadImage(url: string): Promise<void> {
    const { palette, buffer } = await decodeImageUrl(url, this.width, this.height)
    this.setPalette(palette)
    this.buffer = buffer
    this.renderTo()
  }

  /**
   * Connect to a remote image source and poll for new frames.
   * Each poll fetches the URL, decodes the image, and renders it.
   * Stops any running animation loop.
   *
   * @param url - Image URL to poll (PNG, WebP, GIF, etc.).
   * @param options - Polling options.
   */
  connect(url: string, options?: ConnectOptions): void {
    this.disconnect()
    this.stop()
    const interval = options?.interval ?? 500

    const poll = async () => {
      try {
        const { palette, buffer } = await decodeImageUrl(url, this.width, this.height)
        this.setPalette(palette)
        this.buffer = buffer
        this.renderTo()
      } catch {
        // Keep last frame on error
      }
    }

    poll()
    this.pollTimer = setInterval(poll, interval)
  }

  /** Stop polling a remote image source. The last frame remains displayed. */
  disconnect(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    if (this.remoteAnimationId !== null) {
      cancelAnimationFrame(this.remoteAnimationId)
      this.remoteAnimationId = null
    }
  }
}
