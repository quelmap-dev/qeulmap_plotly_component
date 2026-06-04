import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'
  const isCdn = mode === 'cdn'

  return {
    plugins: [react(), tailwindcss()],
    ...((isLib || isCdn) && {
      build: {
        ...(isLib && {
          lib: {
            entry: resolve(__dirname, 'src/index.js'),
            formats: ['es'],
            fileName: 'index',
          },
          rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime', 'plotly.js', 'react-plotly.js'],
          },
        }),
        ...(isCdn && {
          lib: {
            entry: resolve(__dirname, 'src/cdn.js'),
            formats: ['iife'],
            name: 'QuelmapPlotly',
            fileName: () => 'quelmap-plotly.cdn.js',
          },
          emptyOutDir: false,
          rollupOptions: {
            external: ['plotly.js'],
            output: {
              globals: {
                'plotly.js': 'Plotly',
              },
            },
          },
        }),
        cssCodeSplit: false,
      },
    }),
  }
})
