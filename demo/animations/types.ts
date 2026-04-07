import type { VoxelDisplay } from 'voxel-display'

export type AnimFn = (display: VoxelDisplay, frame: number, elapsed: number) => void

export interface AnimationPresets {
  palette?: string[]
  bgColor?: string
  activeColor?: string
  fps?: number
  angle?: number
}

export interface Animation {
  name: string
  fn: AnimFn
  presets?: AnimationPresets
  onStart?: (display: VoxelDisplay) => void | Promise<void>
  onStop?: () => void
}
