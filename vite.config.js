import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'
  const isStandalone = mode === 'standalone'

  // 素のHTML / CDN 向けの UMD ビルド（React 不要・Plotly は window.Plotly を利用）
  if (isStandalone) {
    return {
      // plotly-neo.css は素のCSSのため tailwind/react プラグインは不要
      // ライブラリ成果物に public/ を含めない
      publicDir: false,
      build: {
        // lib ビルドの成果物（dist/index.js 等）を消さずに追記する
        emptyOutDir: false,
        cssCodeSplit: false,
        lib: {
          entry: resolve(__dirname, 'src/standalone.js'),
          formats: ['umd'],
          name: 'PlotlyNeo',
          fileName: () => 'plotly-neo.umd.js',
        },
        rollupOptions: {
          output: {
            // newPlot 等を window.PlotlyNeo 直下に公開する（named/default 混在の警告回避）
            exports: 'named',
            // CSS などのアセットを plotly-neo.css として出力する
            assetFileNames: 'plotly-neo.[ext]',
          },
        },
      },
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    ...(isLib && {
      // ライブラリ成果物に public/ を含めない
      publicDir: false,
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
