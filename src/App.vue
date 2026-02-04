<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 页面加载的时段问候提示功能
const showGreetingMessage = () => {
  // 检查是否已经显示过问候信息（使用localStorage存储状态）
  const hasShownGreeting = localStorage.getItem('hasShownGreeting')

  if (!hasShownGreeting) {
    // 获取用户本地系统时间
    const now = new Date()
    const hour = now.getHours()

    // 根据小时数显示不同的问候
    if (hour <= 7) {
      // 早安问候（7点及以前）
      ElMessage({
        message: '早上好呀，早起的你真棒哇~',
        type: 'success',
        duration: 3000,
        showClose: true,
      })
    } else if (hour >= 22) {
      // 深夜休息问候（22点及以后）
      ElMessage({
        message: '夜深了，注意休息，别熬太晚啦~',
        type: 'warning',
        duration: 3000,
        showClose: true,
      })
    }

    // 标记已经显示过问候信息，当天不再重复显示
    localStorage.setItem('hasShownGreeting', 'true')

    // 设置24小时后过期，第二天重新显示问候
    setTimeout(
      () => {
        localStorage.removeItem('hasShownGreeting')
      },
      24 * 60 * 60 * 1000,
    )
  }
}

// 页面首次加载时触发
onMounted(() => {
  showGreetingMessage()
})
</script>

<template>
  <router-view />
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
