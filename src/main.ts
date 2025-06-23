import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'

// 样式导入
import 'virtual:uno.css'

// 开发环境下导入测试工具
if (import.meta.env.DEV) {
  import('@/utils/testCrypto')
}

// 创建应用实例
const app = createApp(App)

// 使用 Pinia
app.use(createPinia())

// 挂载应用
app.mount('#app')

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('@/utils/pwa').then(({ registerSW }) => {
      registerSW()
    })
  })
}
