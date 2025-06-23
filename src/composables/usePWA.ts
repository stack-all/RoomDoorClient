import { onMounted, ref } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

/**
 * PWA 安装管理 Composable - 极简版本
 * 只负责显示安装条幅和处理安装
 */
export function usePWA() {
  const canInstall = ref(false)
  const installPrompt = ref<BeforeInstallPromptEvent | null>(null)

  /**
   * 监听 PWA 安装提示事件
   */
  const setupInstallPrompt = () => {
    // 监听 beforeinstallprompt 事件
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      installPrompt.value = e as BeforeInstallPromptEvent
      canInstall.value = true
    })

    // 监听安装完成事件
    window.addEventListener('appinstalled', () => {
      canInstall.value = false
      installPrompt.value = null
    })
  }

  /**
   * 触发 PWA 安装
   */
  const install = async (): Promise<boolean> => {
    if (!installPrompt.value) {
      return false
    }

    try {
      await installPrompt.value.prompt()
      const result = await installPrompt.value.userChoice

      if (result.outcome === 'accepted') {
        canInstall.value = false
        installPrompt.value = null
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  onMounted(() => {
    setupInstallPrompt()
  })

  return {
    canInstall,
    install,
  }
}
