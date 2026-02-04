<template>
  <div class="competition-management">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="navbar-container">
        <!-- Logo区域 -->
        <div class="logo">
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
            <!-- 子菜单悬浮层 -->
            <div v-if="showSubMenu === '个性化学习伴侣' && !isMobile" class="submenu">
              <!-- 智能问答 - 点击跳转到智能问答页面 -->
              <div class="submenu-item" @click="goToSmartQA">智能问答</div>
              <!-- 个性化规划 - 点击跳转到个性化规划页面 -->
              <div class="submenu-item" @click="goToPersonalStudy">个性化规划</div>
            </div>
            <!-- 移动端子菜单 -->
            <div v-if="showSubMenu === '个性化学习伴侣' && isMobile" class="mobile-submenu">
              <!-- 智能问答 - 点击跳转到智能问答页面 -->
              <div class="mobile-submenu-item" @click="goToSmartQA">智能问答</div>
              <!-- 个性化规划 - 点击跳转到个性化规划页面 -->
              <div class="mobile-submenu-item" @click="goToPersonalStudy">个性化规划</div>
            </div>
          </div>

          <div
            class="nav-item has-submenu"
            @mouseenter="showSubMenuHandler('校园生活')"
            @mouseleave="hideSubMenu"
            @click="handleMenuClick('校园生活')"
          >
            校园生活
            <!-- 子菜单悬浮层 -->
            <div v-if="showSubMenu === '校园生活' && !isMobile" class="submenu">
              <div class="submenu-item" @click="goToStudyManagement">学习管理</div>
              <div class="submenu-item" @click="router.push('/campus/library')">馆藏实况</div>
            </div>
            <!-- 移动端子菜单 -->
            <div v-if="showSubMenu === '校园生活' && isMobile" class="mobile-submenu">
              <div class="mobile-submenu-item" @click="goToStudyManagement">学习管理</div>
              <div class="mobile-submenu-item" @click="router.push('/campus/library')">
                馆藏实况
              </div>
            </div>
          </div>

          <div
            class="nav-item has-submenu"
            @mouseenter="showSubMenuHandler('竞赛相关')"
            @mouseleave="hideSubMenu"
            @click="handleMenuClick('竞赛相关')"
          >
            竞赛相关
            <!-- 子菜单悬浮层 -->
            <div v-if="showSubMenu === '竞赛相关' && !isMobile" class="submenu">
              <div class="submenu-item" @click="goToCompetitionManagement">竞赛管理</div>
              <div class="submenu-item" @click="goToCareerNavigation">职业导航</div>
              <div class="submenu-item" @click="goToExamSupport">考研支持</div>
            </div>
            <!-- 移动端子菜单 -->
            <div v-if="showSubMenu === '竞赛相关' && isMobile" class="mobile-submenu">
              <div class="mobile-submenu-item" @click="goToCompetitionManagement">竞赛管理</div>
              <div class="mobile-submenu-item" @click="goToCareerNavigation">职业导航</div>
              <div class="mobile-submenu-item" @click="goToExamSupport">考研支持</div>
            </div>
          </div>
        </div>

        <!-- 右侧操作区 -->
        <div class="nav-actions">
          <!-- 登录按钮 - 未登录时显示 -->
          <button v-if="!userStore.userState.isLoggedIn" class="btn-login" @click="goToLogin">
            <span class="login-icon">👤</span>
            登录
          </button>

          <!-- 个人中心 -->
          <div class="user-center">
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

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧垂直导航栏 -->
      <aside class="sidebar">
        <div class="sidebar-menu">
          <!-- 竞赛管理 -->
          <div class="sidebar-section">
            <h3 class="section-title">竞赛相关</h3>
            <div class="sidebar-item active">
              <span class="item-icon">🏆</span>
              <span class="item-text">竞赛管理</span>
            </div>
            <div class="sidebar-item" @click="goToCareerNavigation">
              <span class="item-icon">🎯</span>
              <span class="item-text">职业导航</span>
            </div>
          </div>

          <!-- 考研支持 -->
          <div class="sidebar-section">
            <h3 class="section-title">考研支持</h3>
            <div class="sidebar-item" @click="goToExamSupport">
              <span class="item-icon">📖</span>
              <span class="item-text">考研支持</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容区 -->
      <main class="content-area">
        <!-- 页面标题 -->
        <h1 class="page-title">竞赛管理</h1>

        <!-- 筛选和搜索区 -->
        <div class="filter-section">
          <div class="filter-row">
            <!-- 竞赛类型筛选 -->
            <div class="filter-item">
              <span class="filter-label">竞赛类型:</span>
              <select class="filter-select">
                <option value="all">全部</option>
                <option value="programming">程序设计</option>
                <option value="math">数学建模</option>
                <option value="design">创意设计</option>
                <option value="other">其他</option>
              </select>
            </div>

            <!-- 状态筛选 -->
            <div class="filter-item">
              <span class="filter-label">状态:</span>
              <select class="filter-select">
                <option value="all">全部</option>
                <option value="ongoing">进行中</option>
                <option value="upcoming">即将开始</option>
                <option value="completed">已结束</option>
              </select>
            </div>

            <!-- 级别筛选 -->
            <div class="filter-item">
              <span class="filter-label">级别:</span>
              <select class="filter-select">
                <option value="all">全部</option>
                <option value="national">国家级</option>
                <option value="provincial">省级</option>
                <option value="school">校级</option>
              </select>
            </div>

            <!-- 搜索框 -->
            <div class="search-box">
              <input type="text" placeholder="搜索竞赛名称..." class="search-input" />
              <button class="search-btn">🔍</button>
            </div>
          </div>
        </div>

        <!-- 竞赛列表 -->
        <div class="competition-list">
          <!-- 竞赛项 -->
          <div class="competition-item" v-for="competition in competitions" :key="competition.id">
            <div class="competition-header">
              <div class="competition-info">
                <div class="competition-name">
                  <span class="competition-icon">{{ competition.icon }}</span>
                  <span class="competition-title">{{ competition.name }}</span>
                </div>
                <p class="competition-description">{{ competition.description }}</p>
              </div>
              <div class="competition-actions">
                <button class="btn-action primary" :disabled="competition.status === 'completed'">
                  {{
                    competition.status === 'completed'
                      ? '已结束'
                      : competition.status === 'ongoing'
                        ? '加入竞赛'
                        : '立即报名'
                  }}
                </button>
                <button class="btn-action secondary">
                  {{ competition.status === 'completed' ? '查看结果' : '查看详情' }}
                </button>
              </div>
            </div>
            <div class="competition-meta">
              <div class="meta-item">
                <span class="meta-value">{{ competition.time }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-value">{{ competition.duration }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-value">{{ competition.location }}</span>
              </div>
              <div class="meta-tags">
                <span class="tag" v-for="tag in competition.tags" :key="tag">{{ tag }}</span>
                <span class="tag" :class="competition.status">{{ competition.statusText }}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
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

// 响应式数据 - 导航栏相关
const showUserCenter = ref(false) // 显示个人中心菜单
const activeMenu = ref('') // 当前激活的菜单
const showSubMenu = ref('') // 显示子菜单
const isMobile = ref(false) // 是否为移动端

// 竞赛数据
const competitions = ref([
  {
    id: 1,
    icon: '<>/',
    name: '全国大学生程序设计竞赛',
    description: 'ACM-ICPC风格的编程竞赛，面向全国大学生开放，提供个人和团队两种参赛模式',
    time: '2023-12-15',
    duration: '3小时',
    location: '线上/线下',
    tags: ['编程语言', '团队赛'],
    status: 'ongoing',
    statusText: '进行中',
  },
  {
    id: 2,
    icon: '📊',
    name: '全国大学生数学建模竞赛',
    description: '运用数学模型解决实际问题的团队竞赛，培养创新思维和团队协作能力',
    time: '2024-09-15',
    duration: '72小时',
    location: '线上',
    tags: ['数学建模', '团队赛'],
    status: 'upcoming',
    statusText: '即将开始',
  },
  {
    id: 3,
    icon: '💡',
    name: '大学生创意设计大赛',
    description: '展示创意设计能力的综合性竞赛，涵盖平面设计、产品设计等多个方向',
    time: '2023-11-20',
    duration: '1个月',
    location: '线上',
    tags: ['设计竞赛', '个人赛'],
    status: 'completed',
    statusText: '已结束',
  },
  {
    id: 4,
    icon: '🔧',
    name: '电子设计竞赛',
    description: '面向电子工程学生的实践竞赛，培养电子设计和创新能力',
    time: '2024-05-20',
    duration: '4天3夜',
    location: '线下',
    tags: ['电子电路', '团队赛'],
    status: 'upcoming',
    statusText: '即将开始',
  },
])

// 检查屏幕尺寸 - 响应式设计
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

// 导航栏菜单处理
const goToIndex = () => {
  router.push('/index')
}

const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}

const goToSmartQA = () => {
  router.push('/ai/chat')
}

const goToPersonalStudy = () => {
  router.push('/ai/study')
}

const goToStudyManagement = () => {
  router.push('/campus/analysis')
}

const goToCompetitionManagement = () => {
  router.push('/career/competitions')
}

// 跳转到职业导航页面
const goToCareerNavigation = () => {
  router.push('/career/position')
}

// 跳转到考研支持页面
const goToExamSupport = () => {
  router.push('/career/pee')
}

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

// 处理弹出提示
const showAlert = (message: string) => {
  alert(message)
}

const handleUserMenuClick = (item: string) => {
  if (item === '个人信息') {
    router.push('/profile')
  } else if (item === '退出登录') {
    router.push('/login')
  }
  closeUserCenter()
}

// 生命周期钩子 - 初始化和窗口大小监听
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
/* 主容器 */
.competition-management {
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
  background-color: var(--white);
  box-shadow: var(--shadow-sm);
  z-index: 100;
  border-bottom: 1px solid var(--border-color-light);
}

.navbar-container {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
}

/* Logo区域 */
.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo-placeholder {
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: var(--white);
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

/* 子菜单悬浮层 */
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
}

.mobile-submenu-item {
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
}

.mobile-submenu-item:hover {
  background-color: var(--primary-color);
  color: var(--white);
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
  background-color: var(--primary-color);
  color: var(--white);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
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
  color: var(--white);
}

.dropdown-item.logout {
  color: var(--accent-color);
}

.dropdown-item.logout:hover {
  background-color: var(--accent-color);
  color: var(--white);
}

/* 响应式设计 */
@media (max-width: 768px) {
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
    background-color: var(--white);
    box-shadow: var(--shadow-lg);
    border-top: 1px solid var(--border-color-light);
    padding: 16px;
    gap: 8px;
  }

  .nav-item {
    padding: 12px 16px;
    border-radius: var(--border-radius-md);
    border: 1px solid var(--border-color-light);
  }
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

/* 主体内容区 */
.main-content {
  display: flex;
  flex: 1;
  margin-top: 60px;
  position: relative;
}

/* 左侧垂直导航栏 */
.sidebar {
  width: 220px;
  background-color: white;
  border-right: 1px solid #e0e6ed;
  padding: 20px 0;
  height: calc(100vh - 60px);
  overflow-y: auto;
  position: fixed;
  left: 0;
  top: 60px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.sidebar-menu {
  padding: 0 16px;
}

.sidebar-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #646b7a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding: 0 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #333;
}

.sidebar-item:hover {
  background-color: #f0f9ff;
  color: #409eff;
}

.sidebar-item.active {
  background-color: #f0f9ff;
  color: #409eff;
  font-weight: 500;
}

.item-icon {
  font-size: 16px;
}

/* 右侧主内容区 */
.content-area {
  margin-left: 220px;
  flex: 1;
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

/* 页面标题 */
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
}

/* 筛选和搜索区 */
.filter-section {
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #646b7a;
  font-weight: 500;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:hover {
  border-color: #409eff;
}

/* 搜索框 */
.search-box {
  display: flex;
  gap: 0;
  margin-left: auto;
}

.search-input {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
  color: #333;
  width: 200px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
}

.search-btn {
  padding: 6px 12px;
  background-color: #409eff;
  color: white;
  border: 1px solid #409eff;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.search-btn:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

/* 竞赛列表 */
.competition-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.competition-item {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.competition-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.competition-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.competition-info {
  flex: 1;
  min-width: 0;
}

.competition-name {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.competition-icon {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.competition-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.competition-description {
  font-size: 14px;
  color: #646b7a;
  margin: 0;
  line-height: 1.5;
}

.competition-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-action {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.btn-action.primary {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.btn-action.primary:hover:not(:disabled) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.btn-action.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #c0c4cc;
  border-color: #c0c4cc;
  color: white;
}

.btn-action.secondary {
  background-color: transparent;
  color: #646b7a;
  border-color: #dcdfe6;
}

.btn-action.secondary:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
}

/* 竞赛元信息 */
.competition-meta {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #646b7a;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-value {
  color: #646b7a;
}

.meta-tags {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: #ecf5ff;
  color: #409eff;
}

.tag.ongoing {
  background-color: #f0f9eb;
  color: #67c23a;
}

.tag.upcoming {
  background-color: #ecf5ff;
  color: #409eff;
}

.tag.completed {
  background-color: #f5f7fa;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }

  .content-area {
    margin-left: 200px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 99;
  }

  .content-area {
    margin-left: 0;
    padding: 16px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-box {
    margin-left: 0;
  }

  .competition-header {
    flex-direction: column;
    gap: 16px;
  }

  .competition-actions {
    flex-direction: row;
  }

  .competition-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .meta-tags {
    margin-left: 0;
  }
}
</style>
