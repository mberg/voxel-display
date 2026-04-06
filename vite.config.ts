import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: 'demo',
  server: {
    port: 4321,
    host: true,
  },
  resolve: {
    alias: {
      'voxel-display': path.resolve(__dirname, 'src/index.ts'),
    },
  },
})
