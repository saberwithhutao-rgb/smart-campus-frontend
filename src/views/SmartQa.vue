<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api, type ConversationSession, type SessionHistoryItem } from '../api/index'

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
  console.log('loadSessions 开始')
  //記錄開始時間
  const startTime = Date.now()
  loadingSessions.value = true
  try {
    console.log('调用 api.getConversationSessions()')
    const response = await api.getConversationSessions()
    console.log('api 返回原始数据:', response)

    // 检查 response 的结构
    console.log('response.code:', response?.code)
    console.log('response.data:', response?.data)
    console.log('response.data 类型:', typeof response?.data)
    console.log('response.data 是数组吗?', Array.isArray(response?.data))

    if (response?.code === 200) {
      if (Array.isArray(response.data)) {
        sessions.value = response.data
        console.log('sessions.value 已赋值:', sessions.value)
      } else {
        console.error('response.data 不是数组:', response.data)
      }
    } else {
      console.error('response.code 不是 200:', response?.code)
    }
  } catch (error) {
    console.error('loadSessions 捕获到错误:', error)
    console.error('错误详情:', JSON.stringify(error))
  } finally {
    // 記錄結束時間
    const endTime = Date.now()
    console.log('loadSessions 结束，loadingSessions 设为 false')
    console.log('loadSessions 耗时:', endTime - startTime, '毫秒')
    loadingSessions.value = false
  }
}

// ===== 新增：加载某个会话的历史消息 =====
const loadSessionHistory = async (sessionId: string) => {
  loadingHistory.value = true
  console.log('加载会话:', sessionId, '请求URL:', `/ai/chat/history/${sessionId}`)
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

  message.content = content
  if (isLoading !== undefined) {
    message.isLoading = isLoading
  }

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

          if (!jsonStr || jsonStr === '[DONE]') continue

          try {
            const data = JSON.parse(jsonStr)
            if (data.choices && data.choices.length > 0) {
              const choice = data.choices[0]

              if (choice.delta && choice.delta.content) {
                const chunk = choice.delta.content

                for (let i = 0; i < chunk.length; i++) {
                  const char = chunk[i]
                  accumulatedText += char

                  if (!hasReceivedContent && char.trim() !== '') {
                    hasReceivedContent = true
                    safeUpdateMessage(aiMessageIndex, accumulatedText, false)
                  } else if (hasReceivedContent) {
                    safeUpdateMessage(aiMessageIndex, accumulatedText, false)
                  }

                  await new Promise((resolve) => setTimeout(resolve, 20))
                }

                const isDone = choice.finish_reason === 'stop'
                if (isDone) {
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
  if (!inputMessage.value.trim() && !selectedFile.value) return

  const question = inputMessage.value
  const hasFile = selectedFile.value !== null

  // 添加用户消息
  const userMessage: ChatMessage = {
    id: Date.now(),
    content: hasFile ? `📎 ${question || '请分析这个文件'}` : question,
    sender: 'user',
    timestamp: new Date().toLocaleTimeString(),
  }
  messages.value.push(userMessage)
  scrollToBottom()

  // 清空输入
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
    formData.append('question', question || '请分析这个文件')

    let sessionIdToUse = currentSessionId.value
    if (!sessionIdToUse) {
      sessionIdToUse = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
      currentSessionId.value = sessionIdToUse // 保存起来供后续使用
    }
    formData.append('sessionId', sessionIdToUse)

    if (selectedFile.value) {
      formData.append('file', selectedFile.value) // 此时 TypeScript 知道 file 不是 null
    }

    formData.append('stream', 'true')

    console.log('📤 发送流式请求:', {
      question: question || '请分析这个文件',
      hasFile: !!selectedFile.value,
      sessionId: currentSessionId.value,
      stream: true,
    })

    const response = await fetch('/ai/chat/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 响应错误:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      throw new Error(`HTTP ${response.status}`)
    }

    // 检查响应类型
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('text/event-stream')) {
      console.warn('⚠️ 响应类型不是预期的流式格式:', contentType)
      // 尝试当作JSON处理
      const data = await response.json()
      safeUpdateMessage(aiMessageIndex, data.data?.answer || '响应格式错误', false)
    } else {
      await processTongyiStream(response, aiMessageIndex, question || '请分析这个文件')
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
    safeUpdateMessage(
      aiMessageIndex,
      `操作失败: ${error instanceof Error ? error.message : '未知错误'}`,
      false,
    )
  } finally {
    // 如果有文件，清除文件选择
    if (selectedFile.value) {
      selectedFile.value = null
      isUploadMode.value = false
    }
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

// 上传文件（使用流式）
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
    formData.append('question', inputMessage.value || '请分析这个文件')

    let sessionIdToUse = currentSessionId.value
    if (!sessionIdToUse) {
      sessionIdToUse = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
      currentSessionId.value = sessionIdToUse
    }
    formData.append('sessionId', sessionIdToUse)

    formData.append('file', selectedFile.value)
    formData.append('stream', 'true')

    const response = await fetch('/ai/chat/send', {
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

    // 使用流式处理
    await processTongyiStream(response, aiMessageIndex, inputMessage.value || '请分析这个文件')

    // 清除文件选择
    selectedFile.value = null
    isUploadMode.value = false
  } catch (error) {
    console.error('上传失败:', error)
    safeUpdateMessage(
      aiMessageIndex,
      `上传失败: ${error instanceof Error ? error.message : '未知错误'}`,
      false,
    )
  }
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

// 切换侧边栏
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 生命周期
onMounted(async () => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})

// ===== 新增：监听登录状态变化 =====
watch(
  () => userStore.userState.isLoggedIn,
  async (isLoggedIn) => {
    if (isLoggedIn) {
      await loadSessions()
      if (sessions.value.length > 0 && sessions.value[0]) {
        selectSession(sessions.value[0])
      }
    } else {
      // 未登录时清空数据
      sessions.value = []
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
  },
)
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

.user-center {
  position: relative;
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

/* ===== 主要修复部分 ===== */
.main-content {
  display: flex;
  flex: 1;
  margin-top: 70px;
  min-height: calc(100vh - 120px);
  position: relative;
  width: 100%;
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
  flex-shrink: 0; /* 防止侧边栏被压缩 */
  position: relative;
  z-index: 2;
  overflow-y: auto;
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
  display: flex;
  align-items: center;
  gap: 8px;
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

.menu-icon {
  font-size: 16px;
}

/* 历史对话列表 */
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
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
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
  color: #666;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-time {
  font-size: 11px;
  color: #999;
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

.action-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.delete-btn:hover {
  color: #f44336;
}

.rename-btn:hover {
  color: #1976d2;
}

.history-loading,
.history-empty,
.loading-history {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

/* 中间对话区 - 修复部分 */
.chat-main {
  flex: 1; /* 自动占满剩余空间 */
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  padding: 20px;
  /* 删除这行：max-width: calc(100% - 280px); */
  min-width: 0; /* 防止flex子项溢出 */
  overflow-y: auto;
}

.chat-header {
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.chat-header-actions {
  font-size: 14px;
  color: #666;
}

.session-title {
  font-weight: 500;
}

.chat-messages {
  flex: 1;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  overflow-y: auto;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 400px;
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
  flex-shrink: 0; /* 防止被压缩 */
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
  flex-shrink: 0;
}

.footer-content {
  text-align: center;
}

/* 重命名对话框 */
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
  border-radius: 12px;
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
  color: #999;
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
  color: #666;
}

.dialog-btn.confirm {
  background-color: #1976d2;
  color: white;
}

.dialog-btn.confirm:hover {
  background-color: #1565c0;
}

/* 响应式设计 */
@media (max-width: 1366px) {
  .sidebar {
    width: 240px;
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
    width: 280px;
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
  .navbar {
    height: 60px;
  }

  .navbar-container {
    padding: 0 16px;
  }

  .main-content {
    margin-top: 60px;
    min-height: calc(100vh - 110px);
  }

  .sidebar {
    top: 60px;
    height: calc(100vh - 60px);
  }

  .nav-menu {
    display: none;
  }

  .chat-main {
    padding: 10px;
  }

  .message-content {
    max-width: 90%;
  }

  .chat-header {
    padding: 12px 16px;
  }

  .ai-avatar {
    font-size: 24px;
  }

  .ai-name {
    font-size: 16px;
  }

  .message-bubble {
    font-size: 13px;
    padding: 10px 12px;
  }

  .input-container {
    flex-direction: column;
  }

  .send-button {
    width: 100%;
    height: 40px;
  }

  .upload-box {
    padding: 20px;
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

  .upload-actions {
    flex-direction: column;
  }

  .upload-submit,
  .upload-cancel {
    width: 100%;
  }

  .footer {
    height: 40px;
    font-size: 12px;
  }
}

/* 超小屏幕 */
@media (max-width: 480px) {
  .sidebar {
    width: 240px;
  }

  .chat-messages {
    padding: 12px;
  }

  .message-item {
    gap: 8px;
  }

  .message-avatar {
    font-size: 20px;
  }

  .message-content {
    max-width: 85%;
  }

  .message-time {
    font-size: 10px;
  }
}
</style>
