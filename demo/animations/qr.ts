import type { VoxelDisplay } from 'voxel-display'
import type { Animation } from './types'
import qrGenerator from 'qrcode-generator'

let getQrText = (): string => 'https://mberg.github.io/voxel-display/'

export function setQrSource(fn: () => string) {
  getQrText = fn
}

function renderQr(display: VoxelDisplay, text: string) {
  const code = qrGenerator(0, 'L')
  code.addData(text)
  code.make()

  const size = code.getModuleCount()

  display.clear()

  const ox = Math.floor((display.width - size) / 2)
  const oy = Math.floor((display.height - size) / 2)

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (code.isDark(row, col)) {
        display.setPixel(ox + col, oy + row, 1)
      }
    }
  }
}

export const qr: Animation = {
  name: 'QR Code',
  presets: { bgColor: '#fbf4ea', activeColor: '#333333', fps: 10, angle: 360 },
  onStart() {},
  fn(display) {
    renderQr(display, getQrText())
  },
}
