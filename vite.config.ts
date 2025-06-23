import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import UnoCSS from 'unocss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 在生产环境中，根据环境变量决定是否使用子路径
  const base = mode === 'production' && process.env.GITHUB_PAGES 
    ? '/RoomDoorClient/' 
    : '/'

  return {
    base,
    plugins: [
      vue(),
      UnoCSS(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}']
        },
        manifestFilename: 'manifest.json',
        manifest: {
          name: '智能门锁控制面板',
          short_name: '门锁控制',
          description: '基于蓝牙的智能门锁PWA控制面板',
          theme_color: '#1976d2',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: base,
          start_url: base,
          icons: [
            {
              src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔐</text></svg>",
              sizes: 'any',
              type: 'image/svg+xml'
            }
          ],
          shortcuts: [
            {
              name: '一键开门',
              short_name: '开门',
              url: `${base}?action=unlock`,
              icons: [
                {
                  src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔓</text></svg>",
                  sizes: 'any',
                  type: 'image/svg+xml'
                }
              ]
            }
          ]
        }
      })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'esnext'
  },
  css: {
    transformer: 'lightningcss'
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/tests/setup.ts']
  }
}})
