<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api, type ConversationSession, type SessionHistoryItem } from '../api/index' // 修改这里

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

// ===== 新增：历史对话相关数据 =====
const sessions = ref<ConversationSession[]>([])
const loadingSessions = ref(false)
const selectedSessionId = ref<string>('')
const showRenameDialog = ref(false)
const renamingSession = ref<ConversationSession | null>(null)
const newTitle = ref('')
const loadingHistory = ref(false)

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

// ===== 新增：监听菜单选择变化 =====
watch(selectedMenu, async (newVal) => {
  if (newVal === 'history') {
    await loadSessions()
  }
})

// ===== 新增：加载会话列表 =====
const loadSessions = async () => {
  loadingSessions.value = true
  try {
    const response = await api.getConversationSessions()
    if (response.code === 200) {
      sessions.value = response.data
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
  } finally {
    loadingSessions.value = false
  }
}

// ===== 新增：加载某个会话的历史消息 =====
const loadSessionHistory = async (sessionId: string) => {
  loadingHistory.value = true
  try {
    const response = await api.getSessionHistory(sessionId)
    if (response.code === 200) {
      // 清空现有消息
      messages.value = []

      // 添加历史消息
      response.data.forEach((item: SessionHistoryItem, index: number) => {
        // 添加用户问题
        messages.value.push({
          id: Date.now() + index * 2,
          content: item.question,
          sender: 'user',
          timestamp: new Date(item.createTime).toLocaleTimeString(),
        })

        // 添加AI回答
        messages.value.push({
          id: Date.now() + index * 2 + 1,
          content: item.answer,
          sender: 'ai',
          timestamp: new Date(item.createTime).toLocaleTimeString(),
        })
      })

      currentSessionId.value = sessionId
      selectedSessionId.value = sessionId
    }
  } catch (error) {
    console.error('加载历史消息失败:', error)
  } finally {
    loadingHistory.value = false
  }
}

// ===== 新增：选择会话 =====
const selectSession = (session: ConversationSession) => {
  selectMenu('history') // 确保在历史对话菜单
  loadSessionHistory(session.sessionId)
  if (isMobile.value) {
    showSidebar.value = false // 移动端选择后关闭侧边栏
  }
}

// ===== 新增：删除会话 =====
const deleteSession = async (sessionId: string, event: Event) => {
  event.stopPropagation() // 阻止触发选中事件

  if (!confirm('确定要删除这个对话吗？')) return

  try {
    const response = await api.deleteSession(sessionId)
    if (response.code === 200) {
      // 从列表中移除
      sessions.value = sessions.value.filter((s) => s.sessionId !== sessionId)

      // 如果删除的是当前选中的会话，清空消息区
      if (sessionId === currentSessionId.value) {
        messages.value = [
          {
            id: 1,
            content: '您好！我是您的智能学习助手，有什么可以帮助您的吗？',
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]
        currentSessionId.value = ''
        selectedSessionId.value = ''
      }
    }
  } catch (error) {
    console.error('删除会话失败:', error)
  }
}

// ===== 新增：打开重命名对话框 =====
const openRenameDialog = (session: ConversationSession, event: Event) => {
  event.stopPropagation()
  renamingSession.value = session
  newTitle.value = session.title
  showRenameDialog.value = true
}

// ===== 新增：重命名会话 =====
const renameSession = async () => {
  if (!renamingSession.value || !newTitle.value.trim()) return

  try {
    const response = await api.renameSession(renamingSession.value.sessionId, newTitle.value)
    if (response.code === 200) {
      // 更新列表中的标题
      const session = sessions.value.find((s) => s.sessionId === renamingSession.value?.sessionId)
      if (session) {
        session.title = newTitle.value
      }
      showRenameDialog.value = false
      renamingSession.value = null
    }
  } catch (error) {
    console.error('重命名会话失败:', error)
  }
}

// ===== 新增：格式化日期 =====
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days <= 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
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
    selectedSessionId.value = '' // 新增
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

        // 判断是否是会话的第一条消息
        const isFirstMessage = messages.value.filter((m) => m.sender === 'user').length === 1

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
              isFirstMessage: isFirstMessage, // 新增
            }),
          }).catch((err) => console.error('保存对话失败:', err))
        }

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
                  reader.releaseLock()
                  return
                }
              }
            }
          } catch (error) {
            const err = error as Error
            console.warn('⚠️ JSON解析失败:', err.message)
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
            <span class="menu-icon">➕</span>
            新对话
          </div>

          <div
            class="sidebar-item"
            :class="{ 'sidebar-item-active': selectedMenu === 'history' }"
            @click="selectMenu('history')"
          >
            <span class="menu-icon">📋</span>
            历史对话
          </div>
        </div>

        <!-- ===== 新增：历史对话列表 ===== -->
        <div class="history-list" v-if="selectedMenu === 'history'">
          <div v-if="loadingSessions" class="history-loading">加载中...</div>
          <div v-else-if="sessions.length === 0" class="history-empty">暂无历史对话</div>
          <div
            v-for="session in sessions"
            :key="session.sessionId"
            class="history-item"
            :class="{ 'history-item-active': session.sessionId === selectedSessionId }"
            @click="selectSession(session)"
          >
            <div class="history-item-content">
              <div class="history-item-title">
                <span class="history-icon">💬</span>
                {{ session.title || '新对话' }}
              </div>
              <div class="history-item-preview">{{ session.preview }}</div>
              <div class="history-item-time">{{ formatDate(session.createTime) }}</div>
              <div class="history-item-count" v-if="session.messageCount > 1">
                {{ session.messageCount }}条消息
              </div>
            </div>
            <div class="history-item-actions">
              <button
                class="action-btn rename-btn"
                @click="openRenameDialog(session, $event)"
                title="重命名"
              >
                ✏️
              </button>
              <button
                class="action-btn delete-btn"
                @click="deleteSession(session.sessionId, $event)"
                title="删除"
              >
                🗑️
              </button>
            </div>
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
          <!-- ===== 新增：显示当前会话标题 ===== -->
          <div class="chat-header-actions" v-if="selectedMenu === 'history' && selectedSessionId">
            <span class="session-title">{{
              sessions.find((s) => s.sessionId === selectedSessionId)?.title || '历史对话'
            }}</span>
          </div>
        </div>

        <!-- 对话消息列表 -->
        <div class="chat-messages">
          <!-- ===== 新增：加载历史消息时的提示 ===== -->
          <div v-if="loadingHistory" class="loading-history">加载历史消息...</div>
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

    <!-- ===== 新增：重命名对话框 ===== -->
    <div v-if="showRenameDialog" class="dialog-overlay" @click="showRenameDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>重命名对话</h3>
          <button class="dialog-close" @click="showRenameDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <input
            type="text"
            v-model="newTitle"
            class="dialog-input"
            placeholder="请输入新名称"
            @keyup.enter="renameSession"
          />
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn cancel" @click="showRenameDialog = false">取消</button>
          <button class="dialog-btn confirm" @click="renameSession">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --primary-color: #165dff;
  --primary-hover: #0e46cc;
  --primary-light: rgba(22, 93, 255, 0.1);
  --danger-color: #f53f3f;
  --danger-hover: #e13d3d;
  --danger-light: #fff2f2;
  --border-color: #e5e7eb;
  --border-light: #eef1f5;
  --bg-hover: #fafafb;
  --bg-page: #f5f7fa;
  --bg-white: #fff;
  --text-primary: #1d2129;
  --text-secondary: #86909c;
  --text-light: #666;
  --text-lighter: #999;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --radius-sm: 8px;
  --radius-md: 12px;
  --transition-base: all 0.3s ease;
}

.smart-qa-container {
  min-height: 100vh;
  background-color: var(--bg-page);
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--bg-white);
  box-shadow: var(--shadow-sm);
  z-index: 100;
  height: 70px;
  border-bottom: 1px solid var(--border-light);
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
  background-color: var(--primary-color);
  color: var(--bg-white);
  border-radius: var(--radius-sm);
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
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-base);
  border-radius: var(--radius-sm);
}

.nav-item:hover {
  color: var(--primary-color);
  background-color: var(--bg-hover);
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
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
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
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-base);
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: var(--bg-hover);
  color: var(--primary-color);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 按钮基础样式 */
.btn-base {
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition-base);
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: var(--primary-color);
  color: var(--bg-white);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  border-color: var(--primary-hover);
}

.btn-outline {
  background-color: transparent;
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-outline:hover {
  background-color: var(--bg-hover);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-danger {
  background-color: var(--danger-color);
  color: var(--bg-white);
}

.btn-danger:hover {
  background-color: var(--danger-hover);
  box-shadow: var(--shadow-md);
}

.btn-danger:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-icon {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 用户中心下拉菜单 */
.user-center-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  min-width: 120px;
  z-index: 102;
}

.dropdown-item {
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-base);
}

.dropdown-item:hover {
  background-color: var(--bg-hover);
  color: var(--primary-color);
}

.dropdown-item.logout {
  color: var(--danger-color);
}

.dropdown-item.logout:hover {
  background-color: var(--danger-light);
}

/* 主内容区 */
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
  background-color: var(--primary-color);
  color: var(--bg-white);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  display: none;
}

/* 左侧边栏 */
.sidebar {
  width: 280px;
  background-color: var(--bg-white);
  border-right: 1px solid var(--border-color);
  padding: 20px 0;
  transition: var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid #f0f2f5;
}

.sidebar-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0;
}

.sidebar-menu {
  margin-top: 20px;
}

.sidebar-item {
  padding: 16px 20px;
  font-size: 16px;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-base);
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background-color: var(--bg-hover);
  color: var(--primary-color);
}

.sidebar-item-active {
  background-color: var(--bg-hover);
  color: var(--primary-color) !important;
  border-left-color: var(--primary-color);
  font-weight: 500;
}

/* 聊天主区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-page);
  padding: 20px;
  max-width: calc(100% - 280px);
}

.chat-header {
  background-color: var(--bg-white);
  padding: 16px 20px;
  border-radius: var(--radius-md);
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
  color: var(--text-primary);
}

/* 消息列表 */
.chat-messages {
  flex: 1;
  background-color: var(--bg-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
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
  background-color: var(--bg-hover);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  position: relative;
  box-shadow: var(--shadow-sm);
  white-space: pre-wrap;
  word-break: break-word;
}

.message-item-user .message-bubble {
  background-color: var(--primary-color);
  color: var(--bg-white);
}

.message-bubble.loading {
  background-color: #f0f2f5;
  color: var(--text-secondary);
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
  color: var(--text-secondary);
  margin-top: 4px;
  text-align: right;
}

.message-item-user .message-time {
  text-align: left;
}

/* 输入区域 */
.chat-input-area {
  background-color: var(--bg-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 20px;
}

.input-toolbar {
  margin-bottom: 12px;
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
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: inherit;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  line-height: 1.5;
  transition: var(--transition-base);
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.input-tip {
  font-size: 12px;
  color: var(--text-secondary);
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

.file-input {
  display: none;
}

.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
  background-color: var(--bg-hover);
}

.upload-box:hover {
  border-color: var(--primary-color);
  background-color: var(--primary-light);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 8px;
  text-align: center;
}

.upload-hint {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
}

.upload-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 右侧边栏 */
.right-sidebar {
  width: 320px;
  background-color: var(--bg-white);
  border-left: 1px solid var(--border-color);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

/* 历史记录 */
.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  margin-top: 8px;
  border-top: 1px solid #eee;
}

.history-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  background-color: var(--bg-page);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-base);
  position: relative;
}

.history-item:hover {
  background-color: #e9ecef;
}

.history-item-active {
  background-color: #e3f2fd;
  border-left: 3px solid #1976d2;
}

.history-item-content {
  flex: 1;
  min-width: 0;
}

.history-item-title {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.history-icon {
  font-size: 14px;
}

.history-item-preview {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-time {
  font-size: 11px;
  color: var(--text-lighter);
}

.history-item-count {
  font-size: 11px;
  color: #1976d2;
  margin-top: 2px;
}

.history-item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .history-item-actions {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--danger-color);
}

.rename-btn:hover {
  color: #1976d2;
}

/* 统一的状态样式 */
.loading-state,
.empty-state,
.history-loading,
.history-empty,
.loading-history {
  text-align: center;
  padding: 20px;
  color: var(--text-lighter);
  font-size: 14px;
}

/* 对话框样式 */
.dialog-overlay {
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
}

.dialog {
  background-color: white;
  border-radius: var(--radius-md);
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-lighter);
}

.dialog-body {
  padding: 20px;
}

.dialog-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.dialog-input:focus {
  outline: none;
  border-color: #1976d2;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.dialog-btn.cancel {
  background-color: #f5f5f5;
  color: var(--text-light);
}

.dialog-btn.confirm {
  background-color: #1976d2;
  color: white;
}

.dialog-btn.confirm:hover {
  background-color: #1565c0;
}

/* 页脚 */
.footer {
  height: 50px;
  background-color: var(--bg-white);
  border-top: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.footer-content {
  text-align: center;
}

/* 响应式设计 - 优化后的断点 */
/* 大屏幕 */
@media (min-width: 1367px) {
  .sidebar {
    width: 280px;
  }

  .right-sidebar {
    width: 320px;
  }
}

/* 中等屏幕 */
@media (max-width: 1366px) and (min-width: 1025px) {
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

/* 平板 */
@media (max-width: 1024px) and (min-width: 769px) {
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
    width: 240px;
  }

  .sidebar-collapsed {
    transform: translateX(-100%);
  }

  .chat-main {
    max-width: 100%;
    padding: 15px;
  }

  .right-sidebar {
    display: none;
  }

  .message-content {
    max-width: 80%;
  }
}

/* 手机 */
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
    max-width: 100%;
  }

  .message-content {
    max-width: 85%;
  }

  .message-bubble {
    padding: 10px 12px;
    font-size: 13px;
  }

  .upload-box {
    padding: 30px 15px;
  }

  .upload-icon {
    font-size: 36px;
  }

  .upload-text {
    font-size: 14px;
  }

  .upload-hint {
    font-size: 12px;
  }

  .dialog {
    width: 90%;
  }
}
</style>
