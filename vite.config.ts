import { defineConfig } from 'vite'
import path from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  root: 'demo',
  plugins: [basicSsl()],
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
