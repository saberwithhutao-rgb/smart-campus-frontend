<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const appReady = ref(false) // 新增：应用是否就绪

// 全局状态检查函数
function globalAuthCheck() {
  const token = localStorage.getItem('userToken')
  const isLoggedIn = userStore.userState.isLoggedIn

  console.log('🔍 全局状态检查:', { token, isLoggedIn })

  if (!token && isLoggedIn) {
    console.log('⚠️ 检测到状态异常: 无token但显示已登录，修正状态')
    userStore.userState.isLoggedIn = false
    userStore.userState.userInfo = null
  }

  // 如果store未登录但有token，尝试恢复
  if (token && !isLoggedIn) {
    console.log('🔄 有token但store未登录，尝试恢复状态')
    userStore.restoreFromStorage()
  }
}

// 页面加载的时段问候提示功能
const showGreetingMessage = () => {
  const GREETING_KEY = 'system_greeting_shown'
  const hasShownGreeting = localStorage.getItem(GREETING_KEY)

  if (!hasShownGreeting) {
    const now = new Date()
    const hour = now.getHours()

    // 根据时段显示不同的问候
    let message = ''
    let type: 'success' | 'warning' | 'info' = 'info'

    if (4 <= hour && hour < 6) {
      message = '凌晨好，新的一天即将开始~'
      type = 'info'
    } else if (hour < 12) {
      message = '早上好，祝您有美好的一天！'
      type = 'success'
    } else if (hour < 18) {
      message = '下午好，工作学习辛苦了~'
      type = 'info'
    } else if (hour < 22) {
      message = '晚上好，享受您的休闲时光~'
      type = 'success'
    } else {
      message = '夜深了，注意休息哦~'
      type = 'warning'
    }

    // 显示问候
    ElMessage({
      message,
      type,
      duration: 3000,
      showClose: true,
    })

    // 使用更安全的键名保存状态
    localStorage.setItem(GREETING_KEY, 'true')

    // 设置过期时间（当天有效）
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0)
    const expires = tomorrow.getTime()
    localStorage.setItem(`${GREETING_KEY}_expires`, expires.toString())
  } else {
    // 检查是否过期（跨天了）
    const expiresStr = localStorage.getItem(`${GREETING_KEY}_expires`)
    if (expiresStr) {
      const expires = parseInt(expiresStr)
      if (Date.now() > expires) {
        localStorage.removeItem(GREETING_KEY)
        localStorage.removeItem(`${GREETING_KEY}_expires`)
        showGreetingMessage()
      }
    }
  }
}

// Storage事件处理函数
const handleStorageChange = (e: StorageEvent) => {
  console.log('📡 Storage事件:', e.key, e.oldValue, '→', e.newValue)

  if (e.key === 'userToken') {
    if (!e.newValue) {
      console.log('🗑️ 检测到token被清除，同步状态')
      userStore.userState.isLoggedIn = false
      userStore.userState.userInfo = null

      // 如果不是在登录页，跳转到登录页
      if (!router.currentRoute.value.path.includes('/login')) {
        console.log('重定向到登录页')
        router.replace('/login')
      }
    } else if (e.newValue && e.newValue !== e.oldValue) {
      console.log('🔄 检测到token变化，恢复状态')
      userStore.restoreFromStorage()
    }
  }
}

// 全局路由守卫
router.beforeEach((to, from, next) => {
  console.log('🚦 路由守卫: ', from.path, '→', to.path)

  // 公开页面列表（不需要登录）
  const publicPages = ['/login', '/register', '/index', '/']

  // 如果是公开页面，直接放行
  if (publicPages.includes(to.path)) {
    // 如果已登录且访问登录页，重定向到首页
    if ((to.path === '/login' || to.path === '/register') && userStore.userState.isLoggedIn) {
      console.log('已登录用户访问登录页，重定向到首页')
      next('/index')
      return
    }
    next()
    return
  }

  // 检查登录状态
  const token = localStorage.getItem('userToken')
  if (!token) {
    console.log('❌ 未登录，重定向到登录页')
    next('/login')
    return
  }

  // 有token但store状态不对，尝试恢复
  if (!userStore.userState.isLoggedIn) {
    console.log('🔄 有token但store未登录，尝试恢复')
    userStore.restoreFromStorage()
  }

  next()
})

router.afterEach((to) => {
  console.log('✅ 路由跳转完成: ', to.path)

  // 访问登录页时强制检查状态
  if (to.path === '/login') {
    globalAuthCheck()
  }
})

// 页面首次加载时触发
onMounted(async () => {
  console.log('🚀 App.vue 挂载')

  // 显示加载动画
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: '正在初始化...',
    background: 'rgba(0, 0, 0, 0.7)',
    spinner: 'el-icon-loading',
  })

  try {
    // 尝试自动登录（如果userStore有tryAutoLogin方法）
    if (!userStore.userState.isLoggedIn && userStore.tryAutoLogin) {
      console.log('尝试自动登录...')
      await userStore.tryAutoLogin()
    }

    // 初始状态检查
    globalAuthCheck()

    // 显示问候
    showGreetingMessage()
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    // 关闭加载动画
    loadingInstance.close()
    // 标记应用就绪
    appReady.value = true
  }

  // 添加storage事件监听（跨标签页同步）
  window.addEventListener('storage', handleStorageChange)

  // 添加全局错误处理
  window.addEventListener('error', (event) => {
    console.error('🌐 全局错误:', event.error)
  })
})

// 清理事件监听
onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<template>
  <!-- 加载中显示 -->
  <div v-if="!appReady" class="app-loading">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <div class="loading-text">智慧校园平台正在初始化...</div>
    </div>
  </div>

  <!-- 就绪后显示正常内容 -->
  <router-view v-else />
</template>

<style>
/* 全局样式 - 数字孪生智慧校园主题 */
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

  /* 边框色 */
  --border-color: #e5e6eb;
  --border-color-light: #f2f3f5;

  /* 白色 */
  --white: #ffffff;

  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.15);

  /* 圆角 */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* 过渡动画 */
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    'Microsoft YaHei',
    '微软雅黑',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
  font-size: 14px;
  font-weight: 400;
}

/* 全局按钮样式 */
button {
  font-family: 'Microsoft YaHei', '微软雅黑', inherit;
  font-size: inherit;
  cursor: pointer;
  border: none;
  outline: none;
  transition: var(--transition);
  border-radius: var(--border-radius-md);
  padding: 12px 20px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 全局输入框样式 */
input[type='text'],
input[type='password'],
input[type='email'],
select,
textarea {
  font-family: 'Microsoft YaHei', '微软雅黑', inherit;
  font-size: 14px;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background-color: var(--white);
  color: var(--text-color);
  transition: var(--transition);
  width: 100%;
}

input[type='text']:focus,
input[type='password']:focus,
input[type='email']:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
}

input[type='text']::placeholder,
input[type='password']::placeholder,
input[type='email']::placeholder,
textarea::placeholder {
  color: var(--text-color-light);
}

/* 全局标题样式 */
h1,
h2,
h3,
h4,
h5,
h6 {
  color: var(--text-color);
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  font-family: 'Microsoft YaHei', '微软雅黑', inherit;
}

h1 {
  font-size: 48px;
  font-weight: 700; /* 微软雅黑 Bold */
}

h2 {
  font-size: 32px;
}

h3 {
  font-size: 24px;
}

h4 {
  font-size: 18px;
}

h5 {
  font-size: 16px;
}

h6 {
  font-size: 14px;
}

/* 全局链接样式 */
a {
  color: var(--primary-color);
  text-decoration: none;
  transition: var(--transition);
}

a:hover {
  color: var(--primary-color-dark);
  text-decoration: underline;
}

/* 全局卡片样式 */
.card {
  background-color: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 24px;
  transition: var(--transition);
  border: 1px solid var(--border-color-light);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* 全局容器样式 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 悬浮效果 */
.hover-lift {
  transition: var(--transition);
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* 按钮变体 */
.btn-primary {
  background-color: var(--primary-color);
  color: var(--white);
  border: 1px solid var(--primary-color);
}

.btn-primary:hover {
  background-color: var(--primary-color-dark);
  border-color: var(--primary-color-dark);
}

.btn-accent {
  background-color: var(--accent-color);
  color: var(--white);
  border: 1px solid var(--accent-color);
}

.btn-accent:hover {
  background-color: var(--accent-color-dark);
  border-color: var(--accent-color-dark);
}

.btn-outline {
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: var(--white);
}

/* 模态框遮罩 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background-color: var(--white);
  border-radius: var(--border-radius-lg);
  padding: 32px;
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

.app-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

.loading-text {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 1px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 你原有的其他样式保持不变 */
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

  /* 边框色 */
  --border-color: #e5e6eb;
  --border-color-light: #f2f3f5;

  /* 白色 */
  --white: #ffffff;

  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.15);

  /* 圆角 */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* 过渡动画 */
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    'Microsoft YaHei',
    '微软雅黑',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
  font-size: 14px;
  font-weight: 400;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  h1 {
    font-size: 36px;
  }

  h2 {
    font-size: 28px;
  }

  h3 {
    font-size: 20px;
  }

  .card {
    padding: 20px;
  }

  .container {
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 28px;
  }

  .modal-content {
    padding: 24px;
  }
}
</style>
