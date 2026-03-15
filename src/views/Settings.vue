<template>
  <div class="settings">
    <GlobalNavbar />

    <div class="main-content">
      <div class="settings-container">
        <!-- 返回按钮 -->
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

        <!-- 设置卡片 -->
        <div class="settings-card">
          <div class="card-header">
            <h2 class="card-title">设置</h2>
            <p class="card-subtitle">自定义您的使用体验</p>
          </div>

          <!-- 设置选项 -->
          <div class="settings-sections">
            <!-- 外观设置 -->
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
                <el-switch v-model="settings.darkMode" @change="handleDarkModeChange" />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">主题颜色</span>
                  <span class="setting-desc">选择您的主题色</span>
                </div>
                <el-color-picker v-model="settings.themeColor" @change="handleThemeColorChange" />
              </div>
            </div>

            <!-- 特效设置 -->
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
                <el-switch v-model="settings.bubbleEffect" @change="handleBubbleEffectChange" />
              </div>

              <div class="setting-item" v-if="settings.bubbleEffect">
                <div class="setting-info">
                  <span class="setting-label">气泡数量</span>
                  <span class="setting-desc">最大 {{ settings.bubbleCount }} 个</span>
                </div>
                <el-slider
                  v-model="settings.bubbleCount"
                  :min="20"
                  :max="100"
                  :step="10"
                  @change="handleBubbleCountChange"
                  style="width: 200px"
                />
              </div>

              <div class="setting-item" v-if="settings.bubbleEffect">
                <div class="setting-info">
                  <span class="setting-label">气泡大小</span>
                  <span class="setting-desc">{{ settings.bubbleSize }}%</span>
                </div>
                <el-slider
                  v-model="settings.bubbleSize"
                  :min="30"
                  :max="150"
                  :step="10"
                  @change="handleBubbleSizeChange"
                  style="width: 200px"
                />
              </div>
            </div>

            <!-- 通知设置 -->
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
                <el-switch v-model="settings.systemNotification" />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">学习提醒</span>
                  <span class="setting-desc">每日学习计划提醒</span>
                </div>
                <el-switch v-model="settings.studyReminder" />
              </div>
            </div>

            <!-- 隐私设置 -->
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
                <el-switch v-model="settings.publicProfile" />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">学习数据共享</span>
                  <span class="setting-desc">允许匿名学习数据用于改进服务</span>
                </div>
                <el-switch v-model="settings.shareData" />
              </div>
            </div>

            <!-- 保存按钮 -->
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

<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const isSaving = ref(false)

// 设置数据
const settings = reactive({
  // 外观
  darkMode: false,
  themeColor: '#409eff',

  // 特效
  bubbleEffect: true,
  bubbleCount: 60,
  bubbleSize: 100,

  // 通知
  systemNotification: true,
  studyReminder: true,

  // 隐私
  publicProfile: true,
  shareData: false,
})

// 加载设置
const loadSettings = () => {
  const saved = localStorage.getItem('userSettings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      Object.assign(settings, parsed)
    } catch (e) {
      console.error('加载设置失败:', e)
    }
  }
}

// 恢复默认
const resetSettings = () => {
  settings.darkMode = false
  settings.themeColor = '#409eff'
  settings.bubbleEffect = true
  settings.bubbleCount = 60
  settings.bubbleSize = 100
  settings.systemNotification = true
  settings.studyReminder = true
  settings.publicProfile = true
  settings.shareData = false
}

// 处理设置变更
const handleDarkModeChange = (val: boolean) => {
  document.documentElement.classList.toggle('dark', val)
}

const handleThemeColorChange = (val: string) => {
  document.documentElement.style.setProperty('--primary-color', val)
}

// 处理特效开关
const handleBubbleEffectChange = (val: boolean) => {
  window.dispatchEvent(new CustomEvent('bubble-effect-change', { detail: val }))
}

// 处理数量变化
const handleBubbleCountChange = (val: number) => {
  window.dispatchEvent(new CustomEvent('bubble-count-change', { detail: val }))
}

// 处理大小变化
const handleBubbleSizeChange = (val: number) => {
  window.dispatchEvent(new CustomEvent('bubble-size-change', { detail: val }))
}

// 保存设置时触发总事件
const saveSettings = async () => {
  isSaving.value = true
  try {
    localStorage.setItem('userSettings', JSON.stringify(settings))

    // 触发总设置变更事件
    window.dispatchEvent(
      new CustomEvent('settings-changed', {
        detail: { ...settings },
      }),
    )

    ElMessage.success('设置保存成功')
    setTimeout(() => router.back(), 1500)
  } catch {
    ElMessage.error('保存失败')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #1a1a1a;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-section {
  padding: 24px;
  background: #f8f9fa;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e9ecef;
}

.section-icon {
  color: #667eea;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
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
  color: #333;
  margin-bottom: 4px;
}

.setting-desc {
  display: block;
  font-size: 12px;
  color: #999;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #666;
  border: 2px solid #ddd;
}

.btn-reset:hover {
  border-color: #f56c6c;
  color: #f56c6c;
  transform: translateY(-2px);
  background: rgba(245, 108, 108, 0.05);
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
