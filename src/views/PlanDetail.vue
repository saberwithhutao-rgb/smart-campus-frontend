<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useStudyPlanStore } from '@/stores/studyPlan'
import { useStudyPlanDetailStore } from '@/stores/studyPlanDetail'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const studyPlanStore = useStudyPlanStore()
const studyPlanDetailStore = useStudyPlanDetailStore()

const planId = Number(route.params.id)
const currentPlan = computed(() => studyPlanStore.studyPlans.find((p) => p.id === planId))
const isLoggedIn = computed(() => userStore.userState.isLoggedIn)

const generatedPlan = computed(() => studyPlanDetailStore.getPlanDetailByStudyPlanId(planId))
const isGenerating = computed(() => studyPlanDetailStore.isGenerating)

onMounted(() => {
  if (!currentPlan.value) {
    router.push('/ai/study')
  }
})

const generateStudyPlan = async () => {
  if (!isLoggedIn.value) {
    ElMessage.error('请先登录')
    return router.push('/login')
  }
  if (!currentPlan.value) return

  const start = new Date(currentPlan.value.startDate)
  const end = currentPlan.value.endDate ? new Date(currentPlan.value.endDate) : new Date()
  const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  const result = await studyPlanDetailStore.generatePlanDetail({
    studyPlanId: currentPlan.value.id,
    subject: currentPlan.value.subject || '',
    duration: diffDays + '天',
    level: currentPlan.value.difficulty,
  })

  if (result) {
    ElMessage.success('学习计划已生成!')
  }
}

// 工具函数
const getPlanTypeText = (type: string) =>
  ({ review: '复习计划', learning: '学习计划', project: '项目计划' })[type] || type
const formatDate = (date: string) => new Date(date).toLocaleDateString('zh-CN')
const getSubjectIcon = (subject: string) =>
  ({ Python: 'python', JavaScript: 'js', Java: 'java', 'C++': 'cpp' })[subject] || 'default'
const goBack = () => router.go(-1)
</script>

<template>
  <div class="smart-qa-container">
    <GlobalNavbar />

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="plan-detail-container">
        <div v-if="!currentPlan" class="loading">
          <el-skeleton :rows="5" />
        </div>

        <div v-else class="plan-content">
          <div class="header-actions">
            <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
          </div>

          <h1>{{ currentPlan.title }}</h1>
          <p class="description">{{ currentPlan.description }}</p>

          <div class="plan-info">
            <div class="info-item">
              <span class="label">计划类型：</span>
              <span class="value">{{ getPlanTypeText(currentPlan.planType) }}</span>
            </div>
            <div class="info-item">
              <span class="label">学科：</span>
              <span class="value">{{ currentPlan.subject }}</span>
            </div>
            <div class="info-item">
              <span class="label">难度：</span>
              <span class="value">{{ currentPlan.difficulty }}</span>
            </div>
            <div class="info-item">
              <span class="label">时间：</span>
              <span class="value">
                {{ formatDate(currentPlan.startDate || '') }} 至
                {{ formatDate(currentPlan.endDate || '') }}
              </span>
            </div>
          </div>

          <div class="action-section">
            <el-button
              type="primary"
              @click="generateStudyPlan"
              :loading="isGenerating"
              :disabled="isGenerating"
            >
              生成专属学习计划
            </el-button>
          </div>

          <!-- 直接显示AI返回的纯文本 -->
          <div v-if="generatedPlan" class="generated-plan">
            <h2>专属学习计划</h2>
            <div class="plan-text">
              {{ generatedPlan.plan }}
            </div>
            <div v-if="generatedPlan.id" class="detail-id">计划ID: {{ generatedPlan.id }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.plan-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item .label {
  font-size: 14px;
  color: #909399;
}

.info-item .value {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.action-section {
  text-align: center;
  margin: 30px 0;
}

.generated-plan {
  margin-top: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.plan-text {
  white-space: pre-wrap; /* 保留换行和空格 */
  line-height: 1.8;
  font-size: 16px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 4px;
}

.detail-id {
  margin-top: 20px;
  text-align: right;
  color: #909399;
  font-size: 14px;
}
</style>
