<script setup lang="ts">
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

// 直接从detail store获取
const generatedPlan = computed(() => studyPlanDetailStore.currentDetail)
const isGenerating = computed(() => studyPlanDetailStore.isGenerating)

onMounted(() => !currentPlan.value && router.push('/ai/study'))

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
          <span class="label">计划周期：</span>
          <span class="value">
            {{ formatDate(currentPlan.startDate) }} 至 {{ formatDate(currentPlan.endDate) }}
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

      <!-- 修改后的计划显示部分 -->
      <div v-if="generatedPlan" class="generated-plan">
        <h2>专属学习计划</h2>

        <!-- 按周循环显示 -->
        <div v-for="week in generatedPlan.plan" :key="week.week" class="week-plan">
          <el-card class="week-card" :header="week.title">
            <!-- 按天循环显示 -->
            <div v-for="day in week.days" :key="day.day" class="day-plan">
              <div class="day-header">
                <h4>第 {{ day.day }} 天：{{ day.topic }}</h4>
              </div>

              <div class="day-content">
                <!-- 学习任务 -->
                <div v-if="day.tasks && day.tasks.length" class="section tasks">
                  <h5>📚 学习任务</h5>
                  <ul>
                    <li v-for="(task, idx) in day.tasks" :key="idx">
                      <el-tag size="small" type="primary" effect="plain">{{ task }}</el-tag>
                    </li>
                  </ul>
                </div>

                <!-- 学习资源 -->
                <div v-if="day.resources && day.resources.length" class="section resources">
                  <h5>📖 学习资源</h5>
                  <ul>
                    <li v-for="(resource, idx) in day.resources" :key="idx">
                      <el-link type="primary" :href="resource" v-if="resource.startsWith('http')">
                        {{ resource }}
                      </el-link>
                      <span v-else>{{ resource }}</span>
                    </li>
                  </ul>
                </div>

                <!-- 练习作业 -->
                <div v-if="day.assignments && day.assignments.length" class="section assignments">
                  <h5>✍️ 练习作业</h5>
                  <ul>
                    <li v-for="(assignment, idx) in day.assignments" :key="idx">
                      <el-tag size="small" type="success" effect="plain">{{ assignment }}</el-tag>
                    </li>
                  </ul>
                </div>
              </div>
              <el-divider v-if="day.day < week.days.length" />
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.plan-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.header-actions {
  margin-bottom: 1rem;
}

.plan-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.info-item {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.label {
  font-weight: bold;
  color: #6c757d;
}

.plan-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.summary-item {
  text-align: center;
  padding: 1.5rem;
  background: #e9ecef;
  border-radius: 8px;
}

.value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4a6fa5;
}

.daily-plans {
  margin-top: 2rem;
}

.day-plan {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.task {
  font-weight: bold;
  color: #4a6fa5;
  margin-bottom: 0.75rem;
}

.resources {
  margin-top: 0.75rem;
}

.resource {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.resource a {
  color: #4a6fa5;
  text-decoration: none;
}

.resource a:hover {
  text-decoration: underline;
}
</style>
