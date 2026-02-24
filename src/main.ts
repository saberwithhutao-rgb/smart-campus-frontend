// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'

const app = createApp(App)

// 注册Element Plus
app.use(ElementPlus)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)

// 在应用挂载前尝试自动登录
async function initApp() {
  console.log('🚀 应用启动，检查自动登录状态...')

  const userStore = useUserStore()

  // 如果没有登录，尝试自动登录
  if (!userStore.userState.isLoggedIn) {
    const autoLoginSuccess = await userStore.tryAutoLogin()

    if (autoLoginSuccess) {
      console.log('🎉 自动登录成功！')
    } else {
      console.log('👋 未自动登录')

      // 如果当前不是登录页，且有保存的用户名，可以跳转到登录页
      if (window.location.pathname !== '/login' && userStore.getSavedUsername()) {
        router.push('/login')
      }
    }
  } else {
    console.log('✅ 已有有效登录状态')
  }
}

// 先初始化，再挂载应用
initApp().then(() => {
  app.mount('#app')
})
