// src/remote.ts

export interface DecodedFrame {
  palette: string[]
  buffer: Uint8Array
}

/**
 * Fetch an image URL, decode it onto a canvas, and extract pixel colors.
 * Returns a palette of unique colors and a buffer of palette indices.
 */
export async function decodeImageUrl(
  url: string,
  width: number,
  height: number,
): Promise<DecodedFrame> {
  const res = await fetch(url)
  const blob = await res.blob()
  const bitmap = await createImageBitmap(blob, { resizeWidth: width, resizeHeight: height })

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data // RGBA flat array

  // Build palette from unique colors, index 0 = first pixel (background)
  const colorMap = new Map<string, number>()
  const palette: string[] = []
  const buffer = new Uint8Array(width * height)

  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4]
    const g = pixels[i * 4 + 1]
    const b = pixels[i * 4 + 2]
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

    let idx = colorMap.get(hex)
    if (idx === undefined) {
      idx = palette.length
      palette.push(hex)
      colorMap.set(hex, idx)
    }
    buffer[i] = idx
  }

  // Replace near-black background with dark navy so grid lines are visible
  if (palette.length > 0 && palette[0] === '#000000') {
    palette[0] = '#1a1a2e'
  }

  return { palette, buffer }
}
