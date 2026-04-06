# Voxel Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript library that renders a 64x32 pixel framebuffer as isometric 3D voxels via Heerich, with a palette-based color system, animation loop, and demo page.

**Architecture:** Thin wrapper around Heerich. A `Uint8Array` framebuffer stores palette indices. On each render, we create a fresh Heerich instance, add boxes for all pixels (height 1 or 2 based on on/off state), and call `toSVG()`. Vite handles dev server and bundling.

**Tech Stack:** TypeScript, Heerich (npm: `heerich`), Vite

**Spec:** `docs/superpowers/specs/2026-04-06-voxel-display-design.md`

---

## File Structure

```
voxel-display/
├── src/
│   ├── index.ts          # re-exports VoxelDisplay, defaultPalette
│   ├── display.ts        # VoxelDisplay class (framebuffer, render, animation loop)
│   └── palette.ts        # default palette array, darkenHex() utility
├── demo/
│   ├── index.html        # demo page shell
│   └── main.ts           # demo animations (wave, sparkle, scrolling text)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/index.ts` (empty placeholder)

- [ ] **Step 1: Initialize package.json**

```bash
cd /Users/claudius/github/voxel-display
```

Create `package.json`:

```json
{
  "name": "voxel-display",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install heerich
npm install -D typescript vite
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'demo',
  resolve: {
    alias: {
      'voxel-display': '/src/index.ts',
    },
  },
})
```

- [ ] **Step 5: Create placeholder src/index.ts**

```ts
export {}
```

- [ ] **Step 6: Verify setup compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git init
echo "node_modules\ndist\n.superpowers" > .gitignore
git add package.json package-lock.json tsconfig.json vite.config.ts src/index.ts .gitignore
git commit -m "chore: scaffold project with TypeScript and Vite"
```

---

### Task 2: Palette Module

**Files:**
- Create: `src/palette.ts`

- [ ] **Step 1: Create palette.ts with default palette and darkenHex**

```ts
export const defaultPalette: string[] = [
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

/**
 * Darken a hex color by a factor (0 = unchanged, 1 = black).
 */
export function darkenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const f = 1 - amount
  const dr = Math.round(r * f)
  const dg = Math.round(g * f)
  const db = Math.round(b * f)
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`
}

/**
 * Build a Heerich face style map from a single hex color.
 * Top = raw color, sides darkened 20%, front darkened 35%.
 */
export function buildFaceStyle(hex: string): Record<string, { fill: string; stroke: string; strokeWidth: number }> {
  return {
    default: { fill: darkenHex(hex, 0.2), stroke: darkenHex(hex, 0.5), strokeWidth: 0.5 },
    top: { fill: hex, stroke: darkenHex(hex, 0.3), strokeWidth: 0.5 },
    front: { fill: darkenHex(hex, 0.35), stroke: darkenHex(hex, 0.55), strokeWidth: 0.5 },
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/palette.ts
git commit -m "feat: add palette module with default colors and face style builder"
```

---

### Task 3: VoxelDisplay Class — Core

**Files:**
- Create: `src/display.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create display.ts with constructor, pixel ops, and render**

```ts
import { Heerich } from 'heerich'
import { defaultPalette, buildFaceStyle } from './palette.js'

export interface VoxelDisplayOptions {
  width?: number
  height?: number
  tile?: number
  palette?: string[]
  camera?: {
    type?: 'oblique' | 'perspective' | 'orthographic' | 'isometric'
    angle?: number
    pitch?: number
    distance?: number
  }
  container?: HTMLElement
}

export class VoxelDisplay {
  readonly width: number
  readonly height: number
  private tile: number
  private palette: string[]
  private camera: VoxelDisplayOptions['camera']
  private container: HTMLElement | null
  private buffer: Uint8Array
  private animationId: number | null = null

  constructor(options: VoxelDisplayOptions = {}) {
    this.width = options.width ?? 64
    this.height = options.height ?? 32
    this.tile = options.tile ?? 8
    this.palette = options.palette ?? [...defaultPalette]
    this.camera = options.camera ?? { type: 'isometric', angle: 45 }
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
      tile: this.tile,
      camera: this.camera,
    })

    // Pre-compute face styles for each palette entry
    const styles = this.palette.map(color => buildFaceStyle(color))

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.buffer[y * this.width + x]
        const isOn = idx > 0
        h.addGeometry({
          type: 'box',
          position: [x, 0, y] as [number, number, number],
          size: [1, isOn ? 2 : 1, 1] as [number, number, number],
          style: styles[idx] ?? styles[0],
        })
      }
    }

    return h.toSVG({ padding: 10 })
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
```

- [ ] **Step 2: Update src/index.ts to re-export**

```ts
export { VoxelDisplay } from './display.js'
export type { VoxelDisplayOptions } from './display.js'
export { defaultPalette, darkenHex, buildFaceStyle } from './palette.js'
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If Heerich has no type declarations, add a `src/heerich.d.ts` shim:

```ts
declare module 'heerich' {
  export class Heerich {
    constructor(options?: Record<string, unknown>)
    addGeometry(opts: Record<string, unknown>): void
    clear(): void
    toSVG(opts?: Record<string, unknown>): string
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/display.ts src/index.ts
git commit -m "feat: add VoxelDisplay class with framebuffer, render, and animation loop"
```

---

### Task 4: Demo Page

**Files:**
- Create: `demo/index.html`
- Create: `demo/main.ts`

- [ ] **Step 1: Create demo/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Voxel Display Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a1a;
      color: #ccc;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      min-height: 100vh;
    }
    h1 { color: #00ff41; margin-bottom: 1rem; }
    #controls {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    #controls button {
      background: #1a1a2e;
      color: #00ff41;
      border: 1px solid #00ff41;
      padding: 0.4rem 1rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 0.9rem;
    }
    #controls button.active {
      background: #00ff41;
      color: #0a0a1a;
    }
    #controls button:hover {
      background: #00ff41;
      color: #0a0a1a;
    }
    #display {
      max-width: 100%;
      overflow: auto;
    }
    #display svg {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <h1>Voxel Display</h1>
  <div id="controls">
    <button data-anim="wave" class="active">Wave</button>
    <button data-anim="sparkle">Sparkle</button>
    <button data-anim="text">Scrolling Text</button>
  </div>
  <div id="display"></div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Create demo/main.ts with wave animation**

```ts
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
```

- [ ] **Step 3: Run dev server and verify it works**

```bash
npx vite demo
```

Open `http://localhost:5173` in a browser. You should see:
- A dark page with "Voxel Display" heading
- Three buttons: Wave, Sparkle, Scrolling Text
- An isometric voxel grid animating with the wave pattern
- Click buttons to switch animations

- [ ] **Step 4: Commit**

```bash
git add demo/index.html demo/main.ts
git commit -m "feat: add demo page with wave, sparkle, and scrolling text animations"
```

---

### Task 5: Verify & Polish

- [ ] **Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Test in browser**

```bash
npx vite demo
```

Open `http://localhost:5173`. Verify:
- All three animations work
- Buttons switch animations correctly
- SVG renders without visual glitches
- Performance is acceptable (no visible lag at 20fps)

- [ ] **Step 3: Fix any issues found in step 2**

Address any rendering, performance, or visual issues. Common things to check:
- If Heerich coordinate mapping is wrong (display mirrored/rotated), adjust the `position` mapping in `render()`
- If colors look flat, adjust darkening factors in `buildFaceStyle()`
- If performance is poor, reduce default fps or tile size

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: polish and verify voxel display"
```
