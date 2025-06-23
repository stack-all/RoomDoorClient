import type { ToastMessage } from '@/types'
import { computed, ref } from 'vue'

const toasts = ref<ToastMessage[]>([])
let toastIdCounter = 0

/**
 * Toast 通知 Composable
 */
export function useToast() {
  /**
   * 显示 Toast 消息
   */
  const showToast = (
    message: string,
    type: ToastMessage['type'] = 'info',
    duration = 3000,
  ) => {
    const id = `toast-${++toastIdCounter}`
    const toast: ToastMessage = {
      id,
      type,
      message,
      duration,
    }

    toasts.value.push(toast)

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  /**
   * 移除指定的 Toast
   */
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((toast: ToastMessage) => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  /**
   * 清除所有 Toast
   */
  const clearToasts = () => {
    toasts.value = []
  }

  /**
   * 显示成功消息
   */
  const success = (message: string, duration?: number) => {
    return showToast(message, 'success', duration)
  }

  /**
   * 显示错误消息
   */
  const error = (message: string, duration?: number) => {
    return showToast(message, 'error', duration)
  }

  /**
   * 显示警告消息
   */
  const warning = (message: string, duration?: number) => {
    return showToast(message, 'warning', duration)
  }

  /**
   * 显示信息消息
   */
  const info = (message: string, duration?: number) => {
    return showToast(message, 'info', duration)
  }

  return {
    toasts: computed(() => toasts.value),
    showToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  }
}
