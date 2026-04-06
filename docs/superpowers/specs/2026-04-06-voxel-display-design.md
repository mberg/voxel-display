# Voxel Display — Design Spec

A TypeScript library that renders a 64x32 pixel display as isometric 3D voxels using [Heerich](https://github.com/meodai/heerich). "On" pixels are 2 cubes tall, "off" pixels are 1 cube tall. Palette-based coloring with up to 16 colors.

## Core Data Model

- **Framebuffer:** `Uint8Array(width * height)`, default 64x32 = 2,048 entries
- **Pixel value:** palette index (0 = off, 1–15 = on)
- **Voxel mapping:** index 0 → box `[1,1,1]`, index >0 → box `[1,2,1]`
- **Palette:** array of hex color strings. Index 0 is the "off" color (dark base). Indices 1–15 are "on" colors.

### Default Palette

```ts
const defaultPalette = [
  '#1a1a2e', // 0: off
  '#00ff41', // 1: green
  '#ff0040', // 2: red
  '#00d4ff', // 3: cyan
  '#ffdd00', // 4: yellow
  '#ff6600', // 5: orange
  '#aa00ff', // 6: purple
  '#ff69b4', // 7: pink
  '#00ff88', // 8: mint
  '#4488ff', // 9: blue
  '#ff4444', // 10: light red
  '#88ff00', // 11: lime
  '#ff8800', // 12: amber
  '#00ffcc', // 13: teal
  '#ff00ff', // 14: magenta
  '#ffffff', // 15: white
]
```

## API Surface

```ts
interface VoxelDisplayOptions {
  width?: number          // default 64
  height?: number         // default 32
  tile?: number           // Heerich tile size, default 8
  palette?: string[]      // hex colors, index 0 = off
  camera?: CameraOptions  // passed to Heerich
  container?: HTMLElement  // where to inject SVG
}

class VoxelDisplay {
  constructor(options?: VoxelDisplayOptions)

  // Pixel operations
  setPixel(x: number, y: number, colorIndex: number): void
  getPixel(x: number, y: number): number
  clear(): void
  fill(colorIndex: number): void

  // Bulk operations
  setRow(y: number, data: number[]): void
  setRegion(x: number, y: number, w: number, h: number, data: number[]): void

  // Palette
  setPalette(palette: string[]): void
  getPalette(): string[]

  // Rendering
  render(): string
  renderTo(el: HTMLElement): void

  // Animation loop
  run(callback: (frame: number, elapsed: number) => void, fps?: number): void
  stop(): void
}
```

## Rendering Pipeline

On each `render()`:

1. Create a fresh `Heerich` instance with configured `tile` and `camera`.
2. Loop through all pixels in the framebuffer.
3. For each pixel, call `h.addGeometry()` with:
   - `type: 'box'`
   - `position: [x, 0, y]` — grid Y maps to Heerich Z axis
   - `size: [1, 2, 1]` if palette index > 0, else `[1, 1, 1]`
   - `style`: top face = palette color, side faces = darkened variant
4. Return `h.toSVG()`.

### Why fresh Heerich each frame

Heerich has no "clear all." Removing 4K voxels individually would be slower than constructing a new instance. At 2,048 pixels (max ~4,096 boxes), full rebuild should be well under 16ms.

### Animation loop

- `run()` uses `requestAnimationFrame` internally
- Throttles to requested `fps` (default 30)
- Calls user callback with `(frameCount, elapsedMs)`
- Calls `renderTo()` after each callback
- `stop()` cancels via `cancelAnimationFrame`

### Color derivation

For each palette color, derive face styles:
- **Top face:** raw palette color
- **Left/right faces:** palette color darkened ~20%
- **Front face:** palette color darkened ~35%

This gives a natural lighting effect without needing Heerich lighting features.

## Project Structure

```
voxel-display/
├── src/
│   ├── index.ts          # re-exports VoxelDisplay
│   ├── display.ts        # VoxelDisplay class
│   └── palette.ts        # default palette, color darkening utils
├── demo/
│   ├── index.html        # demo page
│   └── main.ts           # demo animations
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Tooling

- **Vite** for dev server and bundling
- **TypeScript** strict mode
- No framework — vanilla TS

## Demo

The demo page renders the display and provides buttons to switch between preset animations:

- **Wave** — sine wave scrolling across the grid, cycling palette colors
- **Random sparkle** — random pixels light up and fade out
- **Scrolling text** — simple bitmap font scrolling left-to-right

## Scope Boundaries

**In scope:**
- Framebuffer pixel API
- Palette-based coloring with face shading
- SVG rendering via Heerich
- Animation loop with fps control
- Demo page with preset animations

**Out of scope (future):**
- Double buffering
- Dirty rectangle tracking
- Scene graph / layers
- Sprite / bitmap font library
- NPM packaging / web component wrapper
- React/Vue/etc. bindings
