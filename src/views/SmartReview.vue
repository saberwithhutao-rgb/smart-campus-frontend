<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useStudyPlanStore } from '../stores/studyPlan'

// 路由实例
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()

// 响应式数据 - 导航栏相关
const showUserCenter = ref(false) // 显示个人中心菜单
const activeMenu = ref('') // 当前激活的菜单
const showSubMenu = ref('') // 显示子菜单
const isMobile = ref(false) // 是否为移动端
const showSidebar = ref(true) // 是否显示侧边栏

// 学习计划store
const studyPlanStore = useStudyPlanStore()

// 使用store中的智能复习数据
const reviewItems = computed(() => studyPlanStore.reviewItems)

// 检查屏幕尺寸 - 响应式设计
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

// 导航栏菜单处理 - 完全复用首页导航栏交互
const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}

const goToSmartQA = () => {
  router.push('/ai/chat')
}

const goToStudyPlan = () => {
  router.push('/ai/study')
}

const goToStudyManagement = () => {
  router.push('/campus/analysis')
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
    router.push('/index')
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
    } else {
      hideSubMenu()
    }
  }
}

const handleUserMenuClick = (item: string) => {
  if (item === '个人信息') {
    router.push('/profile')
  } else if (item === '退出登录') {
    router.push('/login')
  }
  closeUserCenter()
}

// 跳转到智能复习页面
const goToSmartReview = () => {
  // 智能复习页面已在当前页面，无需跳转
  return
}

// 删除学习项
const deleteItem = (id: string) => {
  // 使用store的方法删除复习项
  studyPlanStore.deleteReviewItem(id)
}

// 生成复习计划
const generateReviewPlan = () => {
  // 收集所有被勾选的学习项
  const selectedItems = reviewItems.value.filter((item) => item && item.reviewed)

  if (selectedItems.length === 0) {
    alert('请至少选择一个要复习的学习项')
    return
  }

  // 模拟向后端发送请求
  alert(
    `正在生成复习计划，共选择了 ${selectedItems.length} 个学习项：\n${selectedItems.map((item) => item.question).join('\n')}`,
  )

  // 这里可以添加实际的API调用逻辑
  // 例如：
  // axios.post('/api/generate-review-plan', { items: selectedItems })
  //   .then(response => {
  //     // 处理后端返回的复习计划
  //     console.log('复习计划生成成功：', response.data)
  //     alert('复习计划生成成功！')
  //   })
  //   .catch(error => {
  //     console.error('生成复习计划失败：', error)
  //     alert('生成复习计划失败，请重试')
  //   })
}

// 切换侧边栏显示
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 生命周期钩子 - 初始化和窗口大小监听
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)

  // 初始化智能复习列表，从已完成的学习计划中生成
  studyPlanStore.initReviewItems()
})
</script>

<template>
  <div class="smart-qa-container">
    <!-- 顶部导航栏 - 完全复用首页导航栏（含所有交互） -->
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
              <div class="submenu-item" @click="goToStudyPlan">个性化规划</div>
            </div>
            <!-- 移动端子菜单 -->
            <div v-if="showSubMenu === '个性化学习伴侣' && isMobile" class="mobile-submenu">
              <div class="mobile-submenu-item" @click="goToSmartQA">智能问答</div>
              <div class="mobile-submenu-item" @click="goToStudyPlan">个性化规划</div>
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
              <div class="mobile-submenu-item">馆藏实况</div>
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
              <div class="submenu-item" @click="router.push('/career/competitions')">竞赛管理</div>
              <div class="submenu-item" @click="router.push('/career/position')">职业导航</div>
              <div class="submenu-item" @click="router.push('/career/pee')">考研支持</div>
            </div>
            <!-- 移动端子菜单 -->
            <div v-if="showSubMenu === '竞赛相关' && isMobile" class="mobile-submenu">
              <div class="mobile-submenu-item" @click="router.push('/career/competitions')">
                竞赛管理
              </div>
              <div class="mobile-submenu-item" @click="router.push('/career/position')">
                职业导航
              </div>
              <div class="mobile-submenu-item" @click="router.push('/career/pee')">考研支持</div>
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

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 移动端侧边栏切换按钮 -->
      <button class="sidebar-toggle" @click="toggleSidebar" v-if="isMobile">
        {{ showSidebar ? '关闭' : '打开' }}侧边栏
      </button>

      <!-- 左侧功能栏 -->
      <aside class="sidebar" :class="{ 'sidebar-collapsed': !showSidebar && isMobile }">
        <div class="sidebar-header">
          <h2 class="sidebar-title">学习规划</h2>
        </div>

        <div class="sidebar-menu">
          <!-- 学习计划选项 -->
          <div class="sidebar-item" @click="goToStudyPlan">学习计划</div>

          <!-- 智能复习选项 -->
          <div class="sidebar-item sidebar-item-active" @click="goToSmartReview">智能复习</div>
        </div>
      </aside>

      <!-- 中间智能复习区域 -->
      <main class="study-main">
        <!-- 智能复习区域 -->
        <div class="review-main">
          <h2 class="review-title">个性化智能复习</h2>

          <!-- 智能复习模块 -->
          <div class="review-section">
            <h3 class="section-title">已完成的学习计划</h3>

            <!-- 学习项列表 -->
            <div class="review-table">
              <!-- 表头 -->
              <div class="review-table-header">
                <div class="review-table-header-item">学习项名称</div>
                <div class="review-table-header-item">难度标识</div>
                <div class="review-table-header-item">时间</div>
                <div class="review-table-header-item">是否复习</div>
                <div class="review-table-header-item">操作</div>
              </div>

              <!-- 表格内容 -->
              <div class="review-table-body">
                <div v-for="item in reviewItems" :key="item.id" class="review-table-row">
                  <!-- 学习项名称 -->
                  <div class="review-table-cell">{{ item.question }}</div>

                  <!-- 难度标识 -->
                  <div class="review-table-cell">
                    <span
                      class="difficulty-tag"
                      :class="{
                        'difficulty-hard': item.difficulty === '难',
                        'difficulty-medium': item.difficulty === '中',
                        'difficulty-easy': item.difficulty === '易',
                      }"
                    >
                      {{ item.difficulty }}
                    </span>
                  </div>

                  <!-- 时间 -->
                  <div class="review-table-cell">{{ item.time }}</div>

                  <!-- 是否复习 -->
                  <div class="review-table-cell">
                    <input type="checkbox" v-model="item.reviewed" class="complete-checkbox" />
                  </div>

                  <!-- 操作 -->
                  <div class="review-table-cell">
                    <button class="delete-btn" @click="deleteItem(item.id)">删除</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 生成复习计划按钮 -->
            <div class="review-footer">
              <button class="generate-btn" @click="generateReviewPlan">生成复习计划</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 全局变量 */
:root {
  /* 主色调：科技蓝 */
  --primary-color: #165dff;
  --primary-color-dark: #0e46cc;
  --primary-color-light: #4c8aff;

  /* 辅助色：浅红色 */
  --accent-color: #f53f3f;
  --accent-color-dark: #e13d3d;
  --accent-color-light: #f76d6d;

  /* 背景色：浅灰色 */
  --bg-color: #f5f7fa;
  --bg-color-light: #fafafb;
  --bg-color-dark: #eef1f5;

  /* 文字主色：深灰色 */
  --text-color: #1d2129;
  --text-color-secondary: #4e5969;
  --text-color-light: #86909c;

  /* 边框和阴影 */
  --border-color: #e5e7eb;
  --border-color-light: #f0f2f5;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 圆角 */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* 过渡 */
  --transition: all 0.3s ease;
}

/* 继承自学习计划页面的样式 */
.smart-qa-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  display: flex;
  flex-direction: column;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  box-shadow: var(--shadow-sm);
  z-index: 100;
  height: 70px;
  border-bottom: 1px solid var(--border-color-light);
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

.logo {
  display: flex;
  align-items: center;
}

.logo-placeholder {
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: #fff;
  border-radius: var(--border-radius-md);
  font-size: 16px;
  font-weight: 600;
}

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
}

.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 12px 0;
  min-width: 160px;
  z-index: 200;
  animation: slideDown 0.2s ease;
  display: block;
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

.mobile-submenu {
  background-color: var(--bg-color-light);
  border-radius: var(--border-radius-md);
  margin-top: 8px;
  padding: 8px 0;
  display: block;
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
  color: #fff;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

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

.user-center-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
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
  color: var(--accent-color);
}

.dropdown-item.logout:hover {
  background-color: var(--accent-color);
  color: #fff;
}

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

.main-content {
  display: flex;
  flex: 1;
  margin-top: 70px;
  min-height: calc(100vh - 70px);
}

.sidebar-toggle {
  position: fixed;
  top: 80px;
  left: 10px;
  z-index: 98;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  cursor: pointer;
  display: none;
}

.sidebar {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid var(--border-color);
  padding: 20px 0;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
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

.study-main {
  flex: 1;
  background-color: var(--bg-color);
  padding: 20px;
  max-width: calc(100% - 280px);
  overflow-y: auto;
}

/* 智能复习页面特有样式 */
.review-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.review-section {
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid var(--border-color-light);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.sort-note {
  color: var(--accent-color);
  font-size: 14px;
  font-weight: 500;
}

/* 表格样式 */
.review-table {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.review-table-header {
  display: grid;
  grid-template-columns: 1fr 120px 120px 120px 100px;
  background-color: var(--bg-color-light);
  border-bottom: 1px solid var(--border-color);
}

.review-table-header-item {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  border-right: 1px solid var(--border-color);
}

.review-table-header-item:last-child {
  border-right: none;
}

.review-table-body {
  display: flex;
  flex-direction: column;
}

.review-table-row {
  display: grid;
  grid-template-columns: 1fr 120px 120px 120px 100px;
  border-bottom: 1px solid var(--border-color);
  transition: var(--transition);
}

.review-table-row:hover {
  background-color: var(--bg-color-light);
}

.review-table-row:last-child {
  border-bottom: none;
}

.review-table-cell {
  padding: 16px;
  font-size: 14px;
  color: var(--text-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.review-table-cell:last-child {
  border-right: none;
  justify-content: center;
}

/* 难度标签样式 */
.difficulty-tag {
  padding: 4px 12px;
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

.difficulty-hard {
  background-color: var(--accent-color);
}

.difficulty-medium {
  background-color: #f7ba1e;
}

.difficulty-easy {
  background-color: #52c41a;
}

/* 完成复选框 */
.complete-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color);
  margin: 0;
  padding: 0;
}

/* 是否复习列居中 */
.review-table-cell:nth-child(4) {
  justify-content: center;
}

/* 删除按钮 */
.delete-btn {
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  transition: var(--transition);
}

.delete-btn:hover {
  background-color: var(--accent-color-light);
  color: #fff;
}

/* 生成复习计划按钮 */
.review-footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.generate-btn {
  padding: 12px 32px;
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-md);
}

.generate-btn:hover {
  background-color: var(--primary-color-dark);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 1366px) {
  /* 笔记本端适配 */
  .sidebar {
    width: 240px;
  }

  .study-main {
    max-width: calc(100% - 240px);
  }
}

@media (max-width: 1024px) {
  /* 平板端适配 */
  .sidebar-toggle {
    display: block;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 70px;
    height: calc(100vh - 70px);
    z-index: 98;
    transform: translateX(0);
  }

  .study-main {
    max-width: 100%;
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

  .study-main {
    padding: 10px;
  }

  /* 表格在移动端改为垂直布局 */
  .review-table-header {
    display: none;
  }

  .review-table-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .review-table-cell {
    border-right: none;
    border-bottom: 1px solid var(--border-color-light);
    padding: 8px 0;
    justify-content: space-between;
  }

  .review-table-cell:last-child {
    border-bottom: none;
    justify-content: flex-start;
  }

  /* 移动端导航栏高度调整 */
  .navbar {
    height: 60px;
  }

  /* 移动端主内容区顶部边距调整 */
  .main-content {
    margin-top: 60px;
    min-height: calc(100vh - 60px);
  }

  /* 移动端侧边栏高度调整 */
  .sidebar {
    top: 60px;
    height: calc(100vh - 60px);
  }
}
</style>
