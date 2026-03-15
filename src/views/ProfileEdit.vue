<template>
  <div class="profile-edit">
    <GlobalNavbar />

    <div class="main-content">
      <div class="edit-container">
        <!-- 返回按钮 -->
        <div class="back-nav">
          <button class="btn-back" @click="router.back()">
            <svg class="back-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                fill="currentColor"
              />
            </svg>
            返回个人中心
          </button>
        </div>

        <!-- 编辑表单卡片 -->
        <div class="edit-card">
          <div class="card-header">
            <h2 class="card-title">编辑个人资料</h2>
            <p class="card-subtitle">完善您的个人信息，让学习更智能</p>
          </div>

          <!-- 头像编辑 -->
          <div class="avatar-edit-section">
            <div class="avatar-label-wrapper">
              <span class="avatar-label">头像</span>
              <span class="avatar-hint">支持 JPG、PNG 格式，大小不超过 2MB</span>
            </div>
            <div class="avatar-edit">
              <div class="avatar-preview-wrapper">
                <div class="avatar-preview">
                  <img
                    v-if="
                      avatarPreview || (userInfo.avatar && !userInfo.avatar.includes('default'))
                    "
                    :src="avatarPreview || userInfo.avatar"
                    :alt="userInfo.nickname"
                    class="avatar-img"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ avatarInitial }}
                  </div>
                </div>
                <div class="avatar-badge" v-if="avatarPreview">新</div>
              </div>
              <div class="avatar-actions">
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleFileSelect"
                />
                <button class="btn-upload" @click="triggerFileInput">
                  <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
                  </svg>
                  上传新头像
                </button>
                <button v-if="avatarPreview" class="btn-cancel" @click="cancelAvatarChange">
                  <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                      fill="currentColor"
                    />
                  </svg>
                  取消
                </button>
              </div>
            </div>
          </div>

          <!-- 表单 -->
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
            class="edit-form"
            @submit.prevent
          >
            <!-- 用户名（不可修改） -->
            <el-form-item label="用户名" class="readonly-item">
              <div class="readonly-field-wrapper">
                <span class="readonly-field">{{ userInfo.nickname }}</span>
                <span class="field-hint">不可修改</span>
              </div>
            </el-form-item>

            <!-- 邮箱（不可修改） -->
            <el-form-item label="邮箱" class="readonly-item">
              <div class="readonly-field-wrapper">
                <span class="readonly-field">{{ userInfo.email }}</span>
                <span class="field-hint">不可修改</span>
              </div>
            </el-form-item>

            <!-- 性别 -->
            <el-form-item label="性别" prop="gender" class="form-item">
              <el-radio-group v-model="form.gender" class="gender-group">
                <el-radio :value="1" class="gender-radio">
                  <span class="radio-content">男</span>
                </el-radio>
                <el-radio :value="2" class="gender-radio">
                  <span class="radio-content">女</span>
                </el-radio>
                <el-radio :value="0" class="gender-radio">
                  <span class="radio-content">保密</span>
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 学号 -->
            <el-form-item label="学号" prop="studentId" class="form-item">
              <el-input
                v-model="form.studentId"
                placeholder="请输入学号"
                clearable
                class="custom-input"
              >
                <template #prefix>
                  <svg class="input-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                      fill="currentColor"
                    />
                  </svg>
                </template>
              </el-input>
            </el-form-item>

            <!-- 学院 -->
            <el-form-item label="学院" prop="college">
              <el-autocomplete
                v-model="form.college"
                :fetch-suggestions="querySearchCollege"
                :trigger-on-focus="true"
                placeholder="请输入学院名称"
                clearable
                @select="handleCollegeSelect"
                class="autocomplete-input"
              >
                <template #default="{ item }">
                  <div class="autocomplete-item">{{ item.value }}</div>
                </template>
              </el-autocomplete>
            </el-form-item>

            <!-- 专业 - 改为自动补全 -->
            <el-form-item label="专业" prop="major">
              <el-autocomplete
                v-model="form.major"
                :fetch-suggestions="querySearchMajor"
                :trigger-on-focus="true"
                placeholder="请输入专业名称"
                clearable
                @select="handleMajorSelect"
                class="autocomplete-input"
              >
                <template #default="{ item }">
                  <div class="autocomplete-item">{{ item.value }}</div>
                </template>
              </el-autocomplete>
            </el-form-item>

            <!-- 年级 -->
            <el-form-item label="年级" prop="grade" class="form-item">
              <el-select
                v-model="form.grade"
                placeholder="请选择年级"
                clearable
                class="custom-select"
                popper-class="custom-select-popper"
              >
                <el-option
                  v-for="item in gradeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  class="custom-option"
                >
                  <span>{{ item.label }}</span>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- 提交按钮 -->
            <el-form-item class="form-actions-item">
              <div class="form-actions">
                <button class="btn-save" @click="handleSubmit" :disabled="isSubmitting">
                  <svg
                    v-if="!isSubmitting"
                    class="btn-icon"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                  >
                    <path
                      d="M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm4-10H7V5h9v4z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>{{ isSubmitting ? '保存中...' : '保存修改' }}</span>
                </button>
                <button class="btn-cancel-outline" @click="router.back()">
                  <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                      fill="currentColor"
                    />
                  </svg>
                  取消
                </button>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { api } from '@/api'

const router = useRouter()
const userStore = useUserStore()

// 表单引用
const formRef = ref<FormInstance>()

// 提交状态
const isSubmitting = ref(false)

// 文件输入引用
const fileInput = ref<HTMLInputElement>()

// 头像预览
const avatarPreview = ref('')

// 定义选项类型
interface SuggestItem {
  value: string
}

// 年级选项
const gradeOptions = [
  { label: '大一', value: '大一' },
  { label: '大二', value: '大二' },
  { label: '大三', value: '大三' },
  { label: '大四', value: '大四' },
  { label: '研究生', value: '研究生' },
]

// 学院预设数据（可以从后端获取，这里先预设常用学院）
const collegeOptions = ref([
  { value: '计算机科学与技术学院' },
  { value: '软件学院' },
  { value: '电子信息工程学院' },
  { value: '信息科学与工程学院' },
  { value: '人工智能学院' },
  { value: '数据科学与工程学院' },
  { value: '网络空间安全学院' },
  { value: '微电子学院' },
  { value: '通信工程学院' },
  { value: '自动化学院' },
  { value: '机械工程学院' },
  { value: '材料科学与工程学院' },
  { value: '能源与动力工程学院' },
  { value: '土木工程学院' },
  { value: '建筑学院' },
  { value: '环境科学与工程学院' },
  { value: '化学化工学院' },
  { value: '生命科学学院' },
  { value: '数学与统计学院' },
  { value: '物理科学与技术学院' },
  { value: '经济与管理学院' },
  { value: '工商管理学院' },
  { value: '公共管理学院' },
  { value: '外国语学院' },
  { value: '马克思主义学院' },
  { value: '法学院' },
  { value: '人文学院' },
  { value: '艺术学院' },
  { value: '体育学院' },
  { value: '医学院' },
  { value: '药学院' },
  { value: '护理学院' },
])

// 专业预设数据（根据常见专业）
const majorOptions = ref([
  { value: '计算机科学与技术' },
  { value: '软件工程' },
  { value: '人工智能' },
  { value: '数据科学与大数据技术' },
  { value: '物联网工程' },
  { value: '网络工程' },
  { value: '信息安全' },
  { value: '电子与计算机工程' },
  { value: '电子信息工程' },
  { value: '通信工程' },
  { value: '微电子科学与工程' },
  { value: '光电信息科学与工程' },
  { value: '信息工程' },
  { value: '自动化' },
  { value: '机器人工程' },
  { value: '机械工程' },
  { value: '机械设计制造及其自动化' },
  { value: '车辆工程' },
  { value: '材料科学与工程' },
  { value: '能源与动力工程' },
  { value: '电气工程及其自动化' },
  { value: '土木工程' },
  { value: '建筑学' },
  { value: '城乡规划' },
  { value: '环境工程' },
  { value: '化学工程与工艺' },
  { value: '生物工程' },
  { value: '生物医学工程' },
  { value: '药学' },
  { value: '临床医学' },
  { value: '口腔医学' },
  { value: '护理学' },
  { value: '数学与应用数学' },
  { value: '信息与计算科学' },
  { value: '应用物理学' },
  { value: '应用化学' },
  { value: '统计学' },
  { value: '经济学' },
  { value: '金融学' },
  { value: '国际经济与贸易' },
  { value: '工商管理' },
  { value: '市场营销' },
  { value: '会计学' },
  { value: '财务管理' },
  { value: '人力资源管理' },
  { value: '行政管理' },
  { value: '英语' },
  { value: '日语' },
  { value: '法学' },
  { value: '新闻学' },
  { value: '广告学' },
])

// 学院搜索方法 - 明确类型
const querySearchCollege = (queryString: string, cb: (results: SuggestItem[]) => void) => {
  const results = queryString
    ? collegeOptions.value.filter((option: SuggestItem) =>
        option.value.toLowerCase().includes(queryString.toLowerCase()),
      )
    : collegeOptions.value
  cb(results)
}

// 专业搜索方法 - 明确类型
const querySearchMajor = (queryString: string, cb: (results: SuggestItem[]) => void) => {
  const results = queryString
    ? majorOptions.value.filter((option: SuggestItem) =>
        option.value.toLowerCase().includes(queryString.toLowerCase()),
      )
    : majorOptions.value
  cb(results)
}

// 学院选择回调 - 明确类型
const handleCollegeSelect = (item: SuggestItem) => {
  console.log('选中学院:', item.value)
}

// 专业选择回调 - 明确类型
const handleMajorSelect = (item: SuggestItem) => {
  console.log('选中专业:', item.value)
}

// 从 store 获取用户信息
const userInfo = computed(() => {
  const profile = userStore.fullUserInfo
  return {
    nickname: profile?.username || '用户',
    email: profile?.email || '',
    avatar: profile?.avatar || profile?.avatarUrl || '',
    gender: profile?.gender || 0,
    studentId: profile?.studentId || '',
    major: profile?.major || '',
    college: profile?.college || '',
    grade: profile?.grade || '',
  }
})

// 头像首字母
const avatarInitial = computed(() => {
  return userInfo.value.nickname.charAt(0).toUpperCase()
})

// 表单数据
const form = reactive({
  gender: userInfo.value.gender,
  studentId: userInfo.value.studentId,
  major: userInfo.value.major,
  college: userInfo.value.college,
  grade: userInfo.value.grade,
})

// 表单验证规则
const rules = reactive<FormRules>({
  studentId: [{ min: 0, max: 20, message: '学号长度不能超过20个字符', trigger: 'blur' }],
  major: [{ min: 0, max: 50, message: '专业名称不能超过50个字符', trigger: 'blur' }],
  college: [{ min: 0, max: 50, message: '学院名称不能超过50个字符', trigger: 'blur' }],
})

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  // 验证文件大小（2MB）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过2MB')
    return
  }

  // 预览
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // 上传头像
  try {
    isSubmitting.value = true
    const response = await api.updateUserAvatar(file)
    if (response.code === 200) {
      ElMessage.success('头像上传成功')
      // 刷新用户资料
      await userStore.fetchUserProfile()
      avatarPreview.value = '' // 清空预览
    }
  } catch {
    ElMessage.error('头像上传失败')
  } finally {
    isSubmitting.value = false
  }
}

// 取消头像更改
const cancelAvatarChange = () => {
  avatarPreview.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    isSubmitting.value = true

    const response = await api.updateUserBasicInfo({
      gender: form.gender,
      studentId: form.studentId,
      major: form.major,
      college: form.college,
      grade: form.grade,
    })

    if (response.code === 200) {
      ElMessage.success('资料更新成功')
      // 刷新用户资料
      await userStore.fetchUserProfile()
      // 返回上一页
      setTimeout(() => {
        router.back()
      }, 1500)
    }
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 初始化表单数据
onMounted(() => {
  // 如果用户资料还没加载，先加载
  if (!userStore.userProfile) {
    userStore.fetchUserProfile()
  }

  // 同步表单数据
  form.gender = userInfo.value.gender
  form.studentId = userInfo.value.studentId
  form.major = userInfo.value.major
  form.college = userInfo.value.college
  form.grade = userInfo.value.grade
})
</script>

<style scoped>
.profile-edit {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-content {
  margin-top: 70px;
  padding: 32px 24px;
  min-height: calc(100vh - 70px);
}

.edit-container {
  max-width: 900px;
  margin: 0 auto;
}

/* 返回按钮 */
.back-nav {
  margin-bottom: 24px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-4px);
}

.back-icon {
  transition: transform 0.3s ease;
}

.btn-back:hover .back-icon {
  transform: translateX(-4px);
}

/* 编辑卡片 */
.edit-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  margin-bottom: 32px;
  text-align: center;
}

.card-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 头像编辑 */
.avatar-edit-section {
  margin-bottom: 40px;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.avatar-label-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar-label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.avatar-hint {
  font-size: 12px;
  color: #999;
  background: rgba(255, 255, 255, 0.5);
  padding: 2px 8px;
  border-radius: 12px;
}

.avatar-edit {
  display: flex;
  align-items: center;
  gap: 32px;
}

.avatar-preview-wrapper {
  position: relative;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid white;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  background-color: #f5f7fa;
  transition: transform 0.3s ease;
}

.avatar-preview:hover {
  transform: scale(1.05);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 48px;
  font-weight: 600;
}

.avatar-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: #52c41a;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
}

.avatar-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-upload,
.btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-upload {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-upload:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.btn-cancel {
  background: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-cancel:hover {
  background: #f5f5f5;
  border-color: #f56c6c;
  color: #f56c6c;
  transform: translateY(-2px);
}

.btn-icon {
  transition: transform 0.3s ease;
}

.btn-upload:hover .btn-icon {
  transform: rotate(90deg);
}

/* 表单样式 */
.edit-form {
  max-width: 600px;
  margin: 0 auto;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

/* 只读字段 */
.readonly-item {
  background: #f8f9fa;
  padding: 8px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.readonly-field-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.readonly-field {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.field-hint {
  font-size: 12px;
  color: #999;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
}

/* 性别选项 */
.gender-group {
  display: flex;
  gap: 20px;
}

:deep(.el-radio) {
  margin-right: 0;
}

.gender-radio {
  transition: transform 0.3s ease;
}

.gender-radio:hover {
  transform: translateY(-2px);
}

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #667eea;
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  background: #667eea;
  border-color: #667eea;
}

/* 自定义输入框 */
.custom-input {
  width: 100%;
}

:deep(.custom-input .el-input__wrapper) {
  border-radius: 30px;
  padding: 4px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

:deep(.custom-input .el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

:deep(.custom-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.input-icon {
  color: #999;
  transition: color 0.3s ease;
}

:deep(.el-input__wrapper:hover) .input-icon {
  color: #667eea;
}

/* 自定义选择框 */
.custom-select {
  width: 100%;
}

:deep(.custom-select .el-select__wrapper) {
  border-radius: 30px;
  padding: 8px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

:deep(.custom-select .el-select__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

:deep(.custom-select .el-select__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

/* 选项样式 */
:deep(.custom-select-popper) {
  border-radius: 16px;
  padding: 8px;
}

:deep(.custom-option) {
  border-radius: 12px;
  margin: 4px 0;
  transition: all 0.3s ease;
}

:deep(.custom-option:hover) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 按钮区域 */
.form-actions-item {
  margin-top: 40px;
  margin-bottom: 0;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-save,
.btn-cancel-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel-outline {
  background: transparent;
  color: #666;
  border: 2px solid #ddd;
}

.btn-cancel-outline:hover {
  border-color: #f56c6c;
  color: #f56c6c;
  transform: translateY(-2px);
  background: rgba(245, 108, 108, 0.05);
}

/* 自动补全输入框样式 */
.autocomplete-input {
  width: 100%;
}

:deep(.el-autocomplete) {
  width: 100%;
}

:deep(.el-input__inner) {
  width: 100%;
}

/* 下拉选项样式 */
.autocomplete-item {
  padding: 8px 12px;
  font-size: 14px;
  color: #333;
}

/* 下拉框容器样式 */
:deep(.el-popper.is-light) {
  max-height: 300px;
  overflow-y: auto;
}

/* 选项悬停效果 */
:deep(.el-autocomplete-suggestion__list li:hover) {
  background-color: #f5f7fa;
}

/* 选中项高亮 */
:deep(.el-autocomplete-suggestion__list li.highlighted) {
  background-color: #ecf5ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-top: 60px;
    padding: 20px 16px;
  }

  .edit-card {
    padding: 24px;
  }

  .card-title {
    font-size: 24px;
  }

  .avatar-edit {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
  }

  .avatar-preview {
    width: 100px;
    height: 100px;
  }

  .avatar-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-upload,
  .btn-cancel {
    width: 100%;
    justify-content: center;
  }

  .gender-group {
    flex-direction: column;
    gap: 10px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-save,
  .btn-cancel-outline {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .edit-card {
    padding: 20px;
  }

  .avatar-label-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .readonly-field-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
