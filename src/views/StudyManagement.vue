<template>
  <div class="study-management-container">
    <!-- 顶部导航栏 - 与首页保持一致 -->
    <nav class="navbar">
      <div class="navbar-container">
        <!-- Logo区域 -->
        <div class="logo" @click="goToIndex">
          <div class="logo-placeholder">logo</div>
        </div>

        <!-- 导航菜单 -->
        <div class="nav-menu" :class="{ 'mobile-menu': isMobile }">
          <div
            class="nav-item"
            :class="{ active: activeMenu === '首页' }"
            @click="handleMenuClick('首页')"
            @mouseenter="showSubMenuHandler('首页')"
            @mouseleave="hideSubMenu"
          >
            首页
          </div>

          <div
            class="nav-item has-submenu"
            @mouseenter="showSubMenuHandler('个性化学习伴侣')"
            @mouseleave="hideSubMenu"
            @click="handleMenuClick('个性化学习伴侣')"
          >
            个性化学习伴侣
            <!-- 子菜单悬浮层 -->
            <div v-if="showSubMenu === '个性化学习伴侣' && !isMobile" class="submenu">
              <!-- 智能问答 - 点击跳转到智能问答页面 -->
              <div class="submenu-item" @click="goToSmartQA">智能问答</div>
              <!-- 个性化规划 - 点击跳转到个性化规划页面 -->
              <div class="submenu-item" @click="goToPersonalStudy">个性化规划</div>
            </div>
            <!-- 移动端子菜单 -->
            <div v-if="showSubMenu === '个性化学习伴侣' && isMobile" class="mobile-submenu">
              <!-- 智能问答 - 点击跳转到智能问答页面 -->
              <div class="mobile-submenu-item" @click="goToSmartQA">智能问答</div>
              <!-- 个性化规划 - 点击跳转到个性化规划页面 -->
              <div class="mobile-submenu-item" @click="goToPersonalStudy">个性化规划</div>
            </div>
          </div>

          <div
            class="nav-item has-submenu"
            @mouseenter="showSubMenuHandler('校园生活')"
            @mouseleave="hideSubMenu"
            @click="handleMenuClick('校园生活')"
          >
            校园生活
            <!-- 子菜单悬浮层 -->
            <div v-if="showSubMenu === '校园生活' && !isMobile" class="submenu">
              <div class="submenu-item" @click="goToStudyManagement">学习管理</div>
              <div class="submenu-item" @click="router.push('/campus/library')">馆藏实况</div>
            </div>
            <!-- 移动端子菜单 -->
            <div v-if="showSubMenu === '校园生活' && isMobile" class="mobile-submenu">
              <div class="mobile-submenu-item" @click="goToStudyManagement">学习管理</div>
              <div class="mobile-submenu-item" @click="router.push('/campus/library')">
                馆藏实况
              </div>
            </div>
          </div>

          <div
            class="nav-item has-submenu"
            @mouseenter="showSubMenuHandler('竞赛相关')"
            @mouseleave="hideSubMenu"
            @click="handleMenuClick('竞赛相关')"
          >
            竞赛相关
            <!-- 子菜单悬浮层 -->
            <div v-if="showSubMenu === '竞赛相关' && !isMobile" class="submenu">
              <div class="submenu-item" @click="goToCompetitionManagement">竞赛管理</div>
              <div class="submenu-item" @click="goToCareerNavigation">职业导航</div>
              <div class="submenu-item" @click="goToExamSupport">考研支持</div>
            </div>
            <!-- 移动端子菜单 -->
            <div v-if="showSubMenu === '竞赛相关' && isMobile" class="mobile-submenu">
              <div class="mobile-submenu-item" @click="goToCompetitionManagement">竞赛管理</div>
              <div class="mobile-submenu-item" @click="goToCareerNavigation">职业导航</div>
              <div class="mobile-submenu-item" @click="goToExamSupport">考研支持</div>
            </div>
          </div>
        </div>

        <!-- 右侧操作区 -->
        <div class="nav-actions">
          <!-- 登录按钮 - 未登录时显示 -->
          <button v-if="!userStore.userState.isLoggedIn" class="btn-login" @click="goToLogin">
            <span class="login-icon">👤</span>
            登录
          </button>

          <!-- 个人中心 -->
          <div class="user-center">
            <button class="btn-user-center" @click="toggleUserCenter">个人中心</button>
            <!-- 个人中心下拉菜单 -->
            <div v-if="showUserCenter" class="user-center-dropdown">
              <div class="dropdown-item" @click="handleUserMenuClick('个人信息')">个人信息</div>
              <div class="dropdown-item logout" @click="handleUserMenuClick('退出登录')">
                退出登录
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 移动端侧边栏切换按钮 -->
      <button class="sidebar-toggle" @click="toggleSidebar" v-if="isMobile">
        {{ showSidebar ? '关闭' : '打开' }}侧边栏
      </button>

      <!-- 左侧功能栏 -->
      <aside class="sidebar" :class="{ 'sidebar-collapsed': !showSidebar && isMobile }">
        <div class="sidebar-header">
          <h2 class="sidebar-title">学习管理</h2>
        </div>

        <div class="sidebar-menu">
          <!-- 统计分析选项 -->
          <div
            class="sidebar-item"
            :class="{ 'sidebar-item-active': selectedMenu === 'statistics' }"
            @click="selectMenu('statistics')"
          >
            统计分析
          </div>

          <!-- 学习建议选项 -->
          <div
            class="sidebar-item"
            :class="{ 'sidebar-item-active': selectedMenu === 'suggestion' }"
            @click="selectMenu('suggestion')"
          >
            学习建议
          </div>
        </div>
      </aside>

      <!-- 右侧主内容区 -->
      <section class="content-area">
        <!-- 统计分析页面内容 -->
        <div v-if="selectedMenu === 'statistics'">
          <!-- 时间导航栏 -->
          <div class="time-nav">
            <button
              class="time-btn"
              :class="{ active: selectedTimeRange === 'today' }"
              @click="selectTimeRange('today')"
            >
              今天
            </button>
            <button
              class="time-btn"
              :class="{ active: selectedTimeRange === 'week' }"
              @click="selectTimeRange('week')"
            >
              过去一周
            </button>
            <button
              class="time-btn"
              :class="{ active: selectedTimeRange === 'month' }"
              @click="selectTimeRange('month')"
            >
              过去一个月
            </button>
          </div>

          <!-- 可视化图表模块 -->
          <div class="visualization-module">
            <!-- 完成率进度条 -->
            <div class="progress-bar-container">
              <div class="progress-info">
                <span class="progress-label">完成率</span>
                <span class="progress-percentage"
                  >{{ ((statistics?.completionRate || 0) * 100).toFixed(2) }}%</span
                >
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width: `${(statistics?.completionRate || 0) * 100}%`,
                    backgroundColor: '#409eff',
                  }"
                ></div>
              </div>
            </div>

            <!-- 环形图和饼图容器 -->
            <div class="charts-container">
              <!-- 环形图 -->
              <div class="chart-item">
                <h3>计划状态分布</h3>
                <div class="donut-chart" ref="donutChartRef"></div>
              </div>

              <!-- 饼图 -->
              <div class="chart-item">
                <h3>{{ pieChartTitle }}</h3>
                <div class="pie-chart" ref="pieChartRef"></div>
              </div>
            </div>
          </div>

          <!-- 学习计划统计分析 -->
          <div class="study-dashboard">
            <!-- 错误提示 -->
            <div v-if="error" class="error-message">
              {{ error }}
            </div>

            <!-- 统计数据 -->
            <div v-if="statistics" class="statistics-card">
              <h3>统计数据</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">总计划数</span>
                  <span class="stat-value">{{ statistics.totalPlanCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">已完成计划数</span>
                  <span class="stat-value">{{ statistics.completedPlanCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">完成率</span>
                  <span class="stat-value"
                    >{{ ((statistics.completionRate || 0) * 100).toFixed(2) }}%</span
                  >
                </div>
                <div class="stat-item">
                  <span class="stat-label">未完成计划数</span>
                  <span class="stat-value">{{ statistics.unfinishedCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">延期计划数</span>
                  <span class="stat-value">{{ statistics.overduePlanCount || 0 }}</span>
                </div>
              </div>

              <!-- 难度分布 -->
              <div class="distribution-section" v-if="statistics.difficultyDistribution">
                <h4>难度分布</h4>
                <div class="distribution-list">
                  <div
                    v-for="item in statistics.difficultyDistribution.details"
                    :key="item.type"
                    class="distribution-item"
                  >
                    <span>{{ item.type }}</span>
                    <span>{{ item.count }}个 ({{ (item.percentage * 100).toFixed(2) }}%)</span>
                  </div>
                </div>
              </div>

              <!-- 计划类型分布 -->
              <div class="distribution-section" v-if="statistics.planTypeDistribution">
                <h4>计划类型分布</h4>
                <div class="distribution-list">
                  <div
                    v-for="item in statistics.planTypeDistribution.details"
                    :key="item.type"
                    class="distribution-item"
                  >
                    <span>{{ item.type }}</span>
                    <span>{{ item.count }}个 ({{ (item.percentage * 100).toFixed(2) }}%)</span>
                  </div>
                </div>
              </div>

              <!-- 各科目计划数量 -->
              <div class="distribution-section" v-if="statistics.subjectDistribution">
                <h4>各科目计划数量</h4>
                <div class="distribution-list">
                  <div
                    v-for="(count, subject) in statistics.subjectDistribution"
                    :key="subject"
                    class="distribution-item"
                  >
                    <span>{{ subject }}</span>
                    <span>{{ count }}个</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 无数据提示 -->
            <div v-else-if="!loading" class="no-data">暂无数据</div>
          </div>
        </div>

        <!-- 学习建议页面内容 -->
        <div v-else-if="selectedMenu === 'suggestion'">
          <!-- 时间导航栏 -->
          <div class="time-nav">
            <button
              class="time-btn"
              :class="{ active: selectedTimeRange === 'today' }"
              @click="selectTimeRange('today')"
            >
              今天
            </button>
            <button
              class="time-btn"
              :class="{ active: selectedTimeRange === 'week' }"
              @click="selectTimeRange('week')"
            >
              过去一周
            </button>
            <button
              class="time-btn"
              :class="{ active: selectedTimeRange === 'month' }"
              @click="selectTimeRange('month')"
            >
              过去一个月
            </button>
          </div>

          <!-- 学习计划统计分析 -->
          <div class="study-dashboard">
            <!-- 错误提示 -->
            <div v-if="error" class="error-message">
              {{ error }}
            </div>

            <!-- 学习建议 -->
            <div v-if="suggestions && suggestions.length > 0" class="suggestions-card">
              <h3>学习建议</h3>
              <div class="suggestion-list">
                <div
                  v-for="(suggestion, index) in suggestions"
                  :key="index"
                  class="suggestion-item"
                >
                  {{ suggestion }}
                </div>
              </div>
            </div>

            <!-- 无数据提示 -->
            <div v-else-if="!loading" class="no-data">暂无学习建议</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { getStudyStatistics, getStudySuggestions } from '../api/study'
import * as echarts from 'echarts'

// 路由实例
const router = useRouter()
const route = useRoute()

// 用户状态管理
const userStore = useUserStore()

// 响应式数据 - 导航栏相关
const showUserCenter = ref(false) // 显示个人中心菜单
const activeMenu = ref('') // 当前激活的菜单
const showSubMenu = ref('') // 显示子菜单
const isMobile = ref(false) // 是否为移动端
const showSidebar = ref(true) // 左侧导航栏是否显示
const selectedMenu = ref('statistics') // 当前激活的菜单
const selectedTimeRange = ref('today') // 当前选中的时间范围

// 响应式数据 - 后端数据
const statisticsData = ref({}) // 统计分析数据
const analysisData = ref({}) // 学习数据分析结果
const suggestionData = ref({}) // 学习建议数据
const loading = ref(false) // 加载状态
const userId = ref(1) // 用户ID
const error = ref('') // 错误信息
const statistics = ref(null) // 统计数据
const suggestions = ref([]) // 学习建议

// 图表引用
const donutChartRef = ref(null) // 环形图引用
const pieChartRef = ref(null) // 饼图引用
// 图表实例
let donutChartInstance = null // 环形图实例
let pieChartInstance = null // 饼图实例

// 计算属性 - 动态饼图标题
// 统一三个时间维度都显示「计划难度分布」
const pieChartTitle = computed(() => {
  return '计划难度分布'
})

// 根据路由路径更新选中的菜单
const updateSelectedMenu = () => {
  if (route.path === '/campus/analysis') {
    selectedMenu.value = 'statistics'
  } else if (route.path === '/campus/advice') {
    selectedMenu.value = 'suggestion'
  }
}

// 检查屏幕尺寸 - 响应式设计
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
  // 小屏幕时折叠左侧导航栏
  if (window.innerWidth < 768) {
    showSidebar.value = false
  } else {
    showSidebar.value = true
  }
}

// 导航栏跳转函数 - 与首页保持一致
const goToIndex = () => {
  router.push('/index')
}

const goToLogin = () => {
  router.push('/login')
}

const goToSmartQA = () => {
  router.push('/ai/chat')
}

const goToPersonalStudy = () => {
  router.push('/ai/study')
}

const goToStudyManagement = () => {
  router.push('/campus/analysis')
}

const goToCompetitionManagement = () => {
  router.push('/career/competitions')
}

// 跳转到职业导航页面
const goToCareerNavigation = () => {
  router.push('/career/position')
}

// 跳转到考研支持页面
const goToExamSupport = () => {
  router.push('/career/pee')
}

const toggleUserCenter = () => {
  showUserCenter.value = !showUserCenter.value
}

const closeUserCenter = () => {
  showUserCenter.value = false
}

const showSubMenuHandler = (menu: string) => {
  if (!isMobile.value) {
    showSubMenu.value = menu
  }
}

const hideSubMenu = () => {
  showSubMenu.value = ''
}

const handleMenuClick = (menu: string) => {
  if (menu === '首页') {
    // 点击首页，跳转到首页
    goToIndex()
    activeMenu.value = '首页'
    return
  }

  if (isMobile.value) {
    if (showSubMenu.value === menu) {
      showSubMenu.value = ''
    } else {
      showSubMenu.value = menu
    }
  } else {
    if (['个性化学习伴侣', '校园生活', '竞赛相关'].includes(menu)) {
      showSubMenuHandler(menu)
      activeMenu.value = menu
    } else {
      hideSubMenu()
      activeMenu.value = ''
    }
  }
}

// 处理用户菜单点击
const handleUserMenuClick = (item: string) => {
  if (item === '个人信息') {
    router.push('/profile')
  } else if (item === '退出登录') {
    router.push('/login')
  }
  closeUserCenter()
}

// 切换侧边栏显示
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 左侧导航菜单选择处理
const selectMenu = async (menu: string) => {
  selectedMenu.value = menu
  // 跳转到对应的URL
  if (menu === 'statistics') {
    router.push('/campus/analysis')
  } else if (menu === 'suggestion') {
    router.push('/campus/advice')
  }
  console.log('当前选中模块:', menu)
  // 切换菜单后重新加载数据
  await fetchData()
}

// 时间范围选择处理
const selectTimeRange = (timeRange: string) => {
  selectedTimeRange.value = timeRange
  console.log('当前选中时间范围:', timeRange)
  // 根据时间范围获取数据
  fetchData()
}

// 获取数据
const fetchData = async () => {
  // 验证参数
  if (!userId.value) {
    error.value = '请输入用户ID'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 打印请求参数
    console.log('请求参数:', {
      timeRange: selectedTimeRange.value,
      userId: userId.value,
    })

    // 模拟静态测试数据 - 覆盖三个时间维度
    let statsData = {}
    let suggestionsData = { suggestions: [] }

    // 根据时间范围生成对应的测试数据
    switch (selectedTimeRange.value) {
      case 'today':
        statsData = {
          totalPlanCount: 10,
          completedPlanCount: 6,
          completionRate: 0.6,
          unfinishedCount: 4,
          overduePlanCount: 1,
          planTypeDistribution: {
            details: [
              { type: '学习', count: 5 },
              { type: '工作', count: 3 },
              { type: '生活', count: 2 },
            ],
          },
          difficultyDistribution: {
            details: [
              { type: 'easy', count: 3 },
              { type: 'medium', count: 5 },
              { type: 'hard', count: 2 },
            ],
          },
        }
        suggestionsData = {
          suggestions: [
            '今天的学习计划完成率不错，继续保持！',
            '建议适当增加一些困难级别的任务，挑战自己。',
          ],
        }
        break
      case 'week':
        statsData = {
          totalPlanCount: 35,
          completedPlanCount: 21,
          completionRate: 0.6,
          unfinishedCount: 14, // 未完成总数
          overduePlanCount: 3, // 延期数
          planTypeDistribution: {
            details: [
              { type: '学习', count: 18 },
              { type: '工作', count: 10 },
              { type: '生活', count: 7 },
            ],
          },
          difficultyDistribution: {
            details: [
              { type: 'easy', count: 12 },
              { type: 'medium', count: 18 },
              { type: 'hard', count: 5 },
            ],
          },
        }
        suggestionsData = {
          suggestions: [
            '本周的学习计划完成率达到了60%，继续努力！',
            '建议平衡各类型计划的分配，保持全面发展。',
          ],
        }
        break
      case 'month':
        statsData = {
          totalPlanCount: 120,
          completedPlanCount: 84,
          completionRate: 0.7,
          unfinishedCount: 36, // 未完成总数
          overduePlanCount: 8, // 延期数
          planTypeDistribution: {
            details: [
              { type: '学习', count: 60 },
              { type: '工作', count: 35 },
              { type: '生活', count: 25 },
            ],
          },
          difficultyDistribution: {
            details: [
              { type: 'easy', count: 40 },
              { type: 'medium', count: 60 },
              { type: 'hard', count: 20 },
            ],
          },
        }
        suggestionsData = {
          suggestions: [
            '本月的学习计划完成率达到了70%，非常棒！',
            '建议设定更高的目标，挑战自己的潜力。',
          ],
        }
        break
      default:
        statsData = {
          totalPlanCount: 0,
          completedPlanCount: 0,
          completionRate: 0,
          unfinishedCount: 0,
          overduePlanCount: 0,
          planTypeDistribution: {
            details: [],
          },
          difficultyDistribution: {
            details: [],
          },
        }
        suggestionsData = { suggestions: [] }
    }

    // 尝试请求真实接口
    try {
      const [realStatsData, realSuggestionsData] = await Promise.all([
        getStudyStatistics({
          timeRange: selectedTimeRange.value,
          userId: userId.value,
        }),
        getStudySuggestions({
          timeRange: selectedTimeRange.value,
          userId: userId.value,
        }),
      ])

      // 使用真实数据
      statsData = realStatsData
      suggestionsData = realSuggestionsData
      console.log('使用真实后端数据')
    } catch (apiError) {
      console.log('使用静态测试数据')
    }

    // 打印响应数据
    console.log('统计数据:', statsData)
    console.log('学习建议:', suggestionsData)

    // 保存数据
    statistics.value = statsData
    suggestions.value = suggestionsData.suggestions || suggestionsData || []

    // 打印保存后的数据
    console.log('保存后的统计数据:', statistics.value)
    console.log('保存后的学习建议:', suggestions.value)
  } catch (err: any) {
    // 处理错误
    console.error('请求失败:', err)
    error.value = err.message || '请求失败，请稍后重试'
    statistics.value = null
    suggestions.value = []
  } finally {
    loading.value = false
  }
}

// 初始化环形图
const initDonutChart = () => {
  if (!donutChartRef.value || !statistics.value) return

  // 销毁已有的图表实例
  if (donutChartInstance) {
    donutChartInstance.dispose()
  }

  // 创建新的图表实例
  donutChartInstance = echarts.init(donutChartRef.value)

  // 计算总计划数
  const totalCount = statistics.value.totalPlanCount || 0

  // 准备数据
  // 确保与下方统计数据完全一致
  console.log('环形图数据来源:', {
    completedPlanCount: statistics.value.completedPlanCount,
    unfinishedCount: statistics.value.unfinishedCount,
    overduePlanCount: statistics.value.overduePlanCount,
  })

  // 直接使用统计数据中的字段，确保完全一致
  const completedCount = statistics.value.completedPlanCount || 0
  const unfinishedCount = statistics.value.unfinishedCount || 0
  const overdueCount = statistics.value.overduePlanCount || 0

  console.log('环形图最终数据:', {
    completedCount,
    unfinishedCount,
    overdueCount,
  })

  const data = [
    {
      name: '已完成',
      value: completedCount,
      itemStyle: {
        color: '#67c23a', // 绿色
      },
    },
    {
      name: '未完成',
      value: unfinishedCount,
      itemStyle: {
        color: '#e6a23c', // 橙色
      },
    },
    {
      name: '延期',
      value: overdueCount,
      itemStyle: {
        color: '#f56c6c', // 红色
      },
    },
  ]

  // 图表配置
  const option = {
    // 图例
    legend: {
      orient: 'horizontal',
      bottom: 10,
      left: 'center',
      textStyle: {
        fontSize: 12,
        color: '#666',
      },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20,
    },
    // 提示框
    tooltip: {
      trigger: 'item',
      formatter: function (params: any) {
        const percentage = ((params.value / totalCount) * 100).toFixed(2)
        return `${params.name}<br/>数量: ${params.value}<br/>占比: ${percentage}%`
      },
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderColor: '#409eff',
      textStyle: {
        color: '#fff',
      },
    },
    // 系列配置
    series: [
      // 环形图系列
      {
        type: 'pie',
        radius: ['60%', '80%'], // 环形图内外半径
        center: ['50%', '45%'], // 图表中心位置，确保与标题对齐
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false, // 不显示标签
          position: 'center',
        },
        emphasis: {
          label: {
            show: false,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        labelLine: {
          show: false,
        },
        data: data,
      },
      // 中心文字系列
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        pointer: {
          show: false,
        },
        progress: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        detail: {
          valueAnimation: true,
          fontSize: 30,
          fontWeight: 'bold',
          formatter: function () {
            return `${((statistics.value.completionRate || 0) * 100).toFixed(2)}%`
          },
          color: '#333',
          offsetCenter: [0, 0],
        },
        data: [
          {
            value: (statistics.value.completionRate || 0) * 100,
          },
        ],
      },
    ],
  }

  // 设置图表配置
  donutChartInstance.setOption(option)

  // 监听窗口大小变化，自动调整图表大小
  window.addEventListener('resize', handleResize)
}

// 初始化饼图
const initPieChart = () => {
  if (!pieChartRef.value || !statistics.value) return

  // 销毁已有的图表实例
  if (pieChartInstance) {
    pieChartInstance.dispose()
  }

  // 创建新的图表实例
  pieChartInstance = echarts.init(pieChartRef.value)

  // 准备数据 - 统一三个时间维度都显示「计划难度分布」
  let distributionData = []

  // 难度分布数据
  if (statistics.value.difficultyDistribution && statistics.value.difficultyDistribution.details) {
    // 难度名称映射
    const difficultyMap: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    }
    distributionData = statistics.value.difficultyDistribution.details.map((item: any) => ({
      name: difficultyMap[item.type] || item.type,
      value: item.count,
    }))
  } else {
    // 默认测试数据
    distributionData = [
      { name: '简单', value: 3 },
      { name: '中等', value: 5 },
      { name: '困难', value: 2 },
    ]
  }

  // 计算总计划数
  const totalCount = distributionData.reduce((sum: number, item: any) => sum + item.value, 0)

  // 颜色列表 - 与现有页面风格统一
  const colorList = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#5470c6']

  // 准备数据（添加颜色）
  const data = distributionData.map((item: any, index: number) => ({
    ...item,
    itemStyle: {
      color: colorList[index % colorList.length],
    },
  }))

  // 图表配置
  const option = {
    // 图例
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        fontSize: 12,
        color: '#666',
      },
    },
    // 提示框
    tooltip: {
      trigger: 'item',
      formatter: function (params: any) {
        const percentage = ((params.value / totalCount) * 100).toFixed(2)
        return `${params.name}<br/>数量: ${params.value}<br/>占比: ${percentage}%`
      },
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderColor: '#409eff',
      textStyle: {
        color: '#fff',
      },
    },
    // 系列配置
    series: [
      {
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'], // 调整为50%，与标题对齐
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            formatter: function (params: any) {
              const percentage = ((params.value / totalCount) * 100).toFixed(2)
              return `${params.name}\n${percentage}%`
            },
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        labelLine: {
          show: false,
        },
        data: data,
      },
    ],
  }

  // 设置图表配置
  pieChartInstance.setOption(option)

  // 监听窗口大小变化，自动调整图表大小
  window.addEventListener('resize', handleResize)
}

// 处理窗口大小变化
const handleResize = () => {
  if (donutChartInstance) {
    donutChartInstance.resize()
  }
  if (pieChartInstance) {
    pieChartInstance.resize()
  }
}

// 更新图表
const updateCharts = () => {
  nextTick(() => {
    initDonutChart()
    initPieChart()
  })
}

// 监听统计数据变化，自动更新图表
watch(
  () => statistics.value,
  () => {
    updateCharts()
  },
  { deep: true },
)

// 初始加载数据
const initData = async () => {
  await fetchData()
  updateCharts()
}

// 处理弹出提示
const showAlert = (message: string) => {
  alert(message)
}

// 生命周期钩子 - 初始化和窗口大小监听
onMounted(async () => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  // 初始加载时根据路由更新选中的菜单
  updateSelectedMenu()
  // 初始加载数据
  await initData()
})
</script>

<style scoped>
/* 全局变量 - 与首页保持一致 */
:root {
  /* 主色调 */
  --primary-color: #409eff;
  --primary-color-light: #e6f7ff;
  --primary-color-dark: #1890ff;
  --accent-color: #165dff;

  /* 中性色 */
  --text-color-dark: #333;
  --text-color-medium: #666;
  --text-color-light: #999;
  --text-color: #333;
  --text-color-secondary: #666;
  --border-color: #e5e7eb;
  --border-color-light: #f0f2f5;
  --white: #fff;
  --bg-color: #f5f7fa;
  --bg-color-light: #f0f9ff;
  --bg-color-white: #fff;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 圆角 */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --border-radius-2xl: 20px;

  /* 过渡 */
  --transition: all 0.3s ease;
  --transition-fast: all 0.2s ease;
}

/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color-dark);
  background-color: var(--bg-color);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 主容器 */
.study-management-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 - 与首页保持一致 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--white);
  box-shadow: var(--shadow-sm);
  z-index: 100;
  height: 70px;
  border-bottom: 1px solid var(--border-color-light);
}

.navbar-container {
  max-width: 100%;
  margin: 0;
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
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.logo:hover {
  opacity: 0.8;
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

.nav-menu.mobile-menu {
  display: none;
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

.nav-item.active {
  color: var(--primary-color);
  font-weight: 600;
}

.nav-item.has-submenu::after {
  content: '▼';
  margin-left: 6px;
  font-size: 12px;
  transition: var(--transition);
}

/* 子菜单悬浮层 - 与首页保持一致 */
.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: var(--white);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 12px 0;
  min-width: 160px;
  z-index: 200;
  animation: slideDown 0.2s ease;
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

/* 移动端子菜单 */
.mobile-submenu {
  background-color: var(--bg-color-light);
  border-radius: var(--border-radius-md);
  margin-top: 8px;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}

.mobile-submenu-item {
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--border-radius-md);
}

.mobile-submenu-item:hover {
  background-color: var(--primary-color);
  color: var(--white);
}

/* 右侧操作区 - 与首页保持一致 */
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

.dropdown-item.register {
  color: var(--primary-color);
  border-bottom: 1px solid var(--border-color-light);
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.dropdown-item.register:hover {
  background-color: var(--primary-color);
  color: #fff;
}

.dropdown-item.logout {
  color: #f56c6c;
}

.dropdown-item.logout:hover {
  background-color: #f56c6c;
  color: #fff;
}

/* 动画 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 顶部标题栏 */
.title-bar {
  height: 60px;
  background-color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 70px;
}

.title-text {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

/* 主体内容区 */
.main-content {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 70px);
  margin-top: 70px;
  overflow: hidden;
}

/* 侧边栏切换按钮 */
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
  position: fixed;
  top: 70px;
  bottom: 0;
  overflow-y: auto;
  z-index: 10;
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

/* 右侧主内容区 */
.content-area {
  margin-left: 280px;
  flex: 1;
  padding: 20px;
  transition: margin-left 0.3s ease;
  overflow-y: auto;
  max-height: calc(100vh - 70px);
  padding-bottom: 40px;
}

/* 时间导航栏 */
.time-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.time-btn {
  flex: 1;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
}

.time-btn:hover {
  background-color: #e6f7ff;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.time-btn.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: #fff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

/* 内容卡片 */
/* 自定义卡片样式 */
.custom-card {
  margin-bottom: 20px;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.custom-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 卡片标题 - 左上角显示 */
.card-title {
  padding: 12px 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color-dark);
  text-align: left;
}

/* 卡片内容区 */
.card-content {
  padding: 20px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
}

/* 统计模块标题 */
.module-title {
  font-size: 18px;
  font-weight: bold;
  color: #666;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
}

/* 统计模块提示文字 */
.module-hint {
  font-size: 14px;
  color: var(--text-color-dark);
  background-color: #fff;
  padding: 10px;
  margin: 0;
  position: absolute;
  top: 60px;
  left: 20px;
  z-index: 10;
  line-height: 1.5;
  max-width: calc(100% - 40px);
  font-weight: bold;
}

/* 没有标题的提示文字 - 用于分析卡片 */
.module-hint.no-title {
  top: 20px;
}

/* 没有标题的卡片内容 - 调整分析内容的上边距 */
.no-title-card .analysis-content {
  margin-top: 60px;
}

/* 分析内容样式 - 用于显示后端返回的分析内容 */
.analysis-content {
  width: 100%;
  min-height: 200px;
  padding: 20px;
  background-color: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color-dark);
  transition: all 0.3s ease;
  margin-top: 100px;
  align-self: center;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 加载状态 */
.loading {
  font-size: 16px;
  color: var(--primary-color);
  font-weight: 500;
}

/* 无数据状态 */
.no-data {
  font-size: 16px;
  color: var(--text-color-light);
  font-weight: 500;
}

/* 数据显示样式 */
.analysis-content pre {
  text-align: left;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
  width: 100%;
}

/* 学习仪表板样式 */
.study-dashboard {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.search-form {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-primary {
  padding: 8px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-primary:disabled {
  background-color: #c6e2ff;
  cursor: not-allowed;
}

.error-message {
  background-color: #fef0f0;
  color: #f56c6c;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.statistics-card,
.suggestions-card {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  color: #333;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.distribution-section {
  margin-bottom: 20px;
}

h4 {
  color: #666;
  margin-bottom: 10px;
}

.distribution-list {
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.distribution-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.distribution-item:last-child {
  border-bottom: none;
}

.suggestion-list {
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.suggestion-item {
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f0f9eb;
  border-left: 4px solid #67c23a;
  border-radius: 4px;
  line-height: 1.5;
}

.suggestion-item:last-child {
  margin-bottom: 0;
}

/* 可视化图表模块 */
.visualization-module {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin-bottom: 20px;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}

/* 完成率进度条 */
.progress-bar-container {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-dark);
}

.progress-percentage {
  font-size: 14px;
  font-weight: bold;
  color: var(--primary-color);
}

.progress-bar {
  width: 100%;
  height: 12px;
  background-color: #f0f2f5;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

/* 图表容器 */
.charts-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.chart-item {
  flex: 1;
  min-height: 300px;
}

.chart-item h3 {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-dark);
  margin-bottom: 10px;
  text-align: center;
  /* 确保标题与下方图表水平中心对齐 */
  width: 100%;
  display: block;
}

.donut-chart,
.pie-chart {
  width: 100%;
  height: 280px;
}

/* 图表容器 */
.echarts-container {
  width: 100%;
  height: 100%;
  min-height: 260px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .charts-container {
    flex-direction: column;
  }

  .chart-item {
    min-height: 250px;
  }

  .donut-chart,
  .pie-chart {
    height: 230px;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  /* 平板端适配 */
  .nav-menu {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  /* 移动端适配 */
  .navbar-container {
    padding: 0 16px;
    height: 60px;
  }

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
    background-color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-top: 1px solid #e5e7eb;
    padding: 16px;
    gap: 8px;
  }

  .nav-item {
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  /* 主体内容区适配 */
  .main-content {
    min-height: calc(100vh - 60px);
  }

  /* 侧边栏切换按钮 */
  .sidebar-toggle {
    display: block;
  }

  /* 左侧导航栏适配 */
  .sidebar {
    width: 280px;
    top: 60px;
    transform: translateX(0);
    z-index: 100;
  }

  /* 侧边栏折叠状态 */
  .sidebar-collapsed {
    transform: translateX(-100%);
  }

  /* 右侧内容区适配 */
  .content-area {
    margin-left: 0;
    padding: 10px;
  }

  /* 时间导航栏移动端适配 */
  .time-nav {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  .time-btn {
    padding: 10px 14px;
    font-size: 13px;
  }

  /* 内容卡片适配 */
  /* 自定义卡片移动端适配 */
  .custom-card {
    margin-bottom: 10px;
  }

  .card-content {
    padding: 15px;
    min-height: 250px;
  }

  /* 统计模块标题移动端适配 */
  .module-title {
    font-size: 16px;
  }

  /* 统计模块提示文字移动端适配 */
  .module-hint {
    font-size: 13px;
    padding: 8px;
    top: 55px;
    max-width: calc(100% - 30px);
    background-color: #fff;
    font-weight: bold;
  }

  /* 没有标题的提示文字移动端适配 */
  .module-hint.no-title {
    top: 20px;
  }

  /* 没有标题的卡片内容移动端适配 */
  .no-title-card .analysis-content {
    margin-top: 50px;
  }

  /* 分析内容移动端适配 */
  .analysis-content {
    padding: 15px;
    margin-top: 90px;
    min-height: 180px;
  }

  /* 图表容器移动端适配 */
  .echarts-container {
    min-height: 220px;
  }
}
</style>
