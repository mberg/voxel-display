import { defineConfig } from 'vite'
import path from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  root: 'demo',
  base: '/voxel-display/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [basicSsl()],
  server: {
    port: 4321,
    host: true,
    proxy: {
      '/proxy': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy/, ''),
      },
      '/pixlet': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pixlet/, ''),
      },
    },
  },
  resolve: {
    alias: {
      'voxel-display': path.resolve(__dirname, 'src/index.ts'),
    },
  },
})
