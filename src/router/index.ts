import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/index',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/',
      redirect: '/index',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
    },
    {
      path: '/user-manage',
      name: 'user-manage',
      component: () => import('../views/UserManage.vue'),
    },
    {
      path: '/ai/chat',
      name: 'smart-qa',
      component: () => import('../views/SmartQa.vue'),
    },
    {
      path: '/ai/study',
      name: 'personal-study-plan',
      component: () => import('../views/PersonalStudyPlan.vue'),
    },
    {
      path: '/ai/study/review',
      name: 'smart-review',
      component: () => import('../views/SmartReview.vue'),
    },
    {
      path: '/campus/analysis',
      name: 'campus-analysis',
      component: () => import('../views/StudyManagement.vue'),
    },
    {
      path: '/campus/advice',
      name: 'campus-advice',
      component: () => import('../views/StudyManagement.vue'),
    },
    {
      path: '/campus/library',
      name: 'library-status',
      component: () => import('../views/LibraryStatus.vue'),
    },
    {
      path: '/career/competitions',
      name: 'competition-management',
      component: () => import('../views/CompetitionManagement.vue'),
    },
    {
      path: '/career/position',
      name: 'career-navigation',
      component: () => import('../views/CareerNavigation.vue'),
    },
    {
      path: '/career/pee',
      name: 'exam-support',
      component: () => import('../views/PostgraduateSupport.vue'),
    },
    {
      path: '/profile',
      name: 'user-center',
      component: () => import('../views/UserCenter.vue'),
    },
    // 404路由
    {
      path: '/:pathMatch(.*)*',
      redirect: '/index',
    },
  ],
})

export default router
