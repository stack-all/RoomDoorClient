import { ref, onMounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

/**
 * PWA 安装管理 Composable
 */
export function usePWA() {
  const canInstall = ref(false)
  const isInstalled = ref(false)
  const isStandalone = ref(false)
  const installPrompt = ref<BeforeInstallPromptEvent | null>(null)

  /**
   * 检查是否运行在独立模式（已安装的 PWA）
   */
  const checkStandalone = () => {
    // 检查是否在独立模式下运行
    isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true ||
                        document.referrer.includes('android-app://')
    
    // 如果在独立模式下，认为已安装
    if (isStandalone.value) {
      isInstalled.value = true
      canInstall.value = false
    }
  }

  /**
   * 检查是否支持 PWA 安装
   */
  const checkInstallability = () => {
    // 检查是否支持 service worker
    if (!('serviceWorker' in navigator)) {
      console.log('浏览器不支持 Service Worker')
      return
    }

    // 监听 beforeinstallprompt 事件
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      console.log('PWA 可以安装')
      e.preventDefault()
      installPrompt.value = e as BeforeInstallPromptEvent
      canInstall.value = true
      isInstalled.value = false
    })

    // 监听 appinstalled 事件
    window.addEventListener('appinstalled', () => {
      console.log('PWA 已安装')
      canInstall.value = false
      isInstalled.value = true
      installPrompt.value = null
    })
  }

  /**
   * 触发 PWA 安装
   */
  const install = async (): Promise<boolean> => {
    if (!installPrompt.value) {
      console.log('无法安装 PWA：没有安装提示')
      return false
    }

    try {
      // 显示安装提示
      await installPrompt.value.prompt()
      
      // 等待用户选择
      const result = await installPrompt.value.userChoice
      
      if (result.outcome === 'accepted') {
        console.log('用户接受了 PWA 安装')
        canInstall.value = false
        installPrompt.value = null
        return true
      } else {
        console.log('用户拒绝了 PWA 安装')
        return false
      }
    } catch (err) {
      console.error('PWA 安装失败:', err)
      return false
    }
  }

  /**
   * 获取安装指导信息
   */
  const getInstallGuide = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('chrome') && userAgent.includes('android')) {
      return {
        browser: 'Chrome Android',
        steps: [
          '点击浏览器右上角的菜单按钮（三个点）',
          '选择"添加到主屏幕"或"安装应用"',
          '点击"安装"确认'
        ]
      }
    } else if (userAgent.includes('safari') && userAgent.includes('iphone')) {
      return {
        browser: 'Safari iOS',
        steps: [
          '点击底部的分享按钮（方框内向上箭头）',
          '向下滚动找到"添加到主屏幕"',
          '点击"添加"确认'
        ]
      }
    } else if (userAgent.includes('chrome')) {
      return {
        browser: 'Chrome Desktop',
        steps: [
          '点击地址栏右侧的安装图标',
          '或点击浏览器菜单中的"安装智能门锁"',
          '点击"安装"确认'
        ]
      }
    } else {
      return {
        browser: '当前浏览器',
        steps: [
          '查找浏览器菜单中的"安装"或"添加到主屏幕"选项',
          '按照提示完成安装'
        ]
      }
    }
  }

  /**
   * 检查是否为移动设备
   */
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  onMounted(() => {
    checkStandalone()
    checkInstallability()
  })

  return {
    canInstall,
    isInstalled,
    isStandalone,
    isMobile: isMobile(),
    install,
    getInstallGuide
  }
}
