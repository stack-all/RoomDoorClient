/**
 * 模拟蓝牙锁设备，用于在没有真实硬件时测试应用
 */

export interface MockBluetoothDevice {
  connect(): Promise<boolean>
  disconnect(): void
  unlock(password: string): Promise<{ success: boolean; error?: string }>
  isConnected(): boolean
}

export class MockBluetoothLock implements MockBluetoothDevice {
  private connected = false
  private correctPassword = '123456' // 模拟的正确密码

  async connect(): Promise<boolean> {
    console.log('模拟设备：开始连接...')
    
    // 模拟连接延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    this.connected = true
    console.log('模拟设备：连接成功')
    return true
  }

  disconnect(): void {
    this.connected = false
    console.log('模拟设备：已断开连接')
  }

  async unlock(password: string): Promise<{ success: boolean; error?: string }> {
    if (!this.connected) {
      return { success: false, error: '设备未连接' }
    }

    console.log('模拟设备：开始验证密码...')
    
    // 模拟验证延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    if (password === this.correctPassword) {
      console.log('模拟设备：密码正确，开锁成功')
      return { success: true }
    } else {
      console.log('模拟设备：密码错误')
      return { success: false, error: '密码错误' }
    }
  }

  isConnected(): boolean {
    return this.connected
  }
}

// 创建全局模拟设备实例
export const mockDevice = new MockBluetoothLock()
