<template>
  <div class="user-center">
    <GlobalNavbar />
    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 个人中心内容 -->
      <div class="user-center-content">
        <!-- 个人信息卡片 -->
        <div class="profile-card">
          <div class="profile-header">
            <h2 class="profile-title">个人信息</h2>
          </div>

          <div class="profile-info">
            <!-- 头像 -->
            <div class="avatar-section">
              <div class="avatar">
                <img
                  v-if="userInfo.avatar && userInfo.avatar !== '/api/avatars/default-avatar.png'"
                  :src="userInfo.avatar"
                  :alt="userInfo.nickname"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  {{ avatarInitial }}
                </div>
              </div>
              <div class="avatar-actions">
                <button class="btn-text" @click="handleAvatarUpload">更换头像</button>
              </div>
            </div>

            <!-- 基本信息网格 -->
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">昵称：</span>
                <span class="info-value">{{ userInfo.nickname }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">邮箱：</span>
                <span class="info-value">{{ userInfo.email }}</span>
                <span v-if="!userInfo.email" class="info-placeholder">未设置</span>
              </div>
              <div class="info-item">
                <span class="info-label">学号：</span>
                <span class="info-value">{{ userInfo.studentId }}</span>
                <span v-if="!userInfo.studentId" class="info-placeholder">未设置</span>
              </div>
              <div class="info-item">
                <span class="info-label">学院：</span>
                <span class="info-value">{{ userInfo.college }}</span>
                <span v-if="!userInfo.college" class="info-placeholder">未设置</span>
              </div>
              <div class="info-item">
                <span class="info-label">专业：</span>
                <span class="info-value">{{ userInfo.major }}</span>
                <span v-if="!userInfo.major" class="info-placeholder">未设置</span>
              </div>
              <div class="info-item">
                <span class="info-label">年级：</span>
                <span class="info-value">{{ userInfo.grade }}</span>
                <span v-if="!userInfo.grade" class="info-placeholder">未设置</span>
              </div>
              <div class="info-item">
                <span class="info-label">性别：</span>
                <span class="info-value">{{ userInfo.genderText }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">角色：</span>
                <span class="info-value">{{ userInfo.roleText }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button class="btn-primary" @click="goToEditProfile">编辑资料</button>
              <button class="btn-secondary" @click="goToStudyStats">学习统计</button>
            </div>
          </div>
        </div>

        <!-- 账号安全卡片 -->
        <div class="security-card">
          <div class="card-header">
            <h3 class="card-title">账号安全</h3>
          </div>
          <div class="security-info">
            <div class="security-item">
              <span class="security-label">注册时间：</span>
              <span class="security-value">{{ formatDate(userInfo.createdAt) }}</span>
            </div>
            <div class="security-item">
              <span class="security-label">上次登录：</span>
              <span class="security-value">{{
                formatDate(userInfo.lastLoginAt) || '首次登录'
              }}</span>
            </div>
            <div class="security-item">
              <span class="security-label">账号状态：</span>
              <span class="security-value">
                <span
                  class="status-badge"
                  :class="userInfo.status === 1 ? 'status-active' : 'status-inactive'"
                >
                  {{ userInfo.statusText }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

// 路由实例
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()

// 从 store 获取完整用户信息
const userInfo = computed(() => {
  const profile = userStore.fullUserInfo
  return {
    nickname: profile?.username || '用户',
    email: profile?.email || '未设置邮箱',
    avatar: profile?.avatar || profile?.avatarUrl || '',
    studentId: profile?.studentId || '',
    major: profile?.major || '',
    college: profile?.college || '',
    grade: profile?.grade || '',
    gender: profile?.gender || 0,
    genderText: profile?.genderText || '未知',
    role: profile?.role || 'user',
    roleText: getRoleText(profile?.role),
    status: profile?.status || 1,
    statusText: profile?.statusText || '正常',
    createdAt: profile?.createdAt || '',
    lastLoginAt: profile?.lastLoginAt || '',
  }
})

// 计算头像首字母
const avatarInitial = computed(() => {
  return userInfo.value.nickname.charAt(0).toUpperCase()
})

// 检查屏幕尺寸 - 响应式设计
const isMobile = ref(false)

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

// 生命周期钩子 - 初始化和窗口大小监听
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)

  // 确保用户信息已加载
  userStore.restoreFromStorage?.()

  // 如果已登录但没有完整资料，主动获取
  if (userStore.userState.isLoggedIn && !userStore.userProfile) {
    // 使用 Promise 而不是 await
    userStore.fetchUserProfile().catch((err) => {
      console.error('获取用户资料失败:', err)
    })
  }
})

// 刷新用户信息
const refreshUserInfo = async () => {
  try {
    // 这里可以调用获取用户详情的API
    // 暂时用store中已有的信息
    console.log('当前用户信息:', userInfo.value)
  } catch (error) {
    console.error('刷新用户信息失败:', error)
  }
}
// 跳转到编辑资料页面
const goToEditProfile = () => {
  router.push('/profile/edit')
}
// 跳转到学习统计页面
const goToStudyStats = () => {
  router.push('/campus/analysis')
}

// 处理头像上传
const handleAvatarUpload = () => {
  ElMessage.info('头像上传功能开发中...')
}

// 辅助函数：格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

// 辅助函数：获取性别文本
const getUserGenderText = (gender?: number) => {
  switch (gender) {
    case 1:
      return '男'
    case 2:
      return '女'
    default:
      return '未知'
  }
}

const getRoleText = (role?: string) => {
  switch (role) {
    case 'admin':
      return '管理员'
    case 'user':
      return '普通用户'
    case 'student':
      return '学生'
    case 'teacher':
      return '教师'
    default:
      return role || '用户'
  }
}
// 辅助函数：获取角色文本
const getUserRoleText = (role?: string) => {
  switch (role) {
    case 'admin':
      return '管理员'
    case 'user':
      return '普通用户'
    default:
      return role || '用户'
  }
}

// 辅助函数：获取状态文本
const getUserStatusText = (status?: number) => {
  return status === 1 ? '正常' : '禁用'
}
</script>

<style scoped>
/* 主容器 */
.user-center {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

/* 主内容区 */
.main-content {
  display: flex;
  flex: 1;
  margin-top: 70px;
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 70px);
}

/* 个人中心内容 */
.user-center-content {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

/* 个人信息卡片 */
.profile-card,
.security-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.profile-card:hover,
.security-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.profile-header {
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.profile-title {
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #f0f9ff;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 48px;
  font-weight: 600;
  text-transform: uppercase;
}

.avatar-actions {
  display: flex;
  gap: 8px;
}

.btn-text {
  padding: 6px 16px;
  background: transparent;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-text:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
  color: #409eff;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 30px;
  background-color: #fafafa;
  padding: 20px;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: baseline;
  font-size: 15px;
  line-height: 1.6;
}

.info-label {
  font-weight: 500;
  color: #909399;
  min-width: 60px;
  margin-right: 8px;
}

.info-value {
  color: #303133;
  font-weight: 500;
  word-break: break-word;
}

.info-placeholder {
  color: #c0c4cc;
  font-size: 14px;
  font-style: italic;
  margin-left: 4px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 8px;
}

.btn-primary {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  padding: 10px 24px;
  background-color: transparent;
  color: #667eea;
  border: 1px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

/* 账号安全卡片 */
.card-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
}

.security-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.security-item {
  display: flex;
  align-items: center;
  font-size: 15px;
}

.security-label {
  font-weight: 500;
  color: #909399;
  min-width: 80px;
}

.security-value {
  color: #303133;
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-inactive {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-top: 60px;
    padding: 16px;
  }

  .profile-card,
  .security-card {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px;
  }

  .info-item {
    font-size: 14px;
  }

  .info-label {
    min-width: 50px;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .security-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .security-label {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .avatar {
    width: 100px;
    height: 100px;
  }

  .avatar-placeholder {
    font-size: 40px;
  }

  .profile-title {
    font-size: 18px;
  }

  .card-title {
    font-size: 16px;
  }
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-card,
.security-card {
  animation: fadeIn 0.5s ease;
}
</style>
