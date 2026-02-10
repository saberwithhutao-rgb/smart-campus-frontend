// utils/auth.js
export function checkAuthStatus() {
  const userStore = useUserStore()
  const token = localStorage.getItem('userToken')

  console.log('检查认证状态:', {
    token: !!token,
    isLoggedIn: userStore.userState.isLoggedIn,
    userInfo: userStore.userState.userInfo,
  })

  // 如果store显示未登录但有token，尝试恢复
  if (token && !userStore.userState.isLoggedIn) {
    console.log('状态不一致，尝试恢复...')
    userStore.restoreFromStorage()
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(userStore.userState.isLoggedIn)
      }, 100)
    })
  }

  return Promise.resolve(userStore.userState.isLoggedIn || !!token)
}

export function requireAuth(to, from, next) {
  checkAuthStatus().then((isAuthenticated) => {
    if (!isAuthenticated && to.meta.requiresAuth) {
      console.log('需要登录，重定向到登录页')
      next('/login')
    } else {
      next()
    }
  })
}
