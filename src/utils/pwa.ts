/**
 * PWA 相关工具函数
 */

/**
 * 注册 Service Worker
 */
export async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('Service Worker 注册成功:', registration.scope)

      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 有新版本可用
              console.log('新版本可用，请刷新页面')
              showUpdateNotification()
            }
          })
        }
      })
    } catch (error) {
      console.error('Service Worker 注册失败:', error)
    }
  }
}

/**
 * 显示更新通知
 */
function showUpdateNotification() {
  if (Notification.permission === 'granted') {
    new Notification('应用更新', {
      body: '新版本已准备就绪，请刷新页面以获取最新功能',
      icon: '/icons/icon-192x192.png',
    })
  }
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * 检查是否已安装为 PWA
 */
export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true
}

/**
 * BeforeInstallPromptEvent 接口
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * 显示安装提示
 */
export function showInstallPrompt() {
  let deferredPrompt: BeforeInstallPromptEvent | null = null

  window.addEventListener('beforeinstallprompt', (e) => {
    // 阻止默认的安装提示
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent

    // 显示自定义安装按钮
    showCustomInstallButton()
  })

  function showCustomInstallButton() {
    const installButton = document.createElement('button')
    installButton.textContent = '安装应用'
    installButton.className =
      'fixed bottom-4 right-4 bg-primary-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'

    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
          console.log('用户接受了安装提示')
        } else {
          console.log('用户拒绝了安装提示')
        }

        deferredPrompt = null
        installButton.remove()
      }
    })

    document.body.appendChild(installButton)

    // 5秒后自动隐藏
    setTimeout(() => {
      if (installButton.parentNode) {
        installButton.remove()
      }
    }, 5000)
  }
}

/**
 * 检查网络状态
 */
export function setupNetworkStatusMonitoring() {
  function updateNetworkStatus() {
    const isOnline = navigator.onLine
    document.body.classList.toggle('offline', !isOnline)

    if (!isOnline) {
      showOfflineNotification()
    }
  }

  window.addEventListener('online', updateNetworkStatus)
  window.addEventListener('offline', updateNetworkStatus)

  // 初始检查
  updateNetworkStatus()
}

/**
 * 显示离线通知
 */
function showOfflineNotification() {
  const notification = document.createElement('div')
  notification.className =
    'fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
  notification.textContent = '网络连接已断开，应用将在离线模式下运行'

  document.body.appendChild(notification)

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, 3000)
}
