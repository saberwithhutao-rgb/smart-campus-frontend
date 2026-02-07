<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api/index'

// 路由实例
const router = useRouter()

// 响应式数据
const messages = ref([
  {
    id: 1,
    content: '您好！',
    sender: 'ai',
    timestamp: new Date().toLocaleTimeString(),
  },
]) // 对话消息列表
const inputMessage = ref('') // 输入框内容
const selectedMenu = ref('new') // 当前选中的菜单
const isMobile = ref(false) // 是否为移动端
const showSidebar = ref(true) // 是否显示侧边栏
const isUploadMode = ref(false) // 是否为上传模式
const selectedFile = ref<File | null>(null) // 选中的文件

// 用户状态管理
const userStore = useUserStore()

// 导航栏相关响应式数据
const showUserCenter = ref(false) // 显示个人中心菜单

// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
  if (isMobile.value) {
    showSidebar.value = false
  }
}

// 切换菜单选中状态
const selectMenu = (menu: string) => {
  selectedMenu.value = menu
  // 新对话逻辑
  if (menu === 'new') {
    messages.value = [
      {
        id: 1,
        content: '您好！',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  // 添加用户消息
  const userMessage = {
    id: Date.now(),
    content: inputMessage.value,
    sender: 'user',
    timestamp: new Date().toLocaleTimeString(),
  }
  messages.value.push(userMessage)

  // 清空输入框
  const question = inputMessage.value
  inputMessage.value = ''

  try {
    // 调用后端API
    const response = await api.askQuestion({
      question: question,
      sessionId: currentSessionId.value,
      stream: false, // 暂时不用流式
    })

    if (response.code === 202) {
      // 文件上传，异步处理
      const taskId = response.data.taskId
      pollTaskStatus(taskId)
    } else if (response.code === 200) {
      // 直接返回答案
      const aiMessage = {
        id: Date.now() + 1,
        content: response.data.answer,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
      }
      messages.value.push(aiMessage)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  // Enter键发送，Shift+Enter换行
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 处理文件选择
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0] as File
  }
}

// 上传文件
const uploadFile = async () => {
  if (!selectedFile.value) return

  // 添加文件上传消息
  const fileMessage = {
    id: Date.now(),
    content: `上传了文件: ${selectedFile.value.name}`,
    sender: 'user',
    timestamp: new Date().toLocaleTimeString(),
  }
  messages.value.push(fileMessage)

  try {
    const response = await api.askQuestion({
      question: inputMessage.value || '请分析这个文件',
      file: selectedFile.value,
      sessionId: currentSessionId.value,
    })

    if (response.code === 202) {
      const taskId = response.data.taskId
      pollTaskStatus(taskId)
    }
  } catch (error) {
    console.error('文件上传失败:', error)
  }

  cancelUpload()
}

// 取消上传
const cancelUpload = () => {
  selectedFile.value = null
  isUploadMode.value = false
  // 重置文件输入
  const input = document.getElementById('file-upload') as HTMLInputElement
  if (input) {
    input.value = ''
  }
}

// 轮询任务状态
const pollTaskStatus = async (taskId: string) => {
  const interval = setInterval(async () => {
    try {
      const response = await api.getTaskStatus(taskId)

      if (response.data.status === 'completed') {
        clearInterval(interval)

        const aiMessage = {
          id: Date.now(),
          content: response.data.answer,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString(),
        }
        messages.value.push(aiMessage)
      } else if (response.data.status === 'failed') {
        clearInterval(interval)

        const errorMessage = {
          id: Date.now(),
          content: `处理失败: ${response.data.error}`,
          sender: 'system',
          timestamp: new Date().toLocaleTimeString(),
        }
        messages.value.push(errorMessage)
      }
      // 否则继续轮询...
    } catch (error) {
      console.error('轮询失败:', error)
      clearInterval(interval)
    }
  }, 2000) // 每2秒轮询一次
}
// 切换侧边栏显示
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 生命周期钩子
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})
</script>

<template>
  <div class="smart-qa-container">
    <!-- 顶部导航栏 - 复用首页导航栏 -->
    <nav class="navbar">
      <div class="navbar-container">
        <!-- Logo区域 -->
        <div class="logo">
          <div class="logo-placeholder">logo</div>
        </div>

        <!-- 导航菜单 -->
        <div class="nav-menu" :class="{ 'mobile-menu': isMobile }">
          <div class="nav-item" @click="router.push('/index')">首页</div>

          <div class="nav-item has-submenu">
            个性化学习伴侣
            <div class="submenu">
              <div class="submenu-item" @click="router.push('/ai/chat')">智能问答</div>
              <div class="submenu-item" @click="router.push('/ai/study')">个性化规划</div>
            </div>
          </div>

          <div class="nav-item has-submenu">
            校园生活
            <div class="submenu">
              <div class="submenu-item" @click="router.push('/campus/analysis')">学习管理</div>
              <div class="submenu-item" @click="router.push('/campus/library')">馆藏实况</div>
            </div>
          </div>

          <div class="nav-item has-submenu">
            竞赛相关
            <div class="submenu">
              <div class="submenu-item" @click="router.push('/career/competitions')">竞赛管理</div>
              <div class="submenu-item" @click="router.push('/career/position')">职业导航</div>
              <div class="submenu-item" @click="router.push('/career/pee')">考研支持</div>
            </div>
          </div>
        </div>

        <!-- 右侧操作区 -->
        <div class="nav-actions">
          <!-- 登录按钮 - 未登录时显示 -->
          <button
            v-if="!userStore.userState.isLoggedIn"
            class="btn-login"
            @click="router.push('/login')"
          >
            <span class="login-icon">👤</span>
            登录
          </button>

          <!-- 个人中心 -->
          <div class="user-center">
            <button class="btn-user-center" @click="showUserCenter = !showUserCenter">
              个人中心
            </button>
            <!-- 个人中心下拉菜单 -->
            <div v-if="showUserCenter" class="user-center-dropdown">
              <div class="dropdown-item" @click="router.push('/profile')">个人信息</div>
              <div class="dropdown-item logout" @click="router.push('/login')">退出登录</div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 移动端侧边栏切换按钮 -->
      <button class="sidebar-toggle" @click="toggleSidebar" v-if="isMobile">
        {{ showSidebar ? '关闭' : '打开' }}侧边栏
      </button>

      <!-- 左侧功能栏 -->
      <aside class="sidebar" :class="{ 'sidebar-collapsed': !showSidebar && isMobile }">
        <div class="sidebar-header">
          <h2 class="sidebar-title">智能问答</h2>
        </div>

        <div class="sidebar-menu">
          <!-- 新对话选项 -->
          <div
            class="sidebar-item"
            :class="{ 'sidebar-item-active': selectedMenu === 'new' }"
            @click="selectMenu('new')"
          >
            新对话
          </div>

          <!-- 历史对话选项 -->
          <div
            class="sidebar-item"
            :class="{ 'sidebar-item-active': selectedMenu === 'history' }"
            @click="selectMenu('history')"
          >
            历史对话
          </div>
        </div>
      </aside>

      <!-- 中间对话区 -->
      <main class="chat-main">
        <!-- 对话头部 -->
        <div class="chat-header">
          <div class="chat-ai-info">
            <div class="ai-avatar">🤖</div>
            <div class="ai-name">小智</div>
          </div>
        </div>

        <!-- 对话消息列表 -->
        <div class="chat-messages">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="{ 'message-item-user': message.sender === 'user' }"
          >
            <div class="message-avatar">
              {{ message.sender === 'ai' ? '🤖' : '👤' }}
            </div>
            <div class="message-content">
              <div class="message-bubble">
                {{ message.content }}
              </div>
              <div class="message-time">{{ message.timestamp }}</div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-area">
          <!-- 上传按钮 -->
          <div class="input-toolbar">
            <button
              class="upload-button"
              @click="isUploadMode = !isUploadMode"
              :class="{ 'upload-button-active': isUploadMode }"
            >
              {{ isUploadMode ? '取消上传' : '上传文件' }}
            </button>
          </div>

          <!-- 输入模式 -->
          <div v-if="!isUploadMode" class="input-mode">
            <div class="input-container">
              <textarea
                v-model="inputMessage"
                class="message-input"
                placeholder="请输入您的问题"
                rows="1"
                @keydown="handleKeyDown"
                spellcheck="false"
              ></textarea>
              <button class="send-button" @click="sendMessage">发送</button>
            </div>
            <div class="input-tip">按Enter发送消息，Shift+Enter换行</div>
          </div>

          <!-- 上传模式 -->
          <div v-else class="upload-mode">
            <div class="upload-container">
              <input
                type="file"
                id="file-upload"
                class="file-input"
                accept=".doc,.docx,.pdf,.txt"
                @change="handleFileChange"
              />
              <label for="file-upload" class="upload-box">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                  {{ selectedFile ? selectedFile.name : '点击或拖拽文件到此处上传' }}
                </div>
                <div class="upload-hint">支持 .doc .docx .pdf .txt 格式文件</div>
              </label>
              <div class="upload-actions">
                <button class="upload-submit" @click="uploadFile" :disabled="!selectedFile">
                  确认上传
                </button>
                <button class="upload-cancel" @click="cancelUpload">取消</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- 右侧区域（暂留空白） -->
      <aside class="right-sidebar">
        <!-- 后续可拓展功能 -->
      </aside>
    </div>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">页脚</div>
    </footer>
  </div>
</template>

<style scoped>
/* 全局变量 */
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

  /* 边框和阴影 */
  --border-color: #e5e7eb;
  --border-color-light: #f0f2f5;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 圆角 */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* 过渡 */
  --transition: all 0.3s ease;
}

/* 主容器 */
.smart-qa-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  box-shadow: var(--shadow-sm);
  z-index: 100;
  height: 70px;
  border-bottom: 1px solid var(--border-color-light);
}

.navbar-container {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 100%;
}

/* Logo区域 */
.logo {
  display: flex;
  align-items: center;
}

.logo-placeholder {
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: #fff;
  border-radius: var(--border-radius-md);
  font-size: 16px;
  font-weight: 600;
}

/* 导航菜单 */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-item {
  position: relative;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--border-radius-md);
}

.nav-item:hover {
  color: var(--primary-color);
  background-color: var(--bg-color-light);
}

.nav-item.has-submenu {
  position: relative;
}

.nav-item.has-submenu::after {
  content: '▼';
  margin-left: 6px;
  font-size: 12px;
}

/* 子菜单 */
.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 12px 0;
  min-width: 160px;
  z-index: 101;
  display: none;
}

.nav-item.has-submenu:hover .submenu {
  display: block;
}

.submenu-item {
  padding: 12px 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: var(--bg-color-light);
  color: var(--primary-color);
}

/* 右侧操作区 */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 登录按钮 */
.btn-login {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: #fff;
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
}

.btn-login:hover {
  background-color: var(--primary-color-dark);
  border-color: var(--primary-color-dark);
}

.login-icon {
  font-size: 16px;
}

/* 个人中心 */
.btn-user-center {
  padding: 10px 20px;
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
}

.btn-user-center:hover {
  background-color: var(--bg-color-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 主内容区 */
.main-content {
  display: flex;
  flex: 1;
  margin-top: 70px;
  min-height: calc(100vh - 120px);
}

/* 移动端侧边栏切换按钮 */
.sidebar-toggle {
  position: fixed;
  top: 80px;
  left: 10px;
  z-index: 99;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  cursor: pointer;
  display: none;
}

/* 左侧功能栏 */
.sidebar {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid var(--border-color);
  padding: 20px 0;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.sidebar-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
  margin: 0;
}

.sidebar-menu {
  margin-top: 20px;
}

.sidebar-item {
  padding: 16px 20px;
  font-size: 16px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background-color: var(--bg-color-light);
  color: var(--primary-color);
}

.sidebar-item-active {
  background-color: var(--bg-color-light);
  color: var(--primary-color) !important;
  border-left-color: var(--primary-color);
  font-weight: 500;
}

/* 中间对话区 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  padding: 20px;
  max-width: calc(100% - 280px);
}

/* 对话头部 */
.chat-header {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

.chat-ai-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  font-size: 32px;
}

.ai-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
}

/* 对话消息列表 */
.chat-messages {
  flex: 1;
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  overflow-y: auto;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 消息项 */
.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

/* 用户消息样式 */
.message-item-user {
  flex-direction: row-reverse;
}

.message-avatar {
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 4px;
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  background-color: var(--bg-color-light);
  padding: 12px 16px;
  border-radius: var(--border-radius-lg);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color);
  position: relative;
  box-shadow: var(--shadow-sm);
}

/* 用户消息气泡样式 */
.message-item-user .message-bubble {
  background-color: var(--primary-color);
  color: #fff;
}

.message-time {
  font-size: 12px;
  color: var(--text-color-light);
  margin-top: 4px;
  text-align: right;
}

.message-item-user .message-time {
  text-align: left;
}

/* 输入区域 */
.chat-input-area {
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
}

/* 输入工具栏 */
.input-toolbar {
  margin-bottom: 12px;
}

/* 上传按钮 */
.upload-button {
  padding: 8px 16px;
  background-color: var(--primary-color-light);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
}

.upload-button:hover {
  background-color: var(--primary-color);
}

.upload-button-active {
  background-color: var(--primary-color);
}

/* 输入模式 */
.input-mode {
  display: flex;
  flex-direction: column;
}

.input-container {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  font-size: 14px;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  line-height: 1.5;
  transition: var(--transition);
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
}

.send-button {
  padding: 0 24px;
  background-color: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  align-self: flex-end;
  height: 44px;
}

.send-button:hover {
  background-color: var(--accent-color-dark);
  box-shadow: var(--shadow-md);
}

.input-tip {
  font-size: 12px;
  color: var(--text-color-light);
  text-align: center;
}

/* 上传模式 */
.upload-mode {
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-container {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 文件输入隐藏 */
.file-input {
  display: none;
}

/* 上传框 */
.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: var(--transition);
  background-color: var(--bg-color-light);
}

.upload-box:hover {
  border-color: var(--primary-color);
  background-color: rgba(22, 93, 255, 0.05);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 8px;
  text-align: center;
}

.upload-hint {
  font-size: 14px;
  color: var(--text-color-light);
  text-align: center;
}

/* 上传操作按钮 */
.upload-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.upload-submit {
  padding: 10px 24px;
  background-color: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
}

.upload-submit:hover:not(:disabled) {
  background-color: var(--accent-color-dark);
  box-shadow: var(--shadow-md);
}

.upload-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.upload-cancel {
  padding: 10px 24px;
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
}

.upload-cancel:hover {
  background-color: var(--bg-color-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 右侧区域 */
.right-sidebar {
  width: 320px;
  background-color: #fff;
  border-left: 1px solid var(--border-color);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

/* 页脚 */
.footer {
  height: 50px;
  background-color: #fff;
  border-top: 1px solid var(--border-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-color-light);
}

.footer-content {
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1366px) {
  /* 笔记本端适配 */
  .sidebar {
    width: 240px;
  }

  .chat-main {
    max-width: calc(100% - 240px);
  }

  .right-sidebar {
    width: 280px;
  }

  .message-content {
    max-width: 75%;
  }
}

@media (max-width: 1024px) {
  /* 平板端适配 */
  .sidebar-toggle {
    display: block;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 70px;
    height: calc(100vh - 70px);
    z-index: 98;
    transform: translateX(0);
  }

  .sidebar-collapsed {
    transform: translateX(-100%);
  }

  .chat-main {
    max-width: 100%;
  }

  .right-sidebar {
    display: none;
  }

  .message-content {
    max-width: 85%;
  }
}

@media (max-width: 768px) {
  /* 移动端适配 */
  .navbar-container {
    padding: 0 16px;
  }

  .nav-menu {
    display: none;
  }

  .main-content {
    padding: 10px;
  }

  .chat-main {
    padding: 10px;
  }

  .message-content {
    max-width: 90%;
  }
}
</style>
