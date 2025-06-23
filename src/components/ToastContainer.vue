<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <TransitionGroup
      name="toast"
      tag="div"
      class="space-y-2"
    >
      <div
        v-for="toast in lockStore.toast.toasts"
        :key="toast.id"
        :class="
          [
            'max-w-sm w-full rounded-lg shadow-lg pointer-events-auto overflow-hidden',
            'transform transition-all duration-300 ease-in-out',
            toastClasses[toast.type],
          ]
        "
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <component :is="getIcon(toast.type)" class="w-6 h-6" />
            </div>
            <div class="ml-3 w-0 flex-1">
              <p
                :class="
                  [
                    'text-sm font-medium',
                    textClasses[toast.type],
                  ]
                "
              >
                {{ toast.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="lockStore.toast.removeToast(toast.id)"
                :class="
                  [
                    'rounded-md inline-flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
                    buttonClasses[toast.type],
                  ]
                "
              >
                <span class="sr-only">关闭</span>
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useLockStore } from '@/stores/lockStore'
import type { ToastMessage } from '@/types'
import { h } from 'vue'

const lockStore = useLockStore()

// Toast 样式映射
const toastClasses: Record<ToastMessage['type'], string> = {
  success: 'bg-green-50 border border-green-200',
  error: 'bg-red-50 border border-red-200',
  warning: 'bg-yellow-50 border border-yellow-200',
  info: 'bg-blue-50 border border-blue-200',
}

const textClasses: Record<ToastMessage['type'], string> = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-yellow-800',
  info: 'text-blue-800',
}

const buttonClasses: Record<ToastMessage['type'], string> = {
  success: 'text-green-500 hover:text-green-600 focus:ring-green-500',
  error: 'text-red-500 hover:text-red-600 focus:ring-red-500',
  warning: 'text-yellow-500 hover:text-yellow-600 focus:ring-yellow-500',
  info: 'text-blue-500 hover:text-blue-600 focus:ring-blue-500',
}

// 图标组件映射
const getIcon = (type: ToastMessage['type']) => {
  const icons = {
    success: () =>
      h('svg', {
        class: 'text-green-400',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
      }, [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        }),
      ]),
    error: () =>
      h('svg', {
        class: 'text-red-400',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
      }, [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
        }),
      ]),
    warning: () =>
      h('svg', {
        class: 'text-yellow-400',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
      }, [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z',
        }),
      ]),
    info: () =>
      h('svg', {
        class: 'text-blue-400',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
      }, [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        }),
      ]),
  }

  return icons[type]
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
