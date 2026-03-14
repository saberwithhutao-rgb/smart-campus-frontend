import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import Logout from '@/views/Logout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/ai/study/detail/:id',
      name: 'PlanDetail',
      component: () => import('../views/PlanDetail.vue'),
      meta: { requiresAuth: true },
    },
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
        requiresAuth: false,
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
        onlyGuest: true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
      meta: {
        requiresAuth: false,
        onlyGuest: true,
      },
    },
    {
      path: '/user-manage',
      name: 'user-manage',
      component: () => import('../views/UserManage.vue'),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
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
    {
      path: '/:pathMatch(.*)*',
      redirect: '/index',
    },
    {
      path: '/ai/study/review/detail/:id',
      name: 'ReviewDetail',
      component: () => import('@/views/ReviewDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('../views/ProfileEdit.vue'),
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

const publicPages = ['/login', '/register', '/index', '/', '/logout']

// 【新增】初始化标记
let isRouterInitialized = false

// 路由守卫
router.beforeEach(async (to, from, next) => {
  console.log('=== 路由守卫开始 ===')
  console.log('从:', from.path, '到:', to.path)

  const userStore = useUserStore()

  if (!isRouterInitialized) {
    console.log('1. 开始恢复状态...')
    userStore.restoreFromStorage()
    isRouterInitialized = true
    console.log('✅ 状态恢复成功')
  }

  const isLoggedIn = userStore.userState.isLoggedIn
  const token =
    localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN_ALT)

  console.log('当前状态:', { token: !!token, isLoggedIn })

  const isPublicPage = publicPages.includes(to.path)

  if (isPublicPage) {
    if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
      console.log('已登录用户访问登录/注册页面，重定向到首页')
      window.location.href = '/index'
      return
    }

    console.log('公开页面，允许访问')
    next()
    return
  }

  if (to.meta?.requiresAuth) {
    console.log('需要登录的页面，检查登录状态...')

    if (!isLoggedIn) {
      console.log('未登录，重定向到登录页')

      if (to.path !== '/login') {
        localStorage.setItem('redirectAfterLogin', to.fullPath)
      }

      window.location.href = '/login'
      return
    }

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

  console.log('其他页面，允许访问')
  next()
})

router.afterEach((to, from) => {
  console.log('路由跳转完成:', to.path)
  // 删除 forceCheckLoginStatus 调用
})

export default router
