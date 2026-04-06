import { defineConfig } from 'vite'

export default defineConfig({
  root: 'demo',
  resolve: {
    alias: {
      'voxel-display': '/src/index.ts',
    },
  },
})
