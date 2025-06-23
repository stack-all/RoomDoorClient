import { defineConfig, presetAttributify, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true
    })
  ],
  theme: {
    colors: {
      primary: {
        50: '#e3f2f9',
        100: '#c5e4f3',
        200: '#a2d2ec',
        300: '#7cc7e8',
        400: '#47bae2',
        500: '#1976d2',
        600: '#1565c0',
        700: '#1154a0',
        800: '#0d47a1',
        900: '#0a3d62',
      }
    }
  },
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium transition-all duration-200',
    'btn-primary': 'btn bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    'btn-secondary': 'btn bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
    'btn-warning': 'btn bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700',
    'card': 'bg-white rounded-lg shadow-md p-6 border border-gray-200',
    'input': 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
  }
})
