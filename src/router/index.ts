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

// 公开页面列表（不需要登录）
const publicPages = ['/login', '/register', '/index', '/', '/logout']

// 路由守卫
router.beforeEach(async (to, from, next) => {
  console.log('路由导航:', {
    from: from.path,
    to: to.path,
    requiresAuth: to.meta?.requiresAuth,
  })

  // 获取用户store
  const userStore = useUserStore()

  // 检查是否是公开页面
  const isPublicPage = publicPages.includes(to.path)

  // 如果是公开页面，直接放行
  if (isPublicPage) {
    // 如果已登录且访问登录/注册页面，重定向到首页
    if ((to.path === '/login' || to.path === '/register') && userStore.userState.isLoggedIn) {
      console.log('已登录用户访问登录/注册页面，重定向到首页')
      next('/index')
      return
    }

    next()
    return
  }

  // 检查页面是否需要登录
  if (to.meta?.requiresAuth) {
    // 获取token
    const token = localStorage.getItem('userToken')
    const isLoggedIn = userStore.userState.isLoggedIn

    console.log('需要登录的页面检查:', {
      token,
      isLoggedIn,
      hasToken: !!token,
      userStoreState: userStore.userState,
    })

    // 如果有token但store状态不是已登录，尝试恢复
    if (token && !isLoggedIn) {
      console.log('有token但store未登录，尝试恢复状态...')
      userStore.restoreFromStorage()

      // 等待store状态更新
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 再次检查
      if (userStore.userState.isLoggedIn) {
        console.log('状态恢复成功，允许访问')
        next()
        return
      }
    }

    // 如果没有登录，重定向到登录页
    if (!isLoggedIn && !token) {
      console.log('未登录，重定向到登录页')

      // 保存当前页面路径，登录后可以跳转回来
      const redirectUrl = to.fullPath
      localStorage.setItem('redirectAfterLogin', redirectUrl)

      next('/login')
      return
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
  }

  // 所有检查通过
  next()
})

// 路由后置钩子 - 用于清除缓存
router.afterEach((to, from) => {
  console.log('路由跳转完成:', to.path)

  // 如果跳转到登录页，清除一些状态
  if (to.path === '/login') {
    // 清除可能存在的旧token
    const token = localStorage.getItem('userToken')
    if (!token) {
      // 如果token不存在，确保store状态也是未登录
      const userStore = useUserStore()
      if (userStore.userState.isLoggedIn) {
        userStore.userState.isLoggedIn = false
        userStore.userState.userInfo = null
      }
    }
  }

  // 处理登录后重定向
  if (from.path === '/login' && to.path !== '/login') {
    const redirectUrl = localStorage.getItem('redirectAfterLogin')
    if (redirectUrl && redirectUrl !== to.fullPath) {
      console.log('登录后重定向到之前访问的页面:', redirectUrl)
      localStorage.removeItem('redirectAfterLogin')
      router.replace(redirectUrl)
    }
  }
})

// 监听路由错误
router.onError((error) => {
  console.error('路由错误:', error)
})

export default router
