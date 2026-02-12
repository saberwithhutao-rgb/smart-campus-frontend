<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
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
  console.log('🟡 safeUpdateMessage 被调用', { index, content, isLoading })

  if (index < 0 || index >= messages.value.length) {
    console.error('❌ 消息索引超出范围:', index)
    return
  }

  const message = messages.value[index]
  if (!message) {
    console.error('❌ 消息不存在:', index)
    return
  }

  console.log('📝 更新前:', message.content)
  message.content = content
  if (isLoading !== undefined) {
    message.isLoading = isLoading
  }
  console.log('📝 更新后:', message.content)

  // 强制触发响应式更新
  messages.value = [...messages.value]
  scrollToBottom()
}
/**
 * ✅ 处理通义千问流式响应 - OpenAI 兼容格式
 */
const processTongyiStream = async (
  response: Response,
  aiMessageIndex: number,
  question: string,
) => {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  const decoder = new TextDecoder()
  let accumulatedText = ''
  let buffer = ''
  let hasReceivedContent = false

  const token = localStorage.getItem('userToken')
  if (!token) {
    console.error('❌ 未找到用户令牌，请重新登录')
    safeUpdateMessage(aiMessageIndex, '请先登录', false)
    return
  }

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        console.log('✅ 流式响应完成')
        safeUpdateMessage(aiMessageIndex, accumulatedText, false)
        break
      }

      buffer += decoder.decode(value, { stream: true })

      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const event of events) {
        const lines = event.split('\n')
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine.startsWith('data:')) continue

          // 🟢 关键修复：使用 replace 去掉 "data:" 前缀
          let jsonStr = trimmedLine
          while (jsonStr.startsWith('data:')) {
            jsonStr = jsonStr.substring(5).trim()
          }

          // 调试日志
          if (jsonStr.length > 0 && jsonStr !== '[DONE]') {
            console.log('📄 原始行:', trimmedLine.substring(0, 50))
            console.log('📄 提取后:', jsonStr.substring(0, 50))
          }

          if (!jsonStr || jsonStr === '[DONE]') continue

          try {
            const data = JSON.parse(jsonStr)
            console.log('✅ JSON解析成功')

            if (data.choices && data.choices.length > 0) {
              const choice = data.choices[0]

              if (choice.delta && choice.delta.content) {
                const chunk = choice.delta.content

                // 🟢 将chunk拆分成单个字符
                for (let i = 0; i < chunk.length; i++) {
                  const char = chunk[i]
                  accumulatedText += char

                  if (!hasReceivedContent && char.trim() !== '') {
                    hasReceivedContent = true
                    safeUpdateMessage(aiMessageIndex, accumulatedText, false)
                  } else if (hasReceivedContent) {
                    safeUpdateMessage(aiMessageIndex, accumulatedText, false)
                  }

                  // 🟢 每个字符间隔30ms，制造流畅的打字效果
                  await new Promise((resolve) => setTimeout(resolve, 30))
                }

                // 是否完成
                const isDone = choice.finish_reason === 'stop'
                if (isDone) {
                  console.log('🎉 流式输出完成，总长度:', accumulatedText.length)

                  // 保存完整对话
                  if (token) {
                    await fetch('/ai/chat/save', {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        sessionId: currentSessionId.value,
                        question: question,
                        answer: accumulatedText,
                      }),
                    }).catch((err) => console.error('保存对话失败:', err))
                  }

                  reader.releaseLock()
                  return
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ JSON解析失败:', e.message)
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ 读取流失败:', error)
    safeUpdateMessage(aiMessageIndex, accumulatedText || '连接中断', false)
  } finally {
    reader.releaseLock()
  }
}
/**
 * ✅ 主发送消息函数 - 使用通义千问原生流式
 */
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  // 保存当前问题
  const question = inputMessage.value

  // 添加用户消息
  const userMessage: ChatMessage = {
    id: Date.now(),
    content: question,
    sender: 'user',
    timestamp: new Date().toLocaleTimeString(),
  }
  messages.value.push(userMessage)
  scrollToBottom()

  inputMessage.value = ''

  // 创建AI消息占位符
  const aiMessageId = Date.now() + 1
  const aiMessage: ChatMessage = {
    id: aiMessageId,
    content: '',
    sender: 'ai',
    timestamp: new Date().toLocaleTimeString(),
    isLoading: true,
  }
  messages.value.push(aiMessage)
  const aiMessageIndex = messages.value.length - 1
  scrollToBottom()

  try {
    const token = localStorage.getItem('userToken')
    if (!token) {
      safeUpdateMessage(aiMessageIndex, '请先登录', false)
      return
    }

    const formData = new FormData()
    formData.append('question', question)
    if (currentSessionId.value) {
      formData.append('sessionId', currentSessionId.value)
    }
    formData.append('stream', 'true')

    const response = await fetch('/ai/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // ✅ 传入 question 以便保存
    await processTongyiStream(response, aiMessageIndex, question)
  } catch (error) {
    console.error('❌ 请求失败:', error)
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
    sendMessage()
  }
}

// 处理文件选择
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] // 使用可选链操作符安全访问
  if (file) {
    selectedFile.value = file
  }
}

// 上传文件（非流式）
const uploadFile = async () => {
  if (!selectedFile.value) return

  const fileMessage: ChatMessage = {
    id: Date.now(),
    content: `📎 上传了文件: ${selectedFile.value.name}`,
    sender: 'user',
    timestamp: new Date().toLocaleTimeString(),
  }
  messages.value.push(fileMessage)
  scrollToBottom()

  try {
    const response = await api.askQuestion({
      question: inputMessage.value || '请分析这个文件',
      file: selectedFile.value,
      sessionId: currentSessionId.value || undefined,
      stream: false,
    })

    if (response.code === 202) {
      // 异步处理
      const taskId = response.data.taskId
      if (taskId) {
        pollTaskStatus(taskId) // 确保 taskId 存在后再调用
      } else {
        console.error('❌ taskId 未定义，无法启动轮询')
      }

      if (response.data.sessionId) {
        currentSessionId.value = response.data.sessionId
      }
    } else if (response.code === 200) {
      // 同步完成
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        content: response.data.answer || '文件处理完成',
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
    console.error('上传失败:', error)
    const errorMessage: ChatMessage = {
      id: Date.now(),
      content: `❌ 上传失败: ${error instanceof Error ? error.message : '未知错误'}`,
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
          content: `❌ 处理失败: ${response.data.error || '未知错误'}`,
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

// 切换侧边栏
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 生命周期
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
    <GlobalNavbar />

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
  content: '  ';
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
