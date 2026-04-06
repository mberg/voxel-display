import type { VoxelDisplay } from 'voxel-display'

export type AnimFn = (display: VoxelDisplay, frame: number, elapsed: number) => void

export interface Animation {
  name: string
  fn: AnimFn
  onStart?: (display: VoxelDisplay) => void | Promise<void>
  onStop?: () => void
}
