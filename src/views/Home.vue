<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

// 路由实例
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()

// 响应式数据
const showUserCenter = ref(false) // 显示个人中心菜单
const activeMenu = ref('') // 当前激活的菜单
const showSubMenu = ref('') // 显示子菜单
const isMobile = ref(false) // 移动端标识

// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768
}

// 跳转登录页面
const goToLogin = () => {
  router.push('/login')
}

// 跳转注册页面
const goToRegister = () => {
  router.push('/register')
}

// 跳转到智能问答页面
const goToSmartQA = () => {
  router.push('/ai/chat')
}

// 跳转到个性化规划页面
const goToPersonalStudy = () => {
  router.push('/ai/study')
}

// 跳转到学习管理页面
const goToStudyManagement = () => {
  router.push('/campus/analysis')
}

// 跳转到竞赛管理页面
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

// 跳转到图书馆馆藏实况页面
const goToLibraryStatus = () => {
  router.push('/campus/library')
}

// 切换个人中心菜单
const toggleUserCenter = () => {
  showUserCenter.value = !showUserCenter.value
}

// 关闭个人中心菜单
const closeUserCenter = () => {
  showUserCenter.value = false
}

// 鼠标悬浮子菜单
const showSubMenuHandler = (menu: string) => {
  if (!isMobile.value) {
    showSubMenu.value = menu
  }
}

// 隐藏子菜单
const hideSubMenu = () => {
  showSubMenu.value = ''
}

// 处理登录
const handleLogin = async () => {
  try {
    // 正确的调用方式：传入4个单独参数
    const result = await userStore.login(
      'testuser123', // username
      '123456', // password
      '123456', // captcha
      'test', // captchaId（可选）
    )

    if (result.success) {
      alert('登录成功！')
      // 根据用户角色跳转到相应页面
      const user = userStore.userState.userInfo
      if (user?.role === 'admin') {
        router.push('/user-manage')
      } else {
        router.push('/') // 跳转到首页
      }
    }
  } catch (error) {
    alert('登录失败，请检查用户名和密码')
  }
}

// 菜单点击处理
const handleMenuClick = (menu: string) => {
  if (isMobile.value) {
    if (showSubMenu.value === menu) {
      showSubMenu.value = ''
    } else {
      showSubMenu.value = menu
    }
  } else {
    // 桌面端显示子菜单
    if (['个性化学习伴侣', '校园生活', '竞赛相关'].includes(menu)) {
      showSubMenuHandler(menu)
    } else {
      // 其他菜单项点击处理
      if (menu === '首页') {
        // 当前页面，无需跳转
        hideSubMenu()
      } else {
        alert(`${menu}功能开发中...`)
        hideSubMenu()
      }
    }
  }
}

// 个人中心菜单项点击
const handleUserMenuClick = (item: string) => {
  if (item === '个人信息') {
    router.push('/profile')
  } else if (item === '退出登录') {
    router.push('/login')
  }
  closeUserCenter()
}

// 监听窗口大小变化
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})
</script>

<template>
  <div class="smart-campus-home">
    <!-- 顶部导航栏 -->
    <GlobalNavbar />

    <!-- 主视觉区 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">数字孪生 智慧校园</h1>
      </div>
    </section>

    <!-- 底部功能模块区 -->
    <section class="features-section">
      <div class="features-container">
        <!-- 学习模块 - 点击跳转到智能问答页面 -->
        <div class="feature-card learning-card hover-lift" @click="goToSmartQA">
          <div class="card-icon">📚</div>
          <h3 class="card-title">学习模块</h3>
          <p class="card-description">数智孪生助学</p>
          <p class="card-details">个性计划+AI高效备考</p>
        </div>

        <!-- 生活模块 -->
        <div class="feature-card life-card hover-lift" @click="goToStudyManagement">
          <div class="card-icon">🏠</div>
          <h3 class="card-title">生活模块</h3>
          <p class="card-description">孪生校园智管</p>
          <p class="card-details">行为监测健康/图书馆服务</p>
        </div>

        <!-- 竞赛模块 -->
        <div class="feature-card competition-card hover-lift" @click="goToCompetitionManagement">
          <div class="card-icon">🏆</div>
          <h3 class="card-title">竞赛模块</h3>
          <p class="card-description">数字赋能竞赛</p>
          <p class="card-details">信息匹配+科研复试</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 主容器 */
.smart-campus-home {
  min-height: 100vh;
  background-color: var(--bg-color);
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
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
  max-width: 1200px;
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

/* 主视觉区 */
.hero-section {
  padding: 140px 20px 80px;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--primary-color-light) 50%,
    #1e3a8a 100%
  );
  color: var(--white);
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  max-width: 800px;
  text-align: center;
}

.hero-title {
  font-size: 80px;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  letter-spacing: 2px;
  animation: fadeInUp 0.8s ease;
}

/* 底部功能模块区 */
.features-section {
  padding: 80px 20px;
  background: linear-gradient(180deg, var(--bg-color) 0%, #f8fafc 100%);
  position: relative;
}

.features-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--primary-color-light) 50%,
    transparent 100%
  );
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.feature-card {
  background-color: var(--white);
  border-radius: var(--border-radius-xl);
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(22, 93, 255, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(22, 93, 255, 0.05), transparent);
  transition: left 0.5s;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.feature-card:hover::before {
  left: 100%;
}

.card-icon {
  font-size: 48px;
  margin-bottom: 24px;
}

.card-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--accent-color);
  margin-bottom: 16px;
}

.card-description {
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 12px;
}

.card-details {
  font-size: 14px;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

/* 登录弹窗样式 */
.modal-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 24px;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.form-group input {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  transition: var(--transition);
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel {
  flex: 1;
  padding: 12px 20px;
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
}

.btn-cancel:hover {
  background-color: var(--bg-color-light);
}

.btn-login-submit {
  flex: 1;
  padding: 12px 20px;
  background-color: var(--primary-color);
  color: var(--white);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
}

.btn-login-submit:hover {
  background-color: var(--primary-color-dark);
  border-color: var(--primary-color-dark);
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

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
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

  .hero-section {
    padding: 120px 16px 60px;
  }

  .hero-title {
    font-size: 56px;
  }

  .features-section {
    padding: 60px 16px;
  }

  .features-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .feature-card {
    padding: 32px 24px;
  }

  .card-title {
    font-size: 20px;
  }

  .nav-actions {
    gap: 12px;
  }

  .btn-login,
  .btn-user-center {
    padding: 8px 16px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 48px;
  }

  .feature-card {
    padding: 24px 20px;
  }

  .card-icon {
    font-size: 40px;
  }
}
</style>
