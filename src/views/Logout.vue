<template>
  <div class="logout-container">
    <div class="logout-message">
      <h2>正在退出登录...</h2>
      <p>请稍候，正在清理您的登录信息</p>
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  console.log('强制退出登录页面加载')

  // 延迟执行退出，确保组件渲染完成
  setTimeout(() => {
    console.log('开始执行退出登录...')

    // 1. 清除所有本地存储
    const keysToRemove = [
      'userToken',
      'userInfo',
      'refreshToken',
      'username',
      'userId',
      'redirectAfterLogin',
      'lastLoginTime',
      'auth_token',
      'access_token',
    ]

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })

    // 2. 清除store状态
    userStore.userState = {
      isLoggedIn: false,
      userInfo: null,
    }

    // 3. 清除所有cookie
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.trim().split('=')[0]
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })

    console.log('退出登录完成，跳转到登录页')

    // 4. 使用硬跳转，确保完全退出
    window.location.href = '/login'
  }, 500)
})
</script>

<style scoped>
.logout-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.logout-message {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.logout-message h2 {
  color: #1d2129;
  margin-bottom: 16px;
}

.logout-message p {
  color: #86909c;
  margin-bottom: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(102, 126, 234, 0.2);
  border-radius: 50%;
  border-top-color: #667eea;
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
