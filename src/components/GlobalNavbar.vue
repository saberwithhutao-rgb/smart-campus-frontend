<!-- components/GlobalNavbar.vue -->
<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo区域 -->
      <div class="logo" @click="goToIndex">
        <img src="/src/img/logo_xr.png" alt="智慧校园" class="logo-image" />
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
          :class="{ 'has-badge': parentBadge }"
          @mouseenter="showSubMenuHandler('个性化学习伴侣')"
          @mouseleave="hideSubMenu"
          @click="handleMenuClick('个性化学习伴侣')"
        >
          个性化学习伴侣
          <BadgeDot :show="parentBadge" :max-number="false" />

          <!-- 子菜单 -->
          <div v-if="showSubMenu === '个性化学习伴侣' && !isMobile" class="submenu">
            <div class="submenu-item" @click="goToSmartQA">智能问答</div>
            <div class="submenu-item submenu-item-with-badge" @click="goToPersonalStudy">
              个性化规划
              <BadgeDot :show="personalPlanBadge" :max-number="false" />
            </div>
            <div class="submenu-item" @click="goToStudyManagement">学习管理</div>
          </div>

          <!-- 移动端子菜单 -->
          <div v-if="showSubMenu === '个性化学习伴侣' && isMobile" class="mobile-submenu">
            <div class="mobile-submenu-item" @click="goToSmartQA">智能问答</div>
            <div class="mobile-submenu-item submenu-item-with-badge" @click="goToPersonalStudy">
              个性化规划
              <BadgeDot :show="personalPlanBadge" :max-number="false" />
            </div>
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
            <div class="submenu-item" @click="goToLibraryReservation">图书馆预约</div>
            <div class="submenu-item" @click="goToSportsReservation">体育馆预约</div>
            <div class="submenu-item" @click="goToSecondHandMarket">校园论坛</div>
          </div>
          <div v-if="showSubMenu === '校园生活' && isMobile" class="mobile-submenu">
            <div class="mobile-submenu-item" @click="goToLibraryReservation">图书馆预约</div>
            <div class="mobile-submenu-item" @click="goToSportsReservation">体育馆预约</div>
            <div class="mobile-submenu-item" @click="goToSecondHandMarket">校园论坛</div>
          </div>
        </div>

        <div class="nav-item" @click="goToCompetitionManagement">竞赛管理</div>

        <div
          class="nav-item has-submenu"
          @mouseenter="showSubMenuHandler('职业导航')"
          @mouseleave="hideSubMenu"
          @click="handleMenuClick('职业导航')"
        >
          职业导航
          <div v-if="showSubMenu === '职业导航' && !isMobile" class="submenu">
            <div class="submenu-item" @click="goToAiCareerInfo">AI职业资讯</div>
            <div class="submenu-item" @click="goToCareerDirections">热门职业方向</div>
            <div class="submenu-item" @click="goToCareerNews">职业资讯</div>
          </div>
          <div v-if="showSubMenu === '职业导航' && isMobile" class="mobile-submenu">
            <div class="mobile-submenu-item" @click="goToAiCareerInfo">AI职业资讯</div>
            <div class="mobile-submenu-item" @click="goToCareerDirections">热门职业方向</div>
            <div class="mobile-submenu-item" @click="goToCareerNews">职业资讯</div>
          </div>
        </div>

        <div class="nav-item" @click="goToExamSupport">考研支持</div>

        <button class="btn-search" @click="goToFunctionSearch" title="功能搜索">🔍</button>
      </div>

      <!-- 右侧操作区 -->
      <div class="nav-actions">
        <button v-if="!hasToken" class="btn-login" @click="goToLogin">
          <span class="login-icon">👤</span>
          登录
        </button>

        <div v-if="hasToken" class="user-center">
          <button class="btn-user-center" @click="toggleUserCenter">个人中心</button>
          <div v-if="showUserCenter" class="user-center-dropdown">
            <div class="dropdown-item" @click="handleUserMenuClick('个人信息')">个人信息</div>
            <div class="dropdown-item" @click="handleUserMenuClick('设置')">设置</div>
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
import { STORAGE_KEYS } from '@/utils/storageKeys'
import BadgeDot from '@/components/BadgeDot.vue'
import { useReviewReminder } from '@/composables/useReviewReminder'

const router = useRouter()
const userStore = useUserStore()
const reminder = useReviewReminder()
const smartReviewBadge = computed(() => reminder.showRedDot.value)
const personalPlanBadge = computed(() => smartReviewBadge.value)
const parentBadge = computed(() => personalPlanBadge.value)
// 响应式数据
const showUserCenter = ref(false)
const activeMenu = ref('')
const showSubMenu = ref('')
const isMobile = ref(false)

const hasToken = computed(() => {
  const token =
    localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN_ALT)
  return userStore.userState.isLoggedIn && !!token
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
const goToExamSupport = () => router.push('/career/pee')
const goToLibraryReservation = () => router.push('/campus/library-reservation')
const goToSportsReservation = () => router.push('/campus/sports-reservation')
const goToSecondHandMarket = () => router.push('/campus/secondhand-market')
const goToAiCareerInfo = () => {
  router.push({ path: '/career/position', query: { section: 'ai' } })
}
const goToCareerDirections = () => {
  router.push({ path: '/career/position', query: { section: 'direction' } })
}
const goToCareerNews = () => {
  router.push({ path: '/career/position', query: { section: 'news' } })
}

const goToFunctionSearch = () => {
  router.push('/function-search')
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
    if (['个性化学习伴侣', '校园生活', '职业导航'].includes(menu)) {
      showSubMenuHandler(menu)
      activeMenu.value = menu
    } else {
      hideSubMenu()
      activeMenu.value = ''
    }
  }
}

// 处理用户菜单点击 - 退出登录
const handleUserMenuClick = (item: string) => {
  if (item === '个人信息') {
    router.push('/profile')
  } else if (item === '设置') {
    router.push('/settings')
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

        ElMessage.success('退出登录成功')

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

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
/* 顶部导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--color-bg-card);
  box-shadow: var(--shadow-sm);
  z-index: 100;
  height: 70px;
  border-bottom: 1px solid var(--color-border-light);
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
  height: 60px;
}

.logo:hover {
  opacity: 0.85;
}

.logo-image {
  height: 100%;
  width: auto;
  max-height: 55px;
  object-fit: contain;
  background-color: transparent;
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
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--radius-md);
}

.nav-item:hover {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.nav-item.active {
  color: var(--color-primary);
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
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 12px 0;
  min-width: 160px;
  z-index: 200;
  animation: slideDown 0.2s ease;
}

.submenu-item {
  padding: 12px 20px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: var(--color-bg-light);
  color: var(--color-primary);
}

/* 移动端子菜单 */
.mobile-submenu {
  background-color: var(--color-bg-light);
  border-radius: var(--radius-md);
  margin-top: 8px;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}

.mobile-submenu-item {
  padding: 10px 20px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--radius-md);
}

.mobile-submenu-item:hover {
  background-color: var(--color-primary);
  color: var(--color-bg-card);
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
  background-color: var(--color-primary);
  color: #fff;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
}

.btn-login:hover {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
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
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
}

.btn-user-center:hover {
  background-color: var(--color-bg-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 个人中心下拉菜单 */
.user-center-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 8px 0;
  min-width: 140px;
  z-index: 200;
  margin-top: 8px;
}

.dropdown-item {
  padding: 12px 20px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition);
}

.dropdown-item:hover {
  background-color: var(--color-bg-light);
  color: var(--color-primary);
}

.dropdown-item.register {
  color: var(--color-primary);
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.dropdown-item.register:hover {
  background-color: var(--color-primary);
  color: #fff;
}

.dropdown-item.logout {
  color: var(--color-danger);
}

.dropdown-item.logout:hover {
  background-color: var(--color-danger);
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

/* 侧边栏切换按钮 */
.sidebar-toggle {
  position: fixed;
  top: 80px;
  left: 10px;
  z-index: 99;
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  display: none;
}

/* 左侧功能栏 */
.sidebar {
  width: 280px;
  background-color: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
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
  border-bottom: 1px solid var(--color-border-light);
}

.sidebar-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--color-text);
  margin: 0;
}

.sidebar-menu {
  margin-top: 20px;
}

.sidebar-item {
  padding: 16px 20px;
  font-size: 16px;
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition);
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background-color: var(--color-bg-light);
  color: var(--color-primary);
}

.sidebar-item-active {
  background-color: var(--color-bg-light);
  color: var(--color-primary) !important;
  border-left-color: var(--color-primary);
  font-weight: 500;
}

.btn-search {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: transparent;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-search:hover {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  transform: scale(1.05);
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
  background-color: var(--color-bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.time-btn {
  flex: 1;
  padding: 12px 16px;
  background-color: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition);
}

.time-btn:hover {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.time-btn.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 4px var(--color-primary-light);
}

/* 红点样式 */
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
}

.submenu-item-with-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.submenu-item-with-badge .badge-dot {
  margin-left: 8px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .nav-menu {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .navbar {
    height: 60px;
  }

  .logo {
    height: 45px;
  }

  .logo-image {
    max-height: 42px;
  }

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
    background-color: var(--color-bg-card);
    box-shadow: var(--shadow-lg);
    border-top: 1px solid var(--color-border);
    padding: 16px;
    gap: 8px;
  }

  .nav-item {
    padding: 12px 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }

  .sidebar-toggle {
    display: block;
  }

  .sidebar {
    width: 280px;
    top: 60px;
    transform: translateX(0);
    z-index: 100;
  }

  .sidebar-collapsed {
    transform: translateX(-100%);
  }

  .content-area {
    margin-left: 0;
    padding: 10px;
  }

  .time-nav {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  .time-btn {
    padding: 10px 14px;
    font-size: 13px;
  }
}
</style>
