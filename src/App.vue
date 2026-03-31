<script setup lang="ts">
import MouseBubbles from '@/components/MouseBubbles.vue'
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'
import { useRouter } from 'vue-router'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import { api } from '@/api'
import ReviewReminderBanner from '@/components/ReviewReminderBanner.vue'
import { useTheme } from '@/composables/useTheme'
import {
  applyUserSettings,
  sendBrowserNotification,
  syncPublicProfileSnapshot,
} from '@/utils/userSettings'

const userStore = useUserStore()
const settingsStore = useSettingsStore()
const router = useRouter()
const appReady = ref(false)
let studyReminderTimer: number | null = null

const settings = computed(() => settingsStore.settings)

const { watchSystemTheme } = useTheme()

const validateToken = async (): Promise<boolean> => {
  const token =
    localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN_ALT)
  if (!token) return false

  try {
    await api.verifyToken()
    return true
  } catch {
    console.log('Token 无效，清除本地存储')
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.TOKEN_ALT)

    userStore.userState.isLoggedIn = false
    userStore.userState.userInfo = null

    return false
  }
}

const showGreetingMessage = () => {
  if (!settings.value.systemNotification) return

  const GREETING_KEY = 'system_greeting_shown'
  const hasShownGreeting = localStorage.getItem(GREETING_KEY)

  if (!hasShownGreeting) {
    const now = new Date()
    const hour = now.getHours()
    let message = ''
    let type: 'success' | 'warning' | 'info' = 'info'

    if (4 <= hour && hour < 6) {
      message = '凌晨好，新的一天即将开始~'
    } else if (hour < 12) {
      message = '早上好，祝您有美好的一天！'
      type = 'success'
    } else if (hour < 18) {
      message = '下午好，工作学习辛苦了~'
    } else if (hour < 22) {
      message = '晚上好，享受您的休闲时光~'
      type = 'success'
    } else {
      message = '夜深了，注意休息哦~'
      type = 'warning'
    }

    ElMessage({ message, type, duration: 3000, showClose: true })
    localStorage.setItem(GREETING_KEY, 'true')
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0)
    localStorage.setItem(`${GREETING_KEY}_expires`, tomorrow.getTime().toString())
  } else {
    const expiresStr = localStorage.getItem(`${GREETING_KEY}_expires`)
    if (expiresStr && Date.now() > parseInt(expiresStr)) {
      localStorage.removeItem(GREETING_KEY)
      localStorage.removeItem(`${GREETING_KEY}_expires`)
      showGreetingMessage()
    }
  }
}

const getDateKey = (date: Date) => {
  return date.toISOString().split('T')[0] ?? ''
}

const clearStudyReminder = () => {
  if (studyReminderTimer !== null) {
    window.clearTimeout(studyReminderTimer)
    studyReminderTimer = null
  }
}

const fireStudyReminder = () => {
  const todayKey = getDateKey(new Date())
  if (localStorage.getItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE) === todayKey) {
    return
  }

  const message = '今天的学习计划还没看，记得安排一下进度。'
  const sent =
    settings.value.systemNotification &&
    sendBrowserNotification('学习提醒', message, STORAGE_KEYS.STUDY_REMINDER_LAST_DATE)

  if (!sent) {
    ElMessage({
      message,
      type: 'info',
      duration: 4000,
      showClose: true,
    })
  }

  localStorage.setItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE, todayKey)
}

const scheduleStudyReminder = () => {
  clearStudyReminder()
  if (!settings.value.studyReminder) return

  const now = new Date()
  const nextReminder = new Date()
  nextReminder.setHours(20, 0, 0, 0)

  if (nextReminder <= now) {
    nextReminder.setDate(nextReminder.getDate() + 1)
  }

  const delay = nextReminder.getTime() - now.getTime()
  studyReminderTimer = window.setTimeout(() => {
    fireStudyReminder()
    scheduleStudyReminder()
  }, delay)
}

const applyRuntimeSettings = () => {
  applyUserSettings(settings.value)
  scheduleStudyReminder()

  if (settings.value.publicProfile) {
    syncPublicProfileSnapshot()
  } else {
    localStorage.removeItem(STORAGE_KEYS.PUBLIC_PROFILE_SNAPSHOT)
  }

  if (!settings.value.shareData) {
    localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_STUDY_DATA)
  }
}

watch(
  () => settings.value,
  () => {
    applyRuntimeSettings()
  },
  { deep: true },
)

onMounted(async () => {
  console.log('🚀 App.vue 挂载')

  const cleanup = watchSystemTheme()

  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: '正在初始化...',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  try {
    userStore.restoreFromStorage()
    applyRuntimeSettings()

    const isValid = await validateToken()

    if (!isValid) {
      const currentPath = router.currentRoute.value.path
      const isAuthPage = currentPath === '/login' || currentPath === '/register'

      if (!isAuthPage) {
        const autoLoginSuccess = await userStore.tryAutoLogin?.()
        if (!autoLoginSuccess) {
          userStore.userState.isLoggedIn = false
          userStore.userState.userInfo = null
          router.push('/login')
        }
      }
    }

    showGreetingMessage()
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    loadingInstance.close()
    await nextTick()
    appReady.value = true
  }

  window.addEventListener('storage', handleStorageChange)
})

const handleStorageChange = (e: StorageEvent) => {
  if (e.key === STORAGE_KEYS.TOKEN || e.key === STORAGE_KEYS.TOKEN_ALT) {
    if (!e.newValue) {
      userStore.userState.isLoggedIn = false
      userStore.userState.userInfo = null
      if (!router.currentRoute.value.path.includes('/login')) {
        router.replace('/login')
      }
    }
  }

  if (e.key === STORAGE_KEYS.USER_SETTINGS && e.newValue) {
    try {
      const newSettings = JSON.parse(e.newValue)
      settingsStore.updateSettings(newSettings)
    } catch (error) {
      console.error('同步设置失败:', error)
    }
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorageChange)
  clearStudyReminder()
})
</script>

<template>
  <div v-if="!appReady" class="app-loading">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <div class="loading-text">智慧校园平台正在初始化...</div>
    </div>
  </div>

  <div v-else class="app-content" :class="{ 'content-ready': appReady }">
    <ReviewReminderBanner />
    <router-view />
  </div>
  <MouseBubbles />
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  background-color: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  font-size: var(--font-size-md);
  font-weight: 400;
  transition:
    background-color var(--transition-normal),
    color var(--transition-normal);
}

.app-content {
  opacity: 0;
  transition: opacity 0.3s ease;
  width: 100%;
  height: 100%;
  min-height: 100vh;
}

.app-content.content-ready {
  opacity: 1;
}

button {
  font-family: var(--font-family);
  font-size: inherit;
  cursor: pointer;
  border: none;
  outline: none;
  transition: var(--transition-normal);
  border-radius: var(--radius-md);
  padding: 12px 20px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: var(--color-bg-light);
  color: var(--color-text);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

input[type='text'],
input[type='password'],
input[type='email'],
select,
textarea {
  font-family: var(--font-family);
  font-size: var(--font-size-md);
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-card);
  color: var(--color-text);
  transition: var(--transition-normal);
  width: 100%;
}

input[type='text']:focus,
input[type='password']:focus,
input[type='email']:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

input[type='text']::placeholder,
input[type='password']::placeholder,
input[type='email']::placeholder,
textarea::placeholder {
  color: var(--color-text-placeholder);
}

h1,
h2,
h3,
h4,
h5,
h6 {
  color: var(--color-text);
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  font-family: var(--font-family);
}

h1 {
  font-size: var(--font-size-4xl);
  font-weight: 700;
}

h2 {
  font-size: var(--font-size-3xl);
}

h3 {
  font-size: var(--font-size-2xl);
}

h4 {
  font-size: var(--font-size-xl);
}

h5 {
  font-size: var(--font-size-lg);
}

h6 {
  font-size: var(--font-size-md);
}

a {
  color: var(--color-primary);
  text-decoration: none;
  transition: var(--transition-normal);
}

a:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
  transition: var(--transition-normal);
  border: 1px solid var(--color-border-light);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border: 1px solid var(--color-primary);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn-primary:active {
  background-color: var(--color-primary-active);
}

.btn-success {
  background-color: var(--color-success);
  color: white;
}

.btn-warning {
  background-color: var(--color-warning);
  color: white;
}

.btn-danger {
  background-color: var(--color-danger);
  color: white;
}

.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-outline:hover {
  background-color: var(--color-primary-light);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

.app-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

.loading-text {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 1px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 768px) {
  h1 {
    font-size: var(--font-size-3xl);
  }

  h2 {
    font-size: var(--font-size-2xl);
  }

  h3 {
    font-size: var(--font-size-xl);
  }

  .card {
    padding: var(--spacing-md);
  }

  .modal-content {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: var(--font-size-2xl);
  }

  .modal-content {
    padding: var(--spacing-md);
  }
}
</style>
