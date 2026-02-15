import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'

  return {
    plugins: [react(), tailwindcss()],
    ...(isLib && {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.js'),
          formats: ['es'],
          fileName: 'index',
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime', 'plotly.js', 'react-plotly.js'],
        },
        cssCodeSplit: false,
      },
    }),
  }
})
