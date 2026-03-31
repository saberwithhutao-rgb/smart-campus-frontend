<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/stores/settings'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import { useTheme } from '@/composables/useTheme'
import {
  ensureNotificationPermission,
  syncPublicProfileSnapshot,
  syncAnonymousStudyAnalytics,
} from '@/utils/userSettings'

const router = useRouter()
const settingsStore = useSettingsStore()
const isSaving = ref(false)

const { currentColor, toggleDarkMode, setThemeColor, themeColorOptions: colorOptions } = useTheme()

const settings = computed(() => settingsStore.settings)

const resetSettings = () => {
  // 1. 重置 Store 数据
  settingsStore.reset()

  // 2. 获取重置后的值
  const resetSettings = settingsStore.settings

  // 3. 应用深色模式（直接设置，不依赖 toggleDarkMode）
  const html = document.documentElement
  if (resetSettings.darkMode) {
    html.setAttribute('data-theme', 'dark')
  } else {
    html.removeAttribute('data-theme')
  }

  // 4. 应用主题色
  setThemeColor(resetSettings.themeColor as any)

  // 5. 触发气泡特效事件
  window.dispatchEvent(
    new CustomEvent('bubble-effect-change', {
      detail: resetSettings.bubbleEffect,
    }),
  )
  window.dispatchEvent(
    new CustomEvent('bubble-count-change', {
      detail: resetSettings.bubbleCount,
    }),
  )
  window.dispatchEvent(
    new CustomEvent('bubble-size-change', {
      detail: resetSettings.bubbleSize,
    }),
  )

  // 6. 触发设置变更事件（通知其他组件）
  window.dispatchEvent(
    new CustomEvent('settings-changed', {
      detail: resetSettings,
    }),
  )

  // 7. Store 的 watch 会自动保存到 localStorage，不需要手动调用

  ElMessage.info('已恢复为默认设置')
}

const handleDarkModeChange = (val: boolean) => {
  settingsStore.updateSetting('darkMode', val)
  toggleDarkMode()
}

const handleThemeColorChange = (val: string) => {
  settingsStore.updateSetting('themeColor', val)
  setThemeColor(val as any)
}

const handleSystemNotificationChange = async (val: boolean) => {
  settingsStore.updateSetting('systemNotification', val)

  if (!val) {
    ElMessage.info('已关闭系统通知')
    return
  }

  const permission = await ensureNotificationPermission()
  if (permission === 'granted') {
    ElMessage.success('系统通知已开启，后续将优先使用浏览器通知')
    return
  }

  if (permission === 'unsupported') {
    ElMessage.warning('当前浏览器不支持系统通知，将仅使用站内提醒')
    return
  }

  ElMessage.warning('浏览器通知权限未开启，将继续使用站内提醒')
}

const handleStudyReminderChange = (val: boolean) => {
  settingsStore.updateSetting('studyReminder', val)

  if (!val) {
    localStorage.removeItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE)
    ElMessage.info('已关闭每日学习提醒')
    return
  }

  ElMessage.success('已开启每日学习提醒，应用打开期间会按天提醒')
}

const handlePublicProfileChange = (val: boolean) => {
  settingsStore.updateSetting('publicProfile', val)

  if (val) {
    syncPublicProfileSnapshot()
    ElMessage.success('已开启公开个人资料')
    return
  }

  localStorage.removeItem(STORAGE_KEYS.PUBLIC_PROFILE_SNAPSHOT)
  ElMessage.info('已设为私密资料，仅保留本人可见')
}

const handleShareDataChange = (val: boolean) => {
  settingsStore.updateSetting('shareData', val)

  if (val) {
    ElMessage.success('已开启匿名学习数据共享，仅同步统计结果')
    return
  }

  syncAnonymousStudyAnalytics()
  ElMessage.info('已关闭学习数据共享，并清除本地匿名统计')
}

const handleBubbleEffectChange = (val: boolean) => {
  settingsStore.updateSetting('bubbleEffect', val)
  window.dispatchEvent(new CustomEvent('bubble-effect-change', { detail: val }))
}

const handleBubbleCountChange = (val: number) => {
  settingsStore.updateSetting('bubbleCount', val)
  window.dispatchEvent(new CustomEvent('bubble-count-change', { detail: val }))
}

const handleBubbleSizeChange = (val: number) => {
  settingsStore.updateSetting('bubbleSize', val)
  window.dispatchEvent(new CustomEvent('bubble-size-change', { detail: val }))
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    window.dispatchEvent(
      new CustomEvent('settings-changed', {
        detail: settings.value,
      }),
    )

    if (settings.value.publicProfile) {
      syncPublicProfileSnapshot()
    } else {
      localStorage.removeItem(STORAGE_KEYS.PUBLIC_PROFILE_SNAPSHOT)
    }

    if (!settings.value.shareData) {
      syncAnonymousStudyAnalytics()
    }

    ElMessage.success('设置保存成功')
    setTimeout(() => router.back(), 1500)
  } catch {
    ElMessage.error('保存失败')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  settingsStore.init()
})
</script>

<template>
  <div class="settings">
    <GlobalNavbar />

    <div class="main-content">
      <div class="settings-container">
        <div class="back-nav">
          <button class="btn-back" @click="router.back()">
            <svg class="back-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                fill="currentColor"
              />
            </svg>
            返回
          </button>
        </div>

        <div class="settings-card">
          <div class="card-header">
            <h2 class="card-title">设置</h2>
            <p class="card-subtitle">自定义您的使用体验</p>
          </div>

          <div class="settings-sections">
            <div class="settings-section">
              <h3 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path
                    d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 10c0 4.08-3.05 7.44-7 7.93v-2.02c3.05-.46 5-2.81 5-5.91 0-3.31-2.69-6-6-6s-6 2.69-6 6c0 2.47 1.49 4.61 3.62 5.56v2.1C6.51 18.18 4 15.37 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm0-5c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
                    fill="currentColor"
                  />
                </svg>
                外观设置
              </h3>

              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">深色模式</span>
                  <span class="setting-desc">切换深色/浅色主题</span>
                </div>
                <el-switch
                  :model-value="settings.darkMode"
                  @update:model-value="handleDarkModeChange"
                />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">主题颜色</span>
                  <span class="setting-desc">选择您的主题色</span>
                </div>
                <div class="theme-color-options">
                  <button
                    v-for="option in colorOptions"
                    :key="option.value"
                    class="theme-color-btn"
                    :class="{ active: currentColor === option.value }"
                    :style="{ backgroundColor: option.color }"
                    @click="handleThemeColorChange(option.value)"
                    :title="option.label"
                  >
                    <span v-if="currentColor === option.value" class="check-icon">✓</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <h3 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path
                    d="M7.5 4C5.57 4 4 5.57 4 7.5S5.57 11 7.5 11 11 9.43 11 7.5 9.43 4 7.5 4zm0 5C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm9-5C14.57 4 13 5.57 13 7.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5S18.43 4 16.5 4zm0 5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM4 16.5C4 18.43 5.57 20 7.5 20s3.5-1.57 3.5-3.5S9.43 13 7.5 13 4 14.57 4 16.5zm3.5 1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9-1.5c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5-3.5 1.57-3.5 3.5zm3.5 1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
                    fill="currentColor"
                  />
                </svg>
                特效设置
              </h3>

              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">鼠标气泡特效</span>
                  <span class="setting-desc">开启/关闭气泡特效</span>
                </div>
                <el-switch
                  :model-value="settings.bubbleEffect"
                  @update:model-value="handleBubbleEffectChange"
                />
              </div>

              <div class="setting-item" v-if="settings.bubbleEffect">
                <div class="setting-info">
                  <span class="setting-label">气泡数量</span>
                  <span class="setting-desc">最大 {{ settings.bubbleCount }} 个</span>
                </div>
                <el-slider
                  :model-value="settings.bubbleCount"
                  :min="20"
                  :max="100"
                  :step="10"
                  @update:model-value="handleBubbleCountChange"
                  style="width: 200px"
                />
              </div>

              <div class="setting-item" v-if="settings.bubbleEffect">
                <div class="setting-info">
                  <span class="setting-label">气泡大小</span>
                  <span class="setting-desc">{{ settings.bubbleSize }}%</span>
                </div>
                <el-slider
                  :model-value="settings.bubbleSize"
                  :min="30"
                  :max="150"
                  :step="10"
                  @update:model-value="handleBubbleSizeChange"
                  style="width: 200px"
                />
              </div>
            </div>

            <div class="settings-section">
              <h3 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path
                    d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                    fill="currentColor"
                  />
                </svg>
                通知设置
              </h3>

              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">系统通知</span>
                  <span class="setting-desc">接收系统消息提醒</span>
                </div>
                <el-switch
                  :model-value="settings.systemNotification"
                  @update:model-value="handleSystemNotificationChange"
                />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">学习提醒</span>
                  <span class="setting-desc">每日学习计划提醒</span>
                </div>
                <el-switch
                  :model-value="settings.studyReminder"
                  @update:model-value="handleStudyReminderChange"
                />
              </div>
            </div>

            <div class="settings-section">
              <h3 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path
                    d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
                    fill="currentColor"
                  />
                </svg>
                隐私设置
              </h3>

              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">公开个人资料</span>
                  <span class="setting-desc">允许其他用户查看您的资料</span>
                </div>
                <el-switch
                  :model-value="settings.publicProfile"
                  @update:model-value="handlePublicProfileChange"
                />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">学习数据共享</span>
                  <span class="setting-desc">允许匿名学习数据用于改进服务</span>
                </div>
                <el-switch
                  :model-value="settings.shareData"
                  @update:model-value="handleShareDataChange"
                />
              </div>
            </div>

            <div class="settings-actions">
              <button class="btn-save" @click="saveSettings" :disabled="isSaving">
                {{ isSaving ? '保存中...' : '保存设置' }}
              </button>
              <button class="btn-reset" @click="resetSettings">恢复默认</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
}

.main-content {
  margin-top: 70px;
  padding: 32px 24px;
  min-height: calc(100vh - 70px);
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.back-nav {
  margin-bottom: 24px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-4px);
}

.settings-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  margin-bottom: 32px;
  text-align: center;
}

.card-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-subtitle {
  font-size: 14px;
  color: var(--color-text-light);
  margin: 0;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-section {
  padding: 24px;
  background: var(--color-bg-light);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-border);
}

.section-icon {
  color: var(--color-primary);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-label {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 4px;
}

.setting-desc {
  display: block;
  font-size: 12px;
  color: var(--color-text-light);
}

.settings-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 32px;
}

.btn-save,
.btn-reset {
  padding: 12px 32px;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reset {
  background: transparent;
  color: var(--color-text-secondary);
  border: 2px solid var(--color-border);
}

.btn-reset:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
  transform: translateY(-2px);
  background: rgba(245, 108, 108, 0.05);
}

.theme-color-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.theme-color-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-color-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.theme-color-btn.active {
  border-color: var(--color-text);
  box-shadow:
    0 0 0 2px var(--color-bg-card),
    0 0 0 4px currentColor;
}

.check-icon {
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .main-content {
    margin-top: 60px;
    padding: 20px 16px;
  }

  .settings-card {
    padding: 24px;
  }

  .card-title {
    font-size: 24px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .settings-actions {
    flex-direction: column;
  }

  .btn-save,
  .btn-reset {
    width: 100%;
  }
}
</style>
