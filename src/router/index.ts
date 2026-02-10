import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import Logout from '@/views/Logout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/logout',
      name: 'Logout',
      component: Logout,
      meta: {
        requiresAuth: false,
        noCache: true,
      },
    },
    {
      path: '/index',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: {
        requiresAuth: false, // 首页不需要登录
      },
    },
    {
      path: '/',
      redirect: '/index',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: {
        requiresAuth: false,
        onlyGuest: true, // 只有未登录用户可以访问
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
      meta: {
        requiresAuth: false,
        onlyGuest: true, // 只有未登录用户可以访问
      },
    },
    {
      path: '/user-manage',
      name: 'user-manage',
      component: () => import('../views/UserManage.vue'),
      meta: {
        requiresAuth: true,
        requiresAdmin: true, // 需要管理员权限
      },
    },
    {
      path: '/ai/chat',
      name: 'smart-qa',
      component: () => import('../views/SmartQa.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/ai/study',
      name: 'personal-study-plan',
      component: () => import('../views/PersonalStudyPlan.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/ai/study/review',
      name: 'smart-review',
      component: () => import('../views/SmartReview.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/campus/analysis',
      name: 'campus-analysis',
      component: () => import('../views/StudyManagement.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/campus/advice',
      name: 'campus-advice',
      component: () => import('../views/StudyManagement.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/campus/library',
      name: 'library-status',
      component: () => import('../views/LibraryStatus.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/career/competitions',
      name: 'competition-management',
      component: () => import('../views/CompetitionManagement.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/career/competitions/:id',
      name: 'competition-detail',
      component: () => import('../views/CompetitionDetail.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/career/position',
      name: 'career-navigation',
      component: () => import('../views/CareerNavigation.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/career/pee',
      name: 'exam-support',
      component: () => import('../views/PostgraduateSupport.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/profile',
      name: 'user-center',
      component: () => import('../views/UserCenter.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    // 404路由
    {
      path: '/:pathMatch(.*)*',
      redirect: '/index',
    },
  ],
})

const publicPages = ['/login', '/register', '/index', '/', '/logout']

// 路由守卫
router.beforeEach(async (to, from, next) => {
  console.log('=== 路由守卫开始 ===')
  console.log('从:', from.path, '到:', to.path)

  // 获取用户store
  const userStore = useUserStore()

  // 强制执行状态检查
  userStore.forceCheckLoginStatus()

  // 获取当前状态
  const token = localStorage.getItem('userToken')
  const isLoggedIn = userStore.userState.isLoggedIn

  console.log('当前状态:', { token, isLoggedIn })

  // 检查是否是公开页面
  const isPublicPage = publicPages.includes(to.path)

  // 如果是公开页面
  if (isPublicPage) {
    // 如果已登录且访问登录/注册页面，重定向到首页
    if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
      console.log('已登录用户访问登录/注册页面，重定向到首页')
      // 强制跳转，不使用next()
      window.location.href = '/index'
      return
    }

    console.log('公开页面，允许访问')
    next()
    return
  }

  // 检查页面是否需要登录
  if (to.meta?.requiresAuth) {
    console.log('需要登录的页面，检查登录状态...')

    // 如果没有登录，重定向到登录页
    if (!isLoggedIn && !token) {
      console.log('未登录，重定向到登录页')

      // 保存当前页面路径，登录后可以跳转回来
      if (to.path !== '/login') {
        localStorage.setItem('redirectAfterLogin', to.fullPath)
      }

      // 强制跳转到登录页
      window.location.href = '/login'
      return
    }

    // 有token但store状态不对，尝试恢复
    if (token && !isLoggedIn) {
      console.log('有token但store未登录，尝试恢复...')
      const restored = userStore.restoreFromStorage()

      if (!restored) {
        console.log('恢复失败，重定向到登录页')
        localStorage.removeItem('userToken')
        localStorage.removeItem('userInfo')
        window.location.href = '/login'
        return
      }
    }

    // 检查管理员权限（如果需要）
    if (to.meta?.requiresAdmin) {
      const userRole = userStore.userState.userInfo?.role
      if (userRole !== 'admin') {
        console.log('权限不足，重定向到首页')
        next('/index')
        return
      }
    }

    console.log('登录检查通过，允许访问')
    next()
    return
  }

  // 其他页面直接放行
  console.log('其他页面，允许访问')
  next()
})

// 路由后置钩子
router.afterEach((to, from) => {
  console.log('路由跳转完成:', to.path)

  // 清除一些状态
  if (to.path === '/login') {
    // 每次访问登录页都强制检查状态
    const userStore = useUserStore()
    userStore.forceCheckLoginStatus()
  }
})

export default router
