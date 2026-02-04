<template>
  <div class="user-center">
    <!-- 顶部导航栏 - 复用首页导航栏 -->
    <nav class="navbar">
      <div class="navbar-container">
        <!-- Logo区域 -->
        <div class="logo">
          <div class="logo-placeholder">logo</div>
        </div>

        <!-- 导航菜单 -->
        <div class="nav-menu" :class="{ 'mobile-menu': isMobile }">
          <div class="nav-item" @click="router.push('/index')">首页</div>

          <div class="nav-item has-submenu">
            个性化学习伴侣
            <div class="submenu">
              <div class="submenu-item" @click="router.push('/ai/chat')">智能问答</div>
              <div class="submenu-item" @click="router.push('/ai/study')">个性化规划</div>
            </div>
          </div>

          <div class="nav-item has-submenu">
            校园生活
            <div class="submenu">
              <div class="submenu-item" @click="router.push('/campus/analysis')">学习管理</div>
              <div class="submenu-item" @click="router.push('/campus/library')">馆藏实况</div>
            </div>
          </div>

          <div class="nav-item has-submenu">
            竞赛相关
            <div class="submenu">
              <div class="submenu-item" @click="router.push('/career/competitions')">竞赛管理</div>
              <div class="submenu-item" @click="router.push('/career/position')">职业导航</div>
              <div class="submenu-item" @click="router.push('/career/pee')">考研支持</div>
            </div>
          </div>
        </div>

        <!-- 右侧操作区 -->
        <div class="nav-actions">
          <!-- 登录按钮 - 未登录时显示 -->
          <button
            v-if="!userStore.userState.isLoggedIn"
            class="btn-login"
            @click="router.push('/login')"
          >
            <span class="login-icon">👤</span>
            登录
          </button>

          <!-- 个人中心 -->
          <div class="nav-user-center">
            <button class="btn-user-center" @click="showUserCenter = !showUserCenter">
              个人中心
            </button>
            <!-- 个人中心下拉菜单 -->
            <div v-if="showUserCenter" class="user-center-dropdown">
              <div class="dropdown-item" @click="handleUserMenuClick('个人信息')">个人信息</div>
              <div class="dropdown-item logout" @click="handleUserMenuClick('退出登录')">
                退出登录
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

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
                <div class="avatar-text">头像</div>
              </div>
            </div>

            <!-- 基本信息 -->
            <div class="basic-info">
              <div class="info-item">
                <span class="info-label">昵称：</span>
                <span class="info-value">{{ userInfo.nickname }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">邮箱：</span>
                <span class="info-value">{{ userInfo.email }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button class="btn-primary" @click="goToEditProfile">修改资料</button>
              <button class="btn-secondary" @click="goToStudyStats">学习统计</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

// 路由实例
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()

// 检查屏幕尺寸 - 响应式设计
const isMobile = ref(false)
const showUserCenter = ref(false)

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

// 生命周期钩子 - 初始化和窗口大小监听
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

// 用户信息
const userInfo = ref({
  nickname: '用户123',
  email: 'user@example.com',
  avatar: 'https://via.placeholder.com/120',
})

// 跳转到修改资料页面
const goToEditProfile = () => {
  // 这里可以跳转到修改资料页面，暂时用alert模拟
  alert('修改资料功能开发中...')
}

// 跳转到学习统计页面
const goToStudyStats = () => {
  // 这里可以跳转到学习统计页面，暂时用alert模拟
  alert('学习统计功能开发中...')
}

// 个人中心菜单项点击
const handleUserMenuClick = (item: string) => {
  if (item === '个人信息') {
    router.push('/profile')
  } else if (item === '退出登录') {
    router.push('/login')
  }
  showUserCenter.value = false
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

/* 顶部导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  z-index: 100;
  height: 70px;
  border-bottom: 1px solid #e5e7eb;
}

.navbar-container {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 100%;
}

/* Logo区域 */
.logo {
  display: flex;
  align-items: center;
}

.logo-placeholder {
  padding: 8px 16px;
  background-color: #165dff;
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
}

/* 导航菜单 */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-menu.mobile-menu {
  display: none;
}

.nav-item {
  position: relative;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.nav-item:hover {
  color: #165dff;
  background-color: #f0f9ff;
}

.nav-item.has-submenu::after {
  content: '▼';
  margin-left: 6px;
  font-size: 12px;
  transition: all 0.3s ease;
}

/* 子菜单悬浮层 */
.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  padding: 12px 0;
  min-width: 160px;
  z-index: 200;
  display: none;
  animation: slideDown 0.2s ease;
}

.nav-item.has-submenu:hover .submenu {
  display: block;
}

.submenu-item {
  padding: 12px 20px;
  font-size: 14px;
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: #f0f9ff;
  color: #165dff;
}

/* 个人中心按钮容器 */
.nav-user-center {
  position: relative;
}

/* 个人中心下拉菜单 */
.user-center-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  min-width: 140px;
  z-index: 200;
  margin-top: 8px;
}

.dropdown-item {
  padding: 12px 20px;
  font-size: 14px;
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-item:hover {
  background-color: #f0f9ff;
  color: #165dff;
}

.dropdown-item.logout {
  color: #f56c6c;
}

.dropdown-item.logout:hover {
  background-color: #f56c6c;
  color: #fff;
}

/* 右侧操作区 */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 登录按钮 */
.btn-login {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: #165dff;
  color: #fff;
  border: 1px solid #165dff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-login:hover {
  background-color: #0e46cc;
  border-color: #0e46cc;
}

.login-icon {
  font-size: 16px;
}

/* 个人中心按钮 */
.btn-user-center {
  padding: 10px 20px;
  background-color: transparent;
  color: #1d2129;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-user-center:hover {
  background-color: #f0f9ff;
  border-color: #165dff;
  color: #165dff;
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
  max-width: 800px;
  margin: 0 auto;
}

/* 个人信息卡片 */
.profile-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
}

.profile-header {
  margin-bottom: 24px;
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
  align-items: center;
  gap: 24px;
}

/* 头像 */
.avatar-section {
  display: flex;
  justify-content: center;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #f0f9ff;
}

.avatar-text {
  font-size: 16px;
  color: #909399;
  text-align: center;
  line-height: 1.5;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border: 2px dashed #dcdfe6;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar:hover {
  background-color: #ecf5ff;
  border-color: #c6e2ff;
}

/* 基本信息 */
.basic-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.info-label {
  font-weight: 500;
  color: #646b7a;
}

.info-value {
  color: #1d2129;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.btn-primary {
  padding: 10px 24px;
  background-color: #165dff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #0e46cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

.btn-secondary {
  padding: 10px 24px;
  background-color: transparent;
  color: #165dff;
  border: 1px solid #165dff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.1);
}

/* 动画 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  /* 移动端适配 */
  .navbar-container {
    padding: 0 16px;
  }

  .nav-menu {
    display: none;
  }

  .nav-menu.mobile-menu {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #fff;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    border-top: 1px solid #e5e7eb;
    padding: 16px;
    gap: 8px;
  }

  .nav-item {
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
