<!-- components/GlobalNavbar.vue -->
<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo区域 -->
      <div class="logo" @click="goToIndex">
        <div class="logo-placeholder">logo</div>
      </div>

      <!-- 导航菜单 -->
      <div class="nav-menu" :class="{ 'mobile-menu': isMobile }">
        <div
          class="nav-item"
          :class="{ active: activeMenu === '首页' }"
          @click="handleMenuClick('首页')"
          @mouseenter="showSubMenuHandler('首页')"
          @mouseleave="hideSubMenu"
        >
          首页
        </div>

        <div
          class="nav-item has-submenu"
          @mouseenter="showSubMenuHandler('个性化学习伴侣')"
          @mouseleave="hideSubMenu"
          @click="handleMenuClick('个性化学习伴侣')"
        >
          个性化学习伴侣
          <div v-if="showSubMenu === '个性化学习伴侣' && !isMobile" class="submenu">
            <div class="submenu-item" @click="goToSmartQA">智能问答</div>
            <div class="submenu-item" @click="goToPersonalStudy">个性化规划</div>
            <div class="submenu-item" @click="goToStudyManagement">学习管理</div>
          </div>
          <div v-if="showSubMenu === '个性化学习伴侣' && isMobile" class="mobile-submenu">
            <div class="mobile-submenu-item" @click="goToSmartQA">智能问答</div>
            <div class="mobile-submenu-item" @click="goToPersonalStudy">个性化规划</div>
            <div class="mobile-submenu-item" @click="goToStudyManagement">学习管理</div>
          </div>
        </div>

        <div
          class="nav-item has-submenu"
          @mouseenter="showSubMenuHandler('校园生活')"
          @mouseleave="hideSubMenu"
          @click="handleMenuClick('校园生活')"
        >
          校园生活
          <div v-if="showSubMenu === '校园生活' && !isMobile" class="submenu">
            <div class="submenu-item" @click="router.push('/campus/library')">馆藏实况</div>
          </div>
          <div v-if="showSubMenu === '校园生活' && isMobile" class="mobile-submenu">
            <div class="mobile-submenu-item" @click="router.push('/campus/library')">馆藏实况</div>
          </div>
        </div>

        <div
          class="nav-item has-submenu"
          @mouseenter="showSubMenuHandler('竞赛相关')"
          @mouseleave="hideSubMenu"
          @click="handleMenuClick('竞赛相关')"
        >
          竞赛相关
          <div v-if="showSubMenu === '竞赛相关' && !isMobile" class="submenu">
            <div class="submenu-item" @click="goToCompetitionManagement">竞赛管理</div>
            <div class="submenu-item" @click="goToCareerNavigation">职业导航</div>
            <div class="submenu-item" @click="goToExamSupport">考研支持</div>
          </div>
          <div v-if="showSubMenu === '竞赛相关' && isMobile" class="mobile-submenu">
            <div class="mobile-submenu-item" @click="goToCompetitionManagement">竞赛管理</div>
            <div class="mobile-submenu-item" @click="goToCareerNavigation">职业导航</div>
            <div class="mobile-submenu-item" @click="goToExamSupport">考研支持</div>
          </div>
        </div>
      </div>

      <!-- 右侧操作区 - 关键：在所有页面都能使用 -->
      <div class="nav-actions">
        <!-- 登录按钮 - 未登录时显示 -->
        <button v-if="!hasToken" class="btn-login" @click="goToLogin">
          <span class="login-icon">👤</span>
          登录
        </button>

        <!-- 个人中心 - 已登录时显示 -->
        <div v-if="hasToken" class="user-center">
          <button class="btn-user-center" @click="toggleUserCenter">个人中心</button>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const showUserCenter = ref(false)
const activeMenu = ref('')
const showSubMenu = ref('')
const isMobile = ref(false)

// 检查是否有token（核心逻辑）
const hasToken = computed(() => {
  return userStore.userState.isLoggedIn && !!userStore.userState.userInfo?.token
})
// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

// 导航函数
const goToIndex = () => router.push('/index')
const goToLogin = () => router.push('/login')
const goToSmartQA = () => router.push('/ai/chat')
const goToPersonalStudy = () => router.push('/ai/study')
const goToStudyManagement = () => router.push('/campus/analysis')
const goToCompetitionManagement = () => router.push('/career/competitions')
const goToCareerNavigation = () => router.push('/career/position')
const goToExamSupport = () => router.push('/career/pee')

const toggleUserCenter = () => {
  showUserCenter.value = !showUserCenter.value
}

const closeUserCenter = () => {
  showUserCenter.value = false
}

const showSubMenuHandler = (menu: string) => {
  if (!isMobile.value) {
    showSubMenu.value = menu
  }
}

const hideSubMenu = () => {
  showSubMenu.value = ''
}

const handleMenuClick = (menu: string) => {
  if (menu === '首页') {
    goToIndex()
    activeMenu.value = '首页'
    return
  }

  if (isMobile.value) {
    if (showSubMenu.value === menu) {
      showSubMenu.value = ''
    } else {
      showSubMenu.value = menu
    }
  } else {
    if (['个性化学习伴侣', '校园生活', '竞赛相关'].includes(menu)) {
      showSubMenuHandler(menu)
      activeMenu.value = menu
    } else {
      hideSubMenu()
      activeMenu.value = ''
    }
  }
}

// 处理用户菜单点击 - 全局退出登录
const handleUserMenuClick = (item: string) => {
  if (item === '个人信息') {
    router.push('/profile')
  } else if (item === '退出登录') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        userStore.logout(true)

        // 关闭菜单
        showUserCenter.value = false

        // 显示成功消息
        ElMessage.success('退出登录成功')

        // 刷新页面确保所有页面状态更新
        setTimeout(() => {
          window.location.reload()
        }, 300)
      })
      .catch(() => {
        console.log('用户取消退出登录')
      })
  }
  closeUserCenter()
}

// 监听窗口大小变化
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
/* 全局变量 - 与首页保持一致 */
:root {
  /* 主色调 */
  --primary-color: #409eff;
  --primary-color-light: #e6f7ff;
  --primary-color-dark: #1890ff;
  --accent-color: #165dff;

  /* 中性色 */
  --text-color-dark: #333;
  --text-color-medium: #666;
  --text-color-light: #999;
  --text-color: #333;
  --text-color-secondary: #666;
  --border-color: #e5e7eb;
  --border-color-light: #f0f2f5;
  --white: #fff;
  --bg-color: #f5f7fa;
  --bg-color-light: #f0f9ff;
  --bg-color-white: #fff;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 圆角 */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --border-radius-2xl: 20px;

  /* 过渡 */
  --transition: all 0.3s ease;
  --transition-fast: all 0.2s ease;
}

/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color-dark);
  background-color: var(--bg-color);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 主容器 */
.study-management-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 - 与首页保持一致 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--white);
  box-shadow: var(--shadow-sm);
  z-index: 100;
  height: 70px;
  border-bottom: 1px solid var(--border-color-light);
}

.navbar-container {
  max-width: 100%;
  margin: 0;
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
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.logo:hover {
  opacity: 0.8;
}

.logo-placeholder {
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: #fff;
  border-radius: var(--border-radius-md);
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
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--border-radius-md);
}

.nav-item:hover {
  color: var(--primary-color);
  background-color: var(--bg-color-light);
}

.nav-item.active {
  color: var(--primary-color);
  font-weight: 600;
}

.nav-item.has-submenu::after {
  content: '▼';
  margin-left: 6px;
  font-size: 12px;
  transition: var(--transition);
}

/* 子菜单悬浮层 - 与首页保持一致 */
.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: var(--white);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 12px 0;
  min-width: 160px;
  z-index: 200;
  animation: slideDown 0.2s ease;
}

.submenu-item {
  padding: 12px 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: var(--bg-color-light);
  color: var(--primary-color);
}

/* 移动端子菜单 */
.mobile-submenu {
  background-color: var(--bg-color-light);
  border-radius: var(--border-radius-md);
  margin-top: 8px;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}

.mobile-submenu-item {
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--border-radius-md);
}

.mobile-submenu-item:hover {
  background-color: var(--primary-color);
  color: var(--white);
}

/* 右侧操作区 - 与首页保持一致 */
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
  background-color: var(--primary-color);
  color: #fff;
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
}

.btn-login:hover {
  background-color: var(--primary-color-dark);
  border-color: var(--primary-color-dark);
}

.login-icon {
  font-size: 16px;
}

/* 个人中心 */
.user-center {
  position: relative;
}

.btn-user-center {
  padding: 10px 20px;
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
}

.btn-user-center:hover {
  background-color: var(--bg-color-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 个人中心下拉菜单 */
.user-center-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--white);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 8px 0;
  min-width: 140px;
  z-index: 200;
  margin-top: 8px;
}

.dropdown-item {
  padding: 12px 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
}

.dropdown-item:hover {
  background-color: var(--bg-color-light);
  color: var(--primary-color);
}

.dropdown-item.register {
  color: var(--primary-color);
  border-bottom: 1px solid var(--border-color-light);
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.dropdown-item.register:hover {
  background-color: var(--primary-color);
  color: #fff;
}

.dropdown-item.logout {
  color: #f56c6c;
}

.dropdown-item.logout:hover {
  background-color: #f56c6c;
  color: #fff;
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

/* 顶部标题栏 */
.title-bar {
  height: 60px;
  background-color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 70px;
}

.title-text {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

/* 主体内容区 */
.main-content {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 70px);
  margin-top: 70px;
  overflow: hidden;
}

/* 侧边栏切换按钮 */
.sidebar-toggle {
  position: fixed;
  top: 80px;
  left: 10px;
  z-index: 99;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  cursor: pointer;
  display: none;
}

/* 左侧功能栏 */
.sidebar {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid var(--border-color);
  padding: 20px 0;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
  position: fixed;
  top: 70px;
  bottom: 0;
  overflow-y: auto;
  z-index: 10;
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.sidebar-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
  margin: 0;
}

.sidebar-menu {
  margin-top: 20px;
}

.sidebar-item {
  padding: 16px 20px;
  font-size: 16px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background-color: var(--bg-color-light);
  color: var(--primary-color);
}

.sidebar-item-active {
  background-color: var(--bg-color-light);
  color: var(--primary-color) !important;
  border-left-color: var(--primary-color);
  font-weight: 500;
}

/* 右侧主内容区 */
.content-area {
  margin-left: 280px;
  flex: 1;
  padding: 20px;
  transition: margin-left 0.3s ease;
  overflow-y: auto;
  max-height: calc(100vh - 70px);
  padding-bottom: 40px;
}

/* 时间导航栏 */
.time-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.time-btn {
  flex: 1;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
}

.time-btn:hover {
  background-color: #e6f7ff;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.time-btn.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: #fff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

/* 内容卡片 */
/* 自定义卡片样式 */
.custom-card {
  margin-bottom: 20px;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.custom-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 卡片标题 - 左上角显示 */
.card-title {
  padding: 12px 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color-dark);
  text-align: left;
}

/* 卡片内容区 */
.card-content {
  padding: 20px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
}

/* 统计模块标题 */
.module-title {
  font-size: 18px;
  font-weight: bold;
  color: #666;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
}

/* 统计模块提示文字 */
.module-hint {
  font-size: 14px;
  color: var(--text-color-dark);
  background-color: #fff;
  padding: 10px;
  margin: 0;
  position: absolute;
  top: 60px;
  left: 20px;
  z-index: 10;
  line-height: 1.5;
  max-width: calc(100% - 40px);
  font-weight: bold;
}

/* 没有标题的提示文字 - 用于分析卡片 */
.module-hint.no-title {
  top: 20px;
}

/* 没有标题的卡片内容 - 调整分析内容的上边距 */
.no-title-card .analysis-content {
  margin-top: 60px;
}

/* 分析内容样式 - 用于显示后端返回的分析内容 */
.analysis-content {
  width: 100%;
  min-height: 200px;
  padding: 20px;
  background-color: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color-dark);
  transition: all 0.3s ease;
  margin-top: 100px;
  align-self: center;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 加载状态 */
.loading {
  font-size: 16px;
  color: var(--primary-color);
  font-weight: 500;
}

/* 无数据状态 */
.no-data {
  font-size: 16px;
  color: var(--text-color-light);
  font-weight: 500;
}

/* 数据显示样式 */
.analysis-content pre {
  text-align: left;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
  width: 100%;
}

/* 学习仪表板样式 */
.study-dashboard {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.search-form {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-primary {
  padding: 8px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-primary:disabled {
  background-color: #c6e2ff;
  cursor: not-allowed;
}

.error-message {
  background-color: #fef0f0;
  color: #f56c6c;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.retry-btn {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.retry-btn:hover {
  background-color: #f78989;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  margin: 20px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(64, 158, 255, 0.2);
  border-radius: 50%;
  border-top-color: #409eff;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  color: var(--text-color-medium);
  font-size: 16px;
  margin: 0;
}

.statistics-card,
.suggestions-card {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 生成学习建议按钮容器 */
.generate-suggestion-container {
  text-align: center;
  padding: 40px 20px;
  margin-bottom: 20px;
}

/* 生成学习建议按钮 */
.generate-suggestion-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  outline: none;
  letter-spacing: 0.5px;
}

.generate-suggestion-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  transform: translateY(-2px);
}

.generate-suggestion-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.4);
}

.generate-suggestion-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.7;
}

/* 学习建议卡片标题 */
.suggestions-card h3 {
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  text-align: left;
  border-left: 4px solid #667eea;
  padding-left: 12px;
}

/* 学习建议列表 */
.suggestion-list {
  background-color: white;
  border-radius: 6px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 学习建议项 */
.suggestion-item {
  padding: 16px;
  margin-bottom: 12px;
  background-color: #f8f9ff;
  border-left: 4px solid #667eea;
  border-radius: 4px;
  line-height: 1.6;
  color: #333;
  font-size: 14px;
  transition: all 0.3s ease;
}

.suggestion-item:last-child {
  margin-bottom: 0;
}

.suggestion-item:hover {
  background-color: #eef0ff;
  transform: translateX(4px);
}

h3 {
  color: #333;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.distribution-section {
  margin-bottom: 20px;
}

h4 {
  color: #666;
  margin-bottom: 10px;
}

.distribution-list {
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.distribution-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.distribution-item:last-child {
  border-bottom: none;
}

/* 可视化图表模块 */
.visualization-module {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin-bottom: 20px;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}

/* 完成率进度条 */
.progress-bar-container {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-dark);
}

.progress-percentage {
  font-size: 14px;
  font-weight: bold;
  color: var(--primary-color);
}

.progress-bar {
  width: 100%;
  height: 12px;
  background-color: #f0f2f5;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

/* 图表容器 */
.charts-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.chart-item {
  flex: 1;
  min-height: 300px;
}

.chart-item h3 {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-dark);
  margin-bottom: 10px;
  text-align: center;
  /* 确保标题与下方图表水平中心对齐 */
  width: 100%;
  display: block;
}

.donut-chart,
.pie-chart {
  width: 100%;
  height: 280px;
}

/* 图表容器 */
.echarts-container {
  width: 100%;
  height: 100%;
  min-height: 260px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .charts-container {
    flex-direction: column;
  }

  .chart-item {
    min-height: 250px;
  }

  .donut-chart,
  .pie-chart {
    height: 230px;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  /* 平板端适配 */
  .nav-menu {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  /* 移动端适配 */
  .navbar-container {
    padding: 0 16px;
    height: 60px;
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-top: 1px solid #e5e7eb;
    padding: 16px;
    gap: 8px;
  }

  .nav-item {
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  /* 主体内容区适配 */
  .main-content {
    min-height: calc(100vh - 60px);
  }

  /* 侧边栏切换按钮 */
  .sidebar-toggle {
    display: block;
  }

  /* 左侧导航栏适配 */
  .sidebar {
    width: 280px;
    top: 60px;
    transform: translateX(0);
    z-index: 100;
  }

  /* 侧边栏折叠状态 */
  .sidebar-collapsed {
    transform: translateX(-100%);
  }

  /* 右侧内容区适配 */
  .content-area {
    margin-left: 0;
    padding: 10px;
  }

  /* 时间导航栏移动端适配 */
  .time-nav {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  .time-btn {
    padding: 10px 14px;
    font-size: 13px;
  }

  /* 内容卡片适配 */
  /* 自定义卡片移动端适配 */
  .custom-card {
    margin-bottom: 10px;
  }

  .card-content {
    padding: 15px;
    min-height: 250px;
  }

  /* 统计模块标题移动端适配 */
  .module-title {
    font-size: 16px;
  }

  /* 统计模块提示文字移动端适配 */
  .module-hint {
    font-size: 13px;
    padding: 8px;
    top: 55px;
    max-width: calc(100% - 30px);
    background-color: #fff;
    font-weight: bold;
  }

  /* 没有标题的提示文字移动端适配 */
  .module-hint.no-title {
    top: 20px;
  }

  /* 没有标题的卡片内容移动端适配 */
  .no-title-card .analysis-content {
    margin-top: 50px;
  }

  /* 分析内容移动端适配 */
  .analysis-content {
    padding: 15px;
    margin-top: 90px;
    min-height: 180px;
  }

  /* 图表容器移动端适配 */
  .echarts-container {
    min-height: 220px;
  }
}
</style>
