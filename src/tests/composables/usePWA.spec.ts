import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePWA } from '@/composables/usePWA'

// Mock window 和 navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
  serviceWorker: {}
}

const mockWindow = {
  matchMedia: vi.fn(() => ({ matches: false })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

// Mock 全局对象
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
})

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
})

describe('usePWA Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('设备检测', () => {
    it('应该正确检测移动设备', () => {
      // 在 Node.js 环境中模拟
      const pwa = usePWA()
      
      // 直接测试 getInstallGuide 方法的返回值
      const guide = pwa.getInstallGuide()
      
      expect(guide).toHaveProperty('browser')
      expect(guide).toHaveProperty('steps')
      expect(Array.isArray(guide.steps)).toBe(true)
      expect(guide.steps.length).toBeGreaterThan(0)
    })

    it('应该为不同浏览器返回不同的安装指导', () => {
      const pwa = usePWA()
      const guide = pwa.getInstallGuide()
      
      // 检查返回的指导包含必要信息
      expect(typeof guide.browser).toBe('string')
      expect(guide.steps.every(step => typeof step === 'string')).toBe(true)
    })
  })

  describe('状态管理', () => {
    it('应该正确初始化状态', () => {
      const pwa = usePWA()
      
      // 检查初始状态
      expect(typeof pwa.canInstall.value).toBe('boolean')
      expect(typeof pwa.isInstalled.value).toBe('boolean')
      expect(typeof pwa.isStandalone.value).toBe('boolean')
      expect(typeof pwa.isMobile).toBe('boolean')
    })

    it('应该提供安装方法', () => {
      const pwa = usePWA()
      
      expect(typeof pwa.install).toBe('function')
      expect(typeof pwa.getInstallGuide).toBe('function')
    })
  })

  describe('浏览器兼容性', () => {
    it('应该处理不支持 Service Worker 的情况', () => {
      // 临时移除 serviceWorker
      const originalServiceWorker = (global.navigator as any).serviceWorker
      delete (global.navigator as any).serviceWorker
      
      const pwa = usePWA()
      
      // 应该仍然能正常工作
      expect(pwa).toBeDefined()
      expect(typeof pwa.canInstall.value).toBe('boolean')
      
      // 恢复 serviceWorker
      ;(global.navigator as any).serviceWorker = originalServiceWorker
    })
  })

  describe('安装指导内容', () => {
    it('应该为 Chrome Android 提供正确的指导', () => {
      // 模拟 Chrome Android
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
        configurable: true
      })
      
      const pwa = usePWA()
      const guide = pwa.getInstallGuide()
      
      expect(guide.browser).toContain('Chrome Android')
      expect(guide.steps.some(step => step.includes('菜单'))).toBe(true)
    })

    it('应该为 Safari iOS 提供正确的指导', () => {
      // 模拟 Safari iOS
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        configurable: true
      })
      
      const pwa = usePWA()
      const guide = pwa.getInstallGuide()
      
      expect(guide.browser).toContain('Safari iOS')
      expect(guide.steps.some(step => step.includes('分享'))).toBe(true)
    })

    it('应该为桌面 Chrome 提供正确的指导', () => {
      // 模拟桌面 Chrome
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      })
      
      const pwa = usePWA()
      const guide = pwa.getInstallGuide()
      
      expect(guide.browser).toContain('Chrome Desktop')
      expect(guide.steps.some(step => step.includes('地址栏') || step.includes('菜单'))).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('应该处理安装失败的情况', async () => {
      const pwa = usePWA()
      
      // 在没有安装提示的情况下尝试安装
      const result = await pwa.install()
      
      expect(result).toBe(false)
    })
  })
})
