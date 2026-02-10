<template>
  <div class="career-navigation">
    <GlobalNavbar />

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧垂直导航栏 -->
      <aside class="sidebar">
        <div class="sidebar-menu">
          <!-- 竞赛管理 -->
          <div class="sidebar-section">
            <h3 class="section-title">竞赛相关</h3>
            <div class="sidebar-item" @click="router.push('/career/competitions')">
              <span class="item-icon">🏆</span>
              <span class="item-text">竞赛管理</span>
            </div>
            <div class="sidebar-item active">
              <span class="item-icon">🎯</span>
              <span class="item-text">职业导航</span>
            </div>
          </div>

          <!-- 考研支持 -->
          <div class="sidebar-section">
            <h3 class="section-title">考研支持</h3>
            <div class="sidebar-item" @click="router.push('/career/pee')">
              <span class="item-icon">📖</span>
              <span class="item-text">考研支持</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容区 -->
      <main class="content-area">
        <!-- 页面标题 -->
        <h1 class="page-title">职业导航</h1>

        <!-- AI对话区域 -->
        <div class="ai-chat-section">
          <div class="chat-header">
            <h2 class="chat-title">AI 职业咨询</h2>
            <button class="new-chat-btn" @click="startNewChat" :disabled="loading">
              <span class="btn-icon">✨</span>
              <span class="btn-text">新对话</span>
            </button>
          </div>
          <div class="chat-messages" ref="chatMessagesRef">
            <div
              v-for="(msg, index) in chatMessages"
              :key="index"
              class="message-item"
              :class="msg.role"
            >
              <div class="message-avatar">
                <span v-if="msg.role === 'user'" class="user-avatar">👤</span>
                <span v-else class="ai-avatar">🤖</span>
              </div>
              <div class="message-content">
                <div v-if="msg.role === 'ai' && msg.isThinking" class="thinking-indicator">
                  <div class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span class="thinking-text">AI 正在思考中...</span>
                </div>
                <div class="message-text" v-html="formatMessage(msg.content)"></div>
              </div>
            </div>
          </div>
          <div class="chat-input-area">
            <textarea
              class="chat-input"
              v-model="inputMessage"
              placeholder="请输入您的问题..."
              @keydown.enter.prevent="sendMessage"
              rows="3"
            ></textarea>
            <button
              class="send-btn"
              @click="sendMessage"
              :disabled="!inputMessage.trim() || loading"
            >
              <span v-if="loading" class="loading-icon"></span>
              <span>{{ loading ? '发送中...' : '发送' }}</span>
            </button>
          </div>
        </div>

        <!-- 顶部功能卡片区域 -->
        <div class="top-cards">
          <!-- AI智能对话卡片 -->
          <div class="card ai-chat-card">
            <h3 class="card-title">AI职业咨询</h3>
            <p class="card-description">与AI智能助手对话，获取专业的职业建议和指导</p>
          </div>

          <!-- 职业测评卡片 -->
          <div class="card">
            <h3 class="card-title">职业测评</h3>
            <p class="card-description">了解你的职业兴趣和能力倾向，探索适合的职业方向</p>
            <div class="assessment-buttons">
              <button class="btn-secondary">兴趣测评</button>
              <button class="btn-secondary">能力测评</button>
              <button class="btn-secondary">性格测评</button>
            </div>
            <button class="btn-primary">开始测评</button>
          </div>

          <!-- 职业路径规划卡片 -->
          <div class="card">
            <h3 class="card-title">职业路径规划</h3>
            <p class="card-description">定制你的职业发展路线，设定短期和长期目标</p>
            <div class="path-steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-text">自我评估</div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-text">目标设定</div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-text">行动规划</div>
              </div>
            </div>
            <button class="btn-primary">制定计划</button>
          </div>

          <!-- 岗位推荐卡片 -->
          <div class="card">
            <h3 class="card-title">岗位推荐</h3>
            <p class="card-description">根据你的技能和兴趣推荐合适的职业岗位</p>
            <div class="recommendation-stats">
              <div class="stat-item">
                <div class="stat-number">25</div>
                <div class="stat-label">匹配岗位</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">8</div>
                <div class="stat-label">今日更新</div>
              </div>
            </div>
            <button class="btn-primary">查看推荐</button>
          </div>
        </div>

        <!-- 热门职业方向 -->
        <h2 class="section-title">热门职业方向</h2>
        <div class="career-directions">
          <!-- 软件开发工程师 -->
          <div class="career-card">
            <div class="career-icon">
              <span class="icon">💻</span>
            </div>
            <h3 class="career-title">软件开发工程师</h3>
            <p class="career-description">开发和维护软件应用系统，包括前端和后端开发</p>
            <div class="skills">
              <span class="skill-tag">Java</span>
              <span class="skill-tag">Python</span>
              <span class="skill-tag">前端</span>
            </div>
            <div class="salary">
              <span class="salary-icon">💰</span>
              <span class="salary-text">平均薪资: 15-25K</span>
            </div>
            <button class="btn-secondary">了解详情</button>
          </div>

          <!-- 数据分析师 -->
          <div class="career-card">
            <div class="career-icon">
              <span class="icon">📊</span>
            </div>
            <h3 class="career-title">数据分析师</h3>
            <p class="career-description">分析和解读数据，支持业务决策，发现数据价值</p>
            <div class="skills">
              <span class="skill-tag">SQL</span>
              <span class="skill-tag">Python</span>
              <span class="skill-tag">统计学</span>
            </div>
            <div class="salary">
              <span class="salary-icon">💰</span>
              <span class="salary-text">平均薪资: 12-20K</span>
            </div>
            <button class="btn-secondary">了解详情</button>
          </div>

          <!-- 人工智能工程师 -->
          <div class="career-card">
            <div class="career-icon">
              <span class="icon">🤖</span>
            </div>
            <h3 class="career-title">人工智能工程师</h3>
            <p class="career-description">开发和应用人工智能技术，包括机器学习和深度学习</p>
            <div class="skills">
              <span class="skill-tag">机器学习</span>
              <span class="skill-tag">深度学习</span>
              <span class="skill-tag">Python</span>
            </div>
            <div class="salary">
              <span class="salary-icon">💰</span>
              <span class="salary-text">平均薪资: 20-35K</span>
            </div>
            <button class="btn-secondary">了解详情</button>
          </div>

          <!-- 网络安全工程师 -->
          <div class="career-card">
            <div class="career-icon">
              <span class="icon">🔒</span>
            </div>
            <h3 class="career-title">网络安全工程师</h3>
            <p class="career-description">保护网络系统安全，防范黑客攻击和数据泄露</p>
            <div class="skills">
              <span class="skill-tag">网络安全</span>
              <span class="skill-tag">渗透测试</span>
              <span class="skill-tag">加密技术</span>
            </div>
            <div class="salary">
              <span class="salary-icon">💰</span>
              <span class="salary-text">平均薪资: 18-30K</span>
            </div>
            <button class="btn-secondary">了解详情</button>
          </div>

          <!-- 移动开发工程师 -->
          <div class="career-card">
            <div class="career-icon">
              <span class="icon">📱</span>
            </div>
            <h3 class="career-title">移动开发工程师</h3>
            <p class="career-description">开发移动应用程序，包括iOS和Android平台</p>
            <div class="skills">
              <span class="skill-tag">iOS</span>
              <span class="skill-tag">Android</span>
              <span class="skill-tag">Flutter</span>
            </div>
            <div class="salary">
              <span class="salary-icon">💰</span>
              <span class="salary-text">平均薪资: 15-28K</span>
            </div>
            <button class="btn-secondary">了解详情</button>
          </div>

          <!-- 云计算工程师 -->
          <div class="career-card">
            <div class="career-icon">
              <span class="icon">☁️</span>
            </div>
            <h3 class="career-title">云计算工程师</h3>
            <p class="career-description">设计和管理云计算基础设施，包括公有云和私有云</p>
            <div class="skills">
              <span class="skill-tag">AWS</span>
              <span class="skill-tag">阿里云</span>
              <span class="skill-tag">Docker</span>
            </div>
            <div class="salary">
              <span class="salary-icon">💰</span>
              <span class="salary-text">平均薪资: 18-32K</span>
            </div>
            <button class="btn-secondary">了解详情</button>
          </div>
        </div>

        <!-- 职业资讯 -->
        <h2 class="section-title">职业资讯</h2>
        <div class="career-news">
          <div class="news-card">
            <h3 class="news-title">2024年IT行业就业趋势分析</h3>
            <p class="news-summary">
              随着人工智能技术的快速发展，IT行业就业市场呈现出新的趋势和机遇...
            </p>
            <div class="news-meta">
              <span class="news-date">2024-03-15</span>
              <span class="news-source">IT行业观察</span>
            </div>
            <button class="btn-secondary">阅读全文</button>
          </div>

          <div class="news-card">
            <h3 class="news-title">程序员必备的10项核心技能</h3>
            <p class="news-summary">在竞争激烈的职场中，掌握这些核心技能将帮助你脱颖而出...</p>
            <div class="news-meta">
              <span class="news-date">2024-03-10</span>
              <span class="news-source">技术博客</span>
            </div>
            <button class="btn-secondary">阅读全文</button>
          </div>

          <div class="news-card">
            <h3 class="news-title">如何制定有效的职业发展计划</h3>
            <p class="news-summary">
              一个好的职业发展计划可以帮助你明确目标，规划路径，实现职业成功...
            </p>
            <div class="news-meta">
              <span class="news-date">2024-03-05</span>
              <span class="news-source">职业发展指南</span>
            </div>
            <button class="btn-secondary">阅读全文</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'

// 路由实例
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()

// 检查屏幕尺寸 - 响应式设计
const isMobile = ref(false)
const showUserCenter = ref(false)

// AI对话相关
const inputMessage = ref('')
const chatMessages = ref<Array<{ role: string; content: string; isThinking?: boolean }>>([])
const loading = ref(false)
const chatMessagesRef = ref<HTMLElement | null>(null)
const chanId = ref('')
const streamingResponse = ref('')
const isStreaming = ref(false)

// 开始新对话
const startNewChat = () => {
  chatMessages.value = []
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  chanId.value = `user_${timestamp}_${random}`

  chatMessages.value.push({
    role: 'ai',
    content: '我是职业导航智能顾问，你有任何职业上的问题都能来问我',
  })
}

// 发送消息（支持流式输出）
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || loading.value || isStreaming.value) return

  const userMsg = { role: 'user', content: message }
  chatMessages.value.push(userMsg)
  inputMessage.value = ''
  loading.value = true
  isStreaming.value = true
  streamingResponse.value = ''

  try {
    const response = await api.sendAiMessage(message, chanId.value)
    if (response) {
      const aiMsg = { role: 'ai', content: '', isThinking: true }
      chatMessages.value.push(aiMsg)

      const aiMsgIndex = chatMessages.value.length - 1
      await simulateStreaming(response, aiMsgIndex)
    }
  } catch (err) {
    console.error('AI对话失败:', err)
    const errorMsg = { role: 'ai', content: '抱歉，我遇到了一些问题，请稍后重试。' }
    chatMessages.value.push(errorMsg)
  } finally {
    loading.value = false
    isStreaming.value = false
    scrollToBottom()
  }
}

// 模拟流式输出效果
const simulateStreaming = async (text: string, msgIndex: number) => {
  const chars = text.split('')
  for (let i = 0; i < chars.length; i++) {
    if (chatMessages.value[msgIndex]) {
      chatMessages.value[msgIndex].content += chars[i]
    }
    scrollToBottom()
    await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 20))
  }

  if (chatMessages.value[msgIndex]) {
    chatMessages.value[msgIndex].isThinking = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

// 格式化消息内容（支持换行和简单格式）
const formatMessage = (content: string) => {
  return content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

// 生命周期钩子 - 初始化和窗口大小监听
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  startNewChat()
})
</script>

<style scoped>
/* 主容器 */
.career-navigation {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

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
  height: 70px;
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
.user-center {
  position: relative;
}

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

/* 个人中心下拉菜单 */
.user-center-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--white);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 8px 0;
  min-width: 140px;
  z-index: 200;
  margin-top: 8px;
}

.dropdown-item {
  padding: 12px 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
}

.dropdown-item:hover {
  background-color: var(--bg-color-light);
  color: var(--primary-color);
}

.dropdown-item.logout {
  color: var(--accent-color);
}

.dropdown-item.logout:hover {
  background-color: var(--accent-color);
  color: #fff;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .nav-menu {
    display: none;
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
}

/* 主体内容区 */
.main-content {
  display: flex;
  flex: 1;
  margin-top: 60px;
  position: relative;
}

/* 左侧垂直导航栏 */
.sidebar {
  width: 220px;
  background-color: white;
  border-right: 1px solid #e0e6ed;
  padding: 20px 0;
  height: calc(100vh - 60px);
  overflow-y: auto;
  position: fixed;
  left: 0;
  top: 60px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.sidebar-menu {
  padding: 0 16px;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-section h3.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #646b7a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding: 0 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #333;
}

.sidebar-item:hover {
  background-color: #f0f9ff;
  color: #409eff;
}

.sidebar-item.active {
  background-color: #f0f9ff;
  color: #409eff;
  font-weight: 500;
}

.item-icon {
  font-size: 16px;
}

/* 右侧主内容区 */
.content-area {
  margin-left: 220px;
  flex: 1;
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

/* 页面标题 */
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
}

/* 顶部功能卡片区域 */
.top-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.card {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.card-description {
  font-size: 14px;
  color: #646b7a;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

/* 评估按钮 */
.assessment-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

/* 路径步骤 */
.path-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 8px;
}

.step-text {
  font-size: 12px;
  color: #646b7a;
  text-align: center;
}

/* 推荐统计 */
.recommendation-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #646b7a;
}

/* 按钮样式 */
.btn-primary {
  width: 100%;
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-secondary {
  padding: 8px 16px;
  background-color: transparent;
  color: #409eff;
  border: 1px solid #409eff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #f0f9ff;
}

/* AI对话区域 */
.ai-chat-section {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 12px;
  padding: 0;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e6ed;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chat-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.new-chat-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.new-chat-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
}

.btn-text {
  font-size: 14px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #fafafa;
  min-height: 300px;
  max-height: calc(100vh - 300px);
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message-item.user {
  justify-content: flex-end;
}

.message-item.ai {
  justify-content: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message-item.user .message-avatar {
  order: 2;
}

.message-item.ai .message-avatar {
  order: 1;
}

.user-avatar {
  background-color: #409eff;
  color: white;
}

.ai-avatar {
  background-color: #67c23a;
  color: white;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-item.user .message-content {
  order: 1;
  align-items: flex-end;
}

.message-item.ai .message-content {
  order: 2;
  align-items: flex-start;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
  display: inline-block;
  max-width: 100%;
}

.message-item.user .message-text {
  background-color: #409eff;
  color: white;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
}

.message-item.ai .message-text {
  background-color: white;
  color: #333;
  border: 1px solid #e0e6ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf3 100%);
  border-radius: 12px;
  border: 1px solid #d4e4f7;
  margin-bottom: 8px;
}

.thinking-dots {
  display: flex;
  gap: 6px;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background-color: #409eff;
  border-radius: 50%;
  animation: thinking-bounce 1.4s infinite ease-in-out both;
}

.thinking-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0s;
}

@keyframes thinking-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.thinking-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.chat-input-area {
  padding: 16px;
  border-top: 1px solid #e0e6ed;
  background-color: white;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.chat-input:focus {
  outline: none;
  border-color: #409eff;
}

.send-btn {
  padding: 10px 24px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

.send-btn:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
}

.send-btn:disabled .loading-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 顶部功能卡片区域 */
.content-area h2.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.career-directions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.career-card {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.career-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.career-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #f0f9ff;
  border-radius: 50%;
  margin: 0 0 16px 0;
}

.career-icon .icon {
  font-size: 24px;
  color: #409eff;
}

.career-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.career-description {
  font-size: 14px;
  color: #646b7a;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.skills {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.skill-tag {
  padding: 2px 8px;
  background-color: #f0f9ff;
  color: #409eff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.salary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.salary-icon {
  font-size: 16px;
  color: #67c23a;
}

.salary-text {
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

/* 职业资讯 */
.career-news {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 20px;
}

.news-card {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.news-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.news-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.news-summary {
  font-size: 14px;
  color: #646b7a;
  margin: 0 0 16px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #86909c;
}

.news-date,
.news-source {
  display: flex;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .top-cards,
  .career-directions,
  .career-news {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }

  .nav-menu.mobile-menu {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #2c3e50;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 16px;
    gap: 8px;
  }

  .chat-header {
    padding: 16px 20px;
  }

  .chat-title {
    font-size: 16px;
  }

  .new-chat-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .btn-text {
    display: none;
  }

  .message-item {
    gap: 8px;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .chat-messages {
    max-height: calc(100vh - 250px);
  }

  .chat-input-area {
    padding: 12px;
  }

  .chat-input {
    font-size: 13px;
  }

  .send-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}

.sidebar {
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 99;
}

.content-area {
  margin-left: 0;
  padding: 16px;
}

.top-cards,
.career-directions,
.career-news {
  grid-template-columns: 1fr;
}

.navbar-container {
  padding: 0 16px;
}

.nav-actions {
  gap: 8px;
}

.btn-login,
.btn-user-center {
  padding: 6px 12px;
  font-size: 13px;
}

.ai-chat-content {
  max-width: 95%;
  max-height: 90vh;
}

.chat-input {
  width: 100%;
}
</style>
