// src/composables/useTheme.ts
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

export type ThemeMode = 'light' | 'dark'
export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink'

// 主题配置
export interface ThemeConfig {
  mode: ThemeMode
  color: ThemeColor
}

// 存储 key
const STORAGE_KEYS = {
  THEME_MODE: 'app_theme_mode',
  THEME_COLOR: 'app_theme_color',
}

// 主题颜色配置（用于 UI 展示）
export const themeColorOptions = [
  { value: 'blue', label: '蓝色', color: '#165dff' },
  { value: 'green', label: '绿色', color: '#52c41a' },
  { value: 'purple', label: '紫色', color: '#722ed1' },
  { value: 'orange', label: '橙色', color: '#fa8c16' },
  { value: 'pink', label: '粉色', color: '#eb2f96' },
]

export function useTheme() {
  // 当前主题模式
  const currentMode = ref<ThemeMode>('light')
  // 当前主题色
  const currentColor = ref<ThemeColor>('blue')
  // 是否正在初始化
  const isInitializing = ref(true)

  /**
   * 应用主题模式
   */
  const applyThemeMode = (mode: ThemeMode) => {
    const html = document.documentElement
    if (mode === 'dark') {
      html.setAttribute('data-theme', 'dark')
    } else {
      html.removeAttribute('data-theme')
    }
    currentMode.value = mode
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode)
  }

  /**
   * 应用主题色
   */
  const applyThemeColor = (color: ThemeColor) => {
    const html = document.documentElement
    html.setAttribute('data-theme-color', color)
    currentColor.value = color
    localStorage.setItem(STORAGE_KEYS.THEME_COLOR, color)
  }

  /**
   * 切换亮色/深色模式
   */
  const toggleDarkMode = () => {
    const newMode = currentMode.value === 'light' ? 'dark' : 'light'
    applyThemeMode(newMode)
    ElMessage.success(`已切换至${newMode === 'light' ? '浅色' : '深色'}模式`)
  }

  /**
   * 设置主题模式
   */
  const setThemeMode = (mode: ThemeMode) => {
    if (currentMode.value === mode) return
    applyThemeMode(mode)
  }

  /**
   * 设置主题色
   */
  const setThemeColor = (color: ThemeColor) => {
    if (currentColor.value === color) return
    applyThemeColor(color)
    ElMessage.success(`主题色已切换至${themeColorOptions.find((c) => c.value === color)?.label}`)
  }

  /**
   * 初始化主题（从 localStorage 读取或使用系统偏好）
   */
  const initTheme = () => {
    isInitializing.value = true

    // 1. 读取保存的主题模式
    let savedMode = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode | null

    // 2. 如果没有保存，检测系统偏好
    if (!savedMode) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      savedMode = prefersDark ? 'dark' : 'light'
    }

    // 3. 读取保存的主题色
    const savedColor = localStorage.getItem(STORAGE_KEYS.THEME_COLOR) as ThemeColor | null

    // 4. 应用主题
    applyThemeMode(savedMode)
    applyThemeColor(savedColor || 'blue')

    isInitializing.value = false
  }

  /**
   * 监听系统主题变化
   */
  const watchSystemTheme = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handler = (e: MediaQueryListEvent) => {
      // 只有当用户没有手动设置主题时，才跟随系统
      if (!localStorage.getItem(STORAGE_KEYS.THEME_MODE)) {
        applyThemeMode(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handler)

    // 返回清理函数
    return () => mediaQuery.removeEventListener('change', handler)
  }

  // 组件挂载时初始化
  onMounted(() => {
    initTheme()
  })

  return {
    // 状态
    currentMode,
    currentColor,
    isInitializing,

    // 方法
    toggleDarkMode,
    setThemeMode,
    setThemeColor,
    initTheme,
    watchSystemTheme,

    // 常量
    themeColorOptions,
  }
}
