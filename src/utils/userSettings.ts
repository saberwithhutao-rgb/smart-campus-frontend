import { STORAGE_KEYS } from '@/utils/storageKeys'

export interface UserSettings {
  darkMode: boolean
  themeColor: string
  bubbleEffect: boolean
  bubbleCount: number
  bubbleSize: number
  systemNotification: boolean
  studyReminder: boolean
  publicProfile: boolean
  shareData: boolean
}

export interface PublicProfileSnapshot {
  username: string
  avatar: string
  college: string
  major: string
  grade: string
  updatedAt: string
}

export interface AnonymousStudyAnalytics {
  updatedAt: string
  planCount: number
  completedCount: number
  completionRate: number
  subjects: string[]
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  darkMode: false,
  themeColor: '#409eff',
  bubbleEffect: true,
  bubbleCount: 60,
  bubbleSize: 100,
  systemNotification: true,
  studyReminder: true,
  publicProfile: true,
  shareData: false,
}

const isClient = typeof window !== 'undefined'

const parseJson = <T>(value: string | null): T | null => {
  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.error('解析本地设置失败:', error)
    return null
  }
}

export const getUserSettings = (): UserSettings => {
  if (!isClient) return { ...DEFAULT_USER_SETTINGS }

  const stored = parseJson<Partial<UserSettings>>(localStorage.getItem(STORAGE_KEYS.USER_SETTINGS))
  return {
    ...DEFAULT_USER_SETTINGS,
    ...stored,
  }
}

export const saveUserSettings = (settings: UserSettings) => {
  if (!isClient) return
  localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings))
}

export const applyThemeSettings = (settings: UserSettings) => {
  if (!isClient) return
  document.documentElement.classList.toggle('dark', settings.darkMode)
  document.documentElement.style.setProperty('--primary-color', settings.themeColor)
}

export const applyUserSettings = (settings: UserSettings) => {
  if (!isClient) return

  applyThemeSettings(settings)

  document.documentElement.dataset.profileVisibility = settings.publicProfile ? 'public' : 'private'
  document.documentElement.dataset.dataSharing = settings.shareData ? 'enabled' : 'disabled'
}

export const supportsBrowserNotifications = () => {
  return isClient && 'Notification' in window
}

export const ensureNotificationPermission = async () => {
  if (!supportsBrowserNotifications()) return 'unsupported' as const
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export const sendBrowserNotification = (title: string, body: string, tag?: string) => {
  if (!supportsBrowserNotifications() || Notification.permission !== 'granted') {
    return false
  }

  new Notification(title, {
    body,
    tag,
    icon: '/favicon.ico',
  })

  return true
}

export const syncPublicProfileSnapshot = (profile?: Partial<PublicProfileSnapshot>) => {
  if (!isClient) return

  const settings = getUserSettings()
  if (!settings.publicProfile) {
    localStorage.removeItem(STORAGE_KEYS.PUBLIC_PROFILE_SNAPSHOT)
    return
  }

  const storedUserInfo = parseJson<Record<string, unknown>>(
    localStorage.getItem(STORAGE_KEYS.USER_INFO),
  )
  const snapshot: PublicProfileSnapshot = {
    username: String(profile?.username ?? storedUserInfo?.username ?? '用户'),
    avatar: String(profile?.avatar ?? storedUserInfo?.avatar ?? storedUserInfo?.avatarUrl ?? ''),
    college: String(profile?.college ?? storedUserInfo?.college ?? ''),
    major: String(profile?.major ?? storedUserInfo?.major ?? ''),
    grade: String(profile?.grade ?? storedUserInfo?.grade ?? ''),
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEYS.PUBLIC_PROFILE_SNAPSHOT, JSON.stringify(snapshot))
}

export const syncAnonymousStudyAnalytics = (analytics?: AnonymousStudyAnalytics) => {
  if (!isClient) return

  const settings = getUserSettings()
  if (!settings.shareData || !analytics) {
    localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_STUDY_DATA)
    return
  }

  localStorage.setItem(STORAGE_KEYS.ANONYMOUS_STUDY_DATA, JSON.stringify(analytics))
}
