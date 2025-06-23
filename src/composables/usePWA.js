import { ref, onMounted } from 'vue'

export function usePWA() {
    const canInstall = ref(false)
    const isInstalled = ref(false)
    const installPrompt = ref(null)

    // 检查是否已安装PWA
    const checkIfInstalled = () => {
        // 检查是否在独立模式运行（已安装的PWA）
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            isInstalled.value = true
            return true
        }
        
        // 检查是否在TWA中运行
        if (document.referrer.startsWith('android-app://')) {
            isInstalled.value = true
            return true
        }
        
        return false
    }

    // 监听PWA安装提示事件
    const handleBeforeInstallPrompt = (e) => {
        // 阻止Chrome 67及更早版本自动显示安装提示
        e.preventDefault()
        // 保存事件以便稍后触发
        installPrompt.value = e
        canInstall.value = true
    }

    // 安装PWA
    const installPWA = async () => {
        if (!installPrompt.value) {
            // 对于不支持安装提示的浏览器，显示手动安装指导
            return showManualInstallGuide()
        }

        try {
            // 显示安装提示
            const result = await installPrompt.value.prompt()
            
            // 等待用户响应
            const choiceResult = await installPrompt.value.userChoice
            
            if (choiceResult.outcome === 'accepted') {
                console.log('用户接受了PWA安装')
                canInstall.value = false
                isInstalled.value = true
                return { success: true, message: 'PWA安装成功！' }
            } else {
                console.log('用户拒绝了PWA安装')
                return { success: false, message: '用户取消了安装' }
            }
        } catch (error) {
            console.error('PWA安装失败:', error)
            return { success: false, message: '安装失败，请重试' }
        }
    }

    // 显示手动安装指导
    const showManualInstallGuide = () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const isAndroid = /Android/.test(navigator.userAgent)
        
        let guide = ''
        
        if (isIOS) {
            guide = `iOS设备安装步骤：
1. 点击Safari浏览器底部的"分享"按钮
2. 向下滚动找到"添加到主屏幕"
3. 点击"添加"完成安装`
        } else if (isAndroid) {
            guide = `Android设备安装步骤：
1. 点击Chrome浏览器右上角的菜单（三个点）
2. 选择"添加到主屏幕"或"安装应用"
3. 点击"添加"完成安装`
        } else {
            guide = `桌面设备安装步骤：
1. 点击地址栏右边的安装图标
2. 或者点击浏览器菜单中的"安装应用"
3. 点击"安装"完成安装`
        }
        
        return { success: false, message: guide, isManual: true }
    }

    // 监听安装完成事件
    const handleAppInstalled = () => {
        console.log('PWA已安装')
        canInstall.value = false
        isInstalled.value = true
    }

    onMounted(() => {
        // 检查是否已安装
        checkIfInstalled()
        
        // 监听安装相关事件
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)
        
        // 清理事件监听器
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    })

    return {
        canInstall,
        isInstalled,
        installPWA,
        showManualInstallGuide
    }
}
