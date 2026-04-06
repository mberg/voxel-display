# voxel-display

A 2D framebuffer rendered as 3D voxels using SVG. Built on [heerich](https://github.com/meodai/heerich).

**[Live Demo](https://mberg.github.io/voxel-display/)**

## Install

```bash
npm install voxel-display
```

## Quick Start

```html
<div id="display"></div>
<script type="module">
  import { VoxelDisplay } from 'voxel-display'

  const display = new VoxelDisplay({
    container: document.getElementById('display'),
    width: 32,
    height: 16,
  })

  // Draw a pixel
  display.setPixel(10, 5, 1)

  // Render
  display.renderTo()
</script>
```

## API

### `new VoxelDisplay(options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `width` | `number` | `64` | Grid width in pixels |
| `height` | `number` | `32` | Grid height in pixels |
| `pixelSize` | `number` | `8` | X and Y size of each voxel face (always square) |
| `voxelHeight` | `number` | `20` | Extrusion height per depth unit |
| `depth` | `number` | `1` | How many units active pixels extrude upward |
| `palette` | `string[]` | 16-color default | Array of hex colors, index 0 = inactive |
| `opaque` | `boolean` | `true` | Whether voxels occlude neighbors |
| `showInactive` | `boolean` | `true` | Render inactive (index 0) pixels |
| `camera` | `object` | `{ type: 'orthographic', angle: 0, pitch: 60 }` | Camera settings |
| `container` | `HTMLElement` | `null` | DOM element to render into |

### Camera Options

| Option | Type | Description |
|---|---|---|
| `type` | `'oblique' \| 'orthographic' \| 'isometric' \| 'perspective'` | Projection type |
| `angle` | `number` | Horizontal rotation (degrees) |
| `pitch` | `number` | Vertical tilt, orthographic only (0 = side, 90 = top-down) |
| `distance` | `number` | Oblique recession amount |

### Framebuffer Methods

```ts
display.setPixel(x, y, colorIndex)  // Set a pixel to a palette color
display.getPixel(x, y)              // Get palette index at position
display.clear()                      // Clear all pixels to 0
display.fill(colorIndex)             // Fill all pixels with a color
display.setRow(y, data)              // Set an entire row from an array
display.setRegion(x, y, w, h, data) // Set a rectangular region
```

### Display Properties

```ts
display.width   // Grid width (readonly)
display.height  // Grid height (readonly)
```

### Runtime Methods

```ts
display.setDepth(depth)              // Change extrusion depth
display.setVoxelHeight(height)       // Change extrusion height
display.getVoxelHeight()             // Get current extrusion height
display.setPalette(colors)           // Replace the color palette
display.getPalette()                 // Get current palette
```

### Rendering

```ts
display.render()          // Returns SVG string
display.renderTo(el?)     // Render into element (or constructor container)
display.run(callback, fps) // Start animation loop
display.stop()            // Stop animation loop
```

### Animation Loop

```ts
display.run((frame, elapsed) => {
  display.clear()
  // Draw your frame using setPixel, setRow, etc.
  // renderTo() is called automatically after callback
}, 30) // 30 FPS
```

## Palette

The default palette has 16 colors (index 0 is inactive/background):

| Index | Color | Name |
|---|---|---|
| 0 | `#fbf4ea` | off |
| 1 | `#00ff41` | green |
| 2 | `#ff0040` | red |
| 3 | `#00d4ff` | cyan |
| 4 | `#ffdd00` | yellow |
| 5 | `#ff6600` | orange |
| 6 | `#aa00ff` | purple |
| 7 | `#ff69b4` | pink |
| 8 | `#00ff88` | mint |
| 9 | `#4488ff` | blue |
| 10 | `#ff4444` | light red |
| 11 | `#88ff00` | lime |
| 12 | `#ff8800` | amber |
| 13 | `#00ffcc` | teal |
| 14 | `#ff00ff` | magenta |
| 15 | `#ffffff` | white |

## Development

```bash
npm install
npm run dev     # Start dev server at https://localhost:4321
npm run build   # Build demo for production
```

## License

MIT
