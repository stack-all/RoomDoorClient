import { vi } from 'vitest'

// 设置全局测试环境
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Web Bluetooth API
Object.defineProperty(navigator, 'bluetooth', {
  writable: true,
  value: {
    requestDevice: vi.fn().mockResolvedValue({
      id: 'test-device',
      name: 'Test Device',
      gatt: {
        connected: false,
        connect: vi.fn().mockResolvedValue({
          getPrimaryService: vi.fn().mockResolvedValue({
            getCharacteristic: vi.fn().mockResolvedValue({
              readValue: vi.fn().mockResolvedValue(new DataView(new ArrayBuffer(8))),
              writeValue: vi.fn().mockResolvedValue(undefined),
              startNotifications: vi.fn().mockResolvedValue(undefined),
              stopNotifications: vi.fn().mockResolvedValue(undefined),
              addEventListener: vi.fn(),
              removeEventListener: vi.fn(),
            }),
          }),
        }),
        disconnect: vi.fn(),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  },
})

// Mock Web Crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
    subtle: {
      generateKey: vi.fn().mockResolvedValue({}),
      importKey: vi.fn().mockResolvedValue({}),
      exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      wrapKey: vi.fn().mockResolvedValue(new ArrayBuffer(48)),
      unwrapKey: vi.fn().mockResolvedValue({}),
    },
  },
})

// Mock Web Authentication API
Object.defineProperty(navigator, 'credentials', {
  writable: true,
  value: {
    create: vi.fn().mockResolvedValue({
      id: 'test-credential',
      rawId: new ArrayBuffer(16),
      response: {
        clientDataJSON: new ArrayBuffer(100),
        attestationObject: new ArrayBuffer(200),
      },
    }),
    get: vi.fn().mockResolvedValue({
      id: 'test-credential',
      rawId: new ArrayBuffer(16),
      response: {
        clientDataJSON: new ArrayBuffer(100),
        authenticatorData: new ArrayBuffer(37),
        signature: new ArrayBuffer(64),
        userHandle: new ArrayBuffer(16),
      },
    }),
  },
})

// Mock PublicKeyCredential
Object.defineProperty(global, 'PublicKeyCredential', {
  value: {
    isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
  },
})

// Mock localStorage
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
})

// Mock Notification API
Object.defineProperty(global, 'Notification', {
  value: class MockNotification {
    static permission = 'granted'
    static requestPermission = vi.fn().mockResolvedValue('granted')

    constructor(title: string, options?: NotificationOptions) {
      console.log('Mock notification:', title, options)
    }
  },
})

// Mock console methods in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}
