<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api/index'

// 路由实例
const router = useRouter()

interface ChatMessage {
  id: number
  content: string
  sender: 'user' | 'ai' | 'system'
  timestamp: string
  isLoading?: boolean
}

// 响应式数据
const messages = ref<ChatMessage[]>([
  {
    id: 1,
    content: '您好！我是您的智能学习助手，有什么可以帮助您的吗？',
    sender: 'ai',
    timestamp: new Date().toLocaleTimeString(),
  },
])
const inputMessage = ref('')
const selectedMenu = ref('new')
const isMobile = ref(false)
const showSidebar = ref(true)
const isUploadMode = ref(false)
const selectedFile = ref<File | null>(null)
const currentSessionId = ref<string>('')

// 用户状态管理
const userStore = useUserStore()
const showUserCenter = ref(false)

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
  if (menu === 'new') {
    messages.value = [
      {
        id: 1,
        content: '您好！我是您的智能学习助手，有什么可以帮助您的吗？',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]
    currentSessionId.value = ''
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector('.chat-messages')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

// 安全更新消息的函数
const safeUpdateMessage = (index: number, content: string, isLoading?: boolean) => {
  // 使用非空断言操作符 !
  const message = messages.value[index]!

  Object.assign(message, {
    content,
    ...(isLoading !== undefined && { isLoading }),
  })

  scrollToBottom()
}

// 主发送消息函数 - 默认使用流式输出
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  // 添加用户消息
  const userMessage: ChatMessage = {
    id: Date.now(),
    content: inputMessage.value,
    sender: 'user',
    timestamp: new Date().toLocaleTimeString(),
  }
  messages.value.push(userMessage)
  scrollToBottom()

  // 清空输入框
  const question = inputMessage.value
  inputMessage.value = ''

  // 创建AI消息占位符
  const aiMessageId = Date.now() + 1
  const aiMessage: ChatMessage = {
    id: aiMessageId,
    content: '思考中...',
    sender: 'ai',
    timestamp: new Date().toLocaleTimeString(),
    isLoading: true,
  }

  // 添加到消息列表并记住索引
  messages.value.push(aiMessage)
  const aiMessageIndex = messages.value.length - 1
  scrollToBottom()

  try {
    // 默认使用流式输出
    await handleStreamChat(question, aiMessageIndex)
  } catch (error) {
    console.error('请求失败:', error)
    safeUpdateMessage(
      aiMessageIndex,
      `操作失败: ${error instanceof Error ? error.message : '未知错误'}`,
      false,
    )
  }
}

// 流式聊天处理函数
const handleStreamChat = async (question: string, aiMessageIndex: number) => {
  try {
    const token = localStorage.getItem('userToken')
    if (!token) throw new Error('未找到认证token')

    // 构建FormData
    const formData = new FormData()
    formData.append('question', question)
    if (currentSessionId.value) {
      formData.append('sessionId', currentSessionId.value)
    }
    formData.append('stream', 'true') // 设置为流式输出

    console.log('🚀 发送流式请求...')

    // 使用统一的 /ai/chat 接口，带stream=true参数
    const response = await fetch('/ai/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // 注意：不要设置 Content-Type，让浏览器自动设置
      },
      body: formData,
    })

    console.log('📊 响应状态:', response.status, response.statusText)
    console.log('📄 Content-Type:', response.headers.get('content-type'))

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('text/event-stream')) {
      console.log('✅ 后端返回SSE流式数据')
      await processSSEResponse(response, aiMessageIndex)
    } else {
      console.log('⚠️ 后端返回非流式格式，降级处理')
      await processJSONResponse(response, aiMessageIndex)
    }
  } catch (error) {
    console.error('❌ 流式处理失败:', error)
    throw error
  }
}

// 处理SSE响应
const processSSEResponse = async (response: Response, aiMessageIndex: number) => {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  const decoder = new TextDecoder('utf-8')
  let accumulatedText = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('✅ 流式读取完成')
        safeUpdateMessage(aiMessageIndex, accumulatedText, false)
        break
      }

      // 解码数据
      buffer += decoder.decode(value, { stream: true })

      // 按行分割（处理SSE格式）
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保存未完成的半行

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        console.log('📥 收到SSE行:', trimmedLine)

        // 处理SSE格式: data: {...}
        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.substring(6).trim()
          if (!dataStr) continue

          try {
            const data = JSON.parse(dataStr)
            console.log('📦 解析SSE数据:', data)

            if (data.chunk) {
              accumulatedText += data.chunk
              console.log('📝 累积文本长度:', accumulatedText.length)

              // 更新消息内容
              safeUpdateMessage(aiMessageIndex, accumulatedText, true)
            }

            if (data.done === true) {
              console.log('🎉 流式完成')
              safeUpdateMessage(aiMessageIndex, accumulatedText, false)

              if (data.sessionId) {
                currentSessionId.value = data.sessionId
                console.log('🆔 更新sessionId:', data.sessionId)
              }

              reader.releaseLock()
              return
            }
          } catch (parseError) {
            console.warn('⚠️ 解析SSE JSON失败:', parseError, '数据:', dataStr)
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ 读取流式数据失败:', error)
    throw error
  } finally {
    reader.releaseLock()
  }
}

// 处理JSON响应（备用方案）
const processJSONResponse = async (response: Response, aiMessageIndex: number) => {
  try {
    const data = await response.json()
    console.log('📄 JSON响应:', data)

    if (data.code === 200 && data.data && data.data.answer) {
      safeUpdateMessage(aiMessageIndex, data.data.answer, false)

      if (data.data.sessionId) {
        currentSessionId.value = data.data.sessionId
      }
    } else {
      safeUpdateMessage(
        aiMessageIndex,
        `API返回错误: ${data.code || '未知'} - ${data.message || '无消息'}`,
        false,
      )
    }
  } catch (error) {
    console.error('❌ 解析JSON失败:', error)
    safeUpdateMessage(
      aiMessageIndex,
      `解析响应失败: ${error instanceof Error ? error.message : '未知错误'}`,
      false,
    )
  }
}

// 备用方案：使用普通模式
const sendMessageNormal = async () => {
  if (!inputMessage.value.trim()) return

  // 添加用户消息
  const userMessage: ChatMessage = {
    id: Date.now(),
    content: inputMessage.value,
    sender: 'user',
    timestamp: new Date().toLocaleTimeString(),
  }
  messages.value.push(userMessage)
  scrollToBottom()

  const question = inputMessage.value
  inputMessage.value = ''

  // 创建AI消息占位符
  const aiMessage: ChatMessage = {
    id: Date.now() + 1,
    content: '思考中...',
    sender: 'ai',
    timestamp: new Date().toLocaleTimeString(),
    isLoading: true,
  }

  const aiMessageIndex = messages.value.length
  messages.value.push(aiMessage)
  scrollToBottom()

  try {
    const response = await api.askQuestion({
      question: question,
      sessionId: currentSessionId.value || undefined,
      stream: false,
    })

    if (response.code === 200) {
      safeUpdateMessage(aiMessageIndex, response.data.answer || 'AI未返回具体答案', false)

      if (response.data.sessionId) {
        currentSessionId.value = response.data.sessionId
      }
    }
  } catch (error) {
    console.error('请求失败:', error)
    safeUpdateMessage(
      aiMessageIndex,
      `操作失败: ${error instanceof Error ? error.message : '未知错误'}`,
      false,
    )
  }
}

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage() // 默认使用流式
  }
}

// 处理文件选择
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const file = input.files[0]
    if (file) {
      selectedFile.value = file
    }
  }
}

// 上传文件（使用普通模式，因为上传不支持流式）
const uploadFile = async () => {
  if (!selectedFile.value) return

  const fileMessage: ChatMessage = {
    id: Date.now(),
    content: `上传了文件: ${selectedFile.value.name}`,
    sender: 'user',
    timestamp: new Date().toLocaleTimeString(),
  }
  messages.value.push(fileMessage)
  scrollToBottom()

  try {
    // 使用普通模式，因为上传不支持流式
    const response = await api.askQuestion({
      question: inputMessage.value || '请分析这个文件',
      file: selectedFile.value,
      sessionId: currentSessionId.value || undefined,
      stream: false, // 上传文件使用普通模式
    })

    if (response.code === 202) {
      const taskId = response.data.taskId || ''
      pollTaskStatus(taskId)

      if (response.data.sessionId) {
        currentSessionId.value = response.data.sessionId
      }
    } else if (response.code === 200) {
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        content: response.data.answer || 'AI未返回具体答案',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
      }
      messages.value.push(aiMessage)
      scrollToBottom()

      if (response.data.sessionId) {
        currentSessionId.value = response.data.sessionId
      }
    }
  } catch (error) {
    console.error('请求失败:', error)
    const errorMessage: ChatMessage = {
      id: Date.now(),
      content: `操作失败: ${error instanceof Error ? error.message : '未知错误'}`,
      sender: 'system',
      timestamp: new Date().toLocaleTimeString(),
    }
    messages.value.push(errorMessage)
    scrollToBottom()
  }

  cancelUpload()
}

// 取消上传
const cancelUpload = () => {
  selectedFile.value = null
  isUploadMode.value = false
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

        const aiMessage: ChatMessage = {
          id: Date.now(),
          content: response.data.answer || '文件处理完成',
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString(),
        }
        messages.value.push(aiMessage)
        scrollToBottom()
      } else if (response.data.status === 'failed') {
        clearInterval(interval)

        const errorMessage: ChatMessage = {
          id: Date.now(),
          content: `处理失败: ${response.data.error || '未知错误'}`,
          sender: 'system',
          timestamp: new Date().toLocaleTimeString(),
        }
        messages.value.push(errorMessage)
        scrollToBottom()
      }
    } catch (error) {
      console.error('轮询失败:', error)
      clearInterval(interval)
    }
  }, 2000)
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

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<template>
  <div class="smart-qa-container">
    <!-- 顶部导航栏 -->
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
          <div
            class="sidebar-item"
            :class="{ 'sidebar-item-active': selectedMenu === 'new' }"
            @click="selectMenu('new')"
          >
            新对话
          </div>

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
              <div class="message-bubble" :class="{ loading: message.isLoading }">
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
      <div class="footer-content">智慧校园平台 © 2024</div>
    </footer>
  </div>
</template>

<style scoped>
.smart-qa-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  display: flex;
  flex-direction: column;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  z-index: 100;
  height: 70px;
  border-bottom: 1px solid #eef1f5;
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

.logo-placeholder {
  padding: 8px 16px;
  background-color: #165dff;
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
}

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
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.nav-item:hover {
  color: #165dff;
  background-color: #fafafb;
}

.nav-item.has-submenu::after {
  content: '▼';
  margin-left: 6px;
  font-size: 12px;
}

.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
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
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: #fafafb;
  color: #165dff;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-login {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: #165dff;
  color: #fff;
  border: 1px solid #165dff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-login:hover {
  background-color: #0e46cc;
  border-color: #0e46cc;
}

.login-icon {
  font-size: 16px;
}

.btn-user-center {
  padding: 10px 20px;
  background-color: transparent;
  color: #1d2129;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-user-center:hover {
  background-color: #fafafb;
  border-color: #165dff;
  color: #165dff;
}

.user-center-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  z-index: 102;
}

.dropdown-item {
  padding: 10px 16px;
  font-size: 14px;
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-item:hover {
  background-color: #fafafb;
  color: #165dff;
}

.dropdown-item.logout {
  color: #f53f3f;
}

.dropdown-item.logout:hover {
  background-color: #fff2f2;
}

.main-content {
  display: flex;
  flex: 1;
  margin-top: 70px;
  min-height: calc(100vh - 120px);
}

.sidebar-toggle {
  position: fixed;
  top: 80px;
  left: 10px;
  z-index: 99;
  padding: 8px 16px;
  background-color: #165dff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: none;
}

.sidebar {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid #e5e7eb;
  padding: 20px 0;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid #f0f2f5;
}

.sidebar-title {
  font-size: 20px;
  font-weight: bold;
  color: #1d2129;
  margin: 0;
}

.sidebar-menu {
  margin-top: 20px;
}

.sidebar-item {
  padding: 16px 20px;
  font-size: 16px;
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background-color: #fafafb;
  color: #165dff;
}

.sidebar-item-active {
  background-color: #fafafb;
  color: #165dff !important;
  border-left-color: #165dff;
  font-weight: 500;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  padding: 20px;
  max-width: calc(100% - 280px);
}

.chat-header {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
  color: #1d2129;
}

.chat-messages {
  flex: 1;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 20px;
  overflow-y: auto;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

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
  background-color: #fafafb;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #1d2129;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  white-space: pre-wrap;
  word-break: break-word;
}

.message-item-user .message-bubble {
  background-color: #165dff;
  color: #fff;
}

.message-bubble.loading {
  background-color: #f0f2f5;
  color: #86909c;
  position: relative;
  min-height: 20px;
}

.message-bubble.loading::after {
  content: '...';
  animation: loadingDots 1.5s infinite;
  position: absolute;
  right: 10px;
  bottom: 5px;
}

@keyframes loadingDots {
  0%,
  20% {
    content: '.';
  }
  40% {
    content: '..';
  }
  60%,
  100% {
    content: '...';
  }
}

.message-time {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
  text-align: right;
}

.message-item-user .message-time {
  text-align: left;
}

.chat-input-area {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.input-toolbar {
  margin-bottom: 12px;
}

.upload-button {
  padding: 8px 16px;
  background-color: #4c8aff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-button:hover {
  background-color: #165dff;
}

.upload-button-active {
  background-color: #165dff;
}

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
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  line-height: 1.5;
  transition: all 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: #165dff;
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
}

.send-button {
  padding: 0 24px;
  background-color: #f53f3f;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-end;
  height: 44px;
}

.send-button:hover {
  background-color: #e13d3d;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.input-tip {
  font-size: 12px;
  color: #86909c;
  text-align: center;
}

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

.file-input {
  display: none;
}

.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafb;
}

.upload-box:hover {
  border-color: #165dff;
  background-color: rgba(22, 93, 255, 0.05);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: #1d2129;
  margin-bottom: 8px;
  text-align: center;
}

.upload-hint {
  font-size: 14px;
  color: #86909c;
  text-align: center;
}

.upload-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.upload-submit {
  padding: 10px 24px;
  background-color: #f53f3f;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-submit:hover:not(:disabled) {
  background-color: #e13d3d;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.upload-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.upload-cancel {
  padding: 10px 24px;
  background-color: transparent;
  color: #1d2129;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-cancel:hover {
  background-color: #fafafb;
  border-color: #165dff;
  color: #165dff;
}

.right-sidebar {
  width: 320px;
  background-color: #fff;
  border-left: 1px solid #e5e7eb;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.footer {
  height: 50px;
  background-color: #fff;
  border-top: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #86909c;
}

.footer-content {
  text-align: center;
}

@media (max-width: 1366px) {
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
