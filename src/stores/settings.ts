import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import { DEFAULT_USER_SETTINGS, type UserSettings } from '@/utils/userSettings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({ ...DEFAULT_USER_SETTINGS })
  const initialized = ref(false)

  const init = () => {
    if (initialized.value) return

    const stored = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        settings.value = { ...DEFAULT_USER_SETTINGS, ...parsed }
      } catch (e) {
        console.error('解析设置失败:', e)
      }
    }
    initialized.value = true
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    settings.value[key] = value
  }

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  const reset = () => {
    settings.value = { ...DEFAULT_USER_SETTINGS }
  }

  const saveToLocalStorage = () => {
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings.value))
  }

  watch(
    settings,
    () => {
      if (initialized.value) {
        saveToLocalStorage()
      }
    },
    { deep: true },
  )

  return {
    settings,
    initialized,
    init,
    updateSetting,
    updateSettings,
    reset,
  }
})
