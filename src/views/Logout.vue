<template>
  <div class="logout-container">
    <div class="logout-message">
      <h2>正在退出登录...</h2>
      <p>请稍候，正在清理您的登录信息</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  console.log('强制退出登录页面')

  // 调用增强的logout函数
  userStore.logout(true) // true表示跳转到登录页
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
}
</style>
