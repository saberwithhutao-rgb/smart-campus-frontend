<template>
  <div class="profile-edit">
    <GlobalNavbar />

    <div class="main-content">
      <div class="edit-container">
        <!-- 返回按钮 -->
        <div class="back-nav">
          <button class="btn-back" @click="router.back()">← 返回个人中心</button>
        </div>

        <!-- 编辑表单卡片 -->
        <div class="edit-card">
          <div class="card-header">
            <h2 class="card-title">编辑个人资料</h2>
          </div>

          <!-- 头像编辑 -->
          <div class="avatar-edit-section">
            <div class="avatar-label">头像</div>
            <div class="avatar-edit">
              <div class="avatar-preview">
                <img
                  v-if="avatarPreview || userInfo.avatar"
                  :src="avatarPreview || userInfo.avatar"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  {{ avatarInitial }}
                </div>
              </div>
              <div class="avatar-actions">
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleFileSelect"
                />
                <button class="btn-upload" @click="triggerFileInput">上传新头像</button>
                <button v-if="avatarPreview" class="btn-cancel" @click="cancelAvatarChange">
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
            <el-form-item label="用户名">
              <span class="readonly-field">{{ userInfo.nickname }}</span>
              <div class="field-hint">用户名不可修改</div>
            </el-form-item>

            <!-- 邮箱（不可修改） -->
            <el-form-item label="邮箱">
              <span class="readonly-field">{{ userInfo.email }}</span>
              <div class="field-hint">邮箱不可修改</div>
            </el-form-item>

            <!-- 性别 -->
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="form.gender">
                <el-radio :value="1">男</el-radio>
                <el-radio :value="2">女</el-radio>
                <el-radio :value="0">保密</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 学号 -->
            <el-form-item label="学号" prop="studentId">
              <el-input v-model="form.studentId" placeholder="请输入学号" clearable />
            </el-form-item>

            <!-- 学院 -->
            <el-form-item label="学院" prop="college">
              <el-input v-model="form.college" placeholder="请输入学院" clearable />
            </el-form-item>

            <!-- 专业 -->
            <el-form-item label="专业" prop="major">
              <el-input v-model="form.major" placeholder="请输入专业" clearable />
            </el-form-item>

            <!-- 年级 -->
            <el-form-item label="年级" prop="grade">
              <el-select v-model="form.grade" placeholder="请选择年级" clearable>
                <el-option label="大一" value="大一" />
                <el-option label="大二" value="大二" />
                <el-option label="大三" value="大三" />
                <el-option label="大四" value="大四" />
                <el-option label="研究生" value="研究生" />
              </el-select>
            </el-form-item>

            <!-- 提交按钮 -->
            <el-form-item>
              <div class="form-actions">
                <button class="btn-save" @click="handleSubmit" :disabled="isSubmitting">
                  {{ isSubmitting ? '保存中...' : '保存修改' }}
                </button>
                <button class="btn-cancel" @click="router.back()">取消</button>
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
import { ElMessage, ElMessageBox } from 'element-plus'
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
    }
  } catch (error) {
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
  } catch (error) {
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
  background-color: #f5f7fa;
}

.main-content {
  margin-top: 70px;
  padding: 24px;
  min-height: calc(100vh - 70px);
}

.edit-container {
  max-width: 800px;
  margin: 0 auto;
}

.back-nav {
  margin-bottom: 20px;
}

.btn-back {
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-back:hover {
  color: #409eff;
  transform: translateX(-4px);
}

.edit-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 32px;
}

.card-header {
  margin-bottom: 32px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 头像编辑 */
.avatar-edit-section {
  margin-bottom: 32px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
}

.avatar-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 12px;
}

.avatar-edit {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #f0f9ff;
  background-color: #f5f7fa;
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
  font-size: 40px;
  font-weight: 600;
}

.avatar-actions {
  display: flex;
  gap: 12px;
}

.btn-upload {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-upload:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-cancel {
  padding: 8px 20px;
  background: transparent;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  border-color: #f56c6c;
  color: #f56c6c;
}

/* 表单 */
.edit-form {
  max-width: 500px;
}

.readonly-field {
  color: #333;
  font-size: 14px;
  line-height: 32px;
}

.field-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}

.btn-save {
  padding: 10px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .main-content {
    margin-top: 60px;
    padding: 16px;
  }

  .edit-card {
    padding: 20px;
  }

  .avatar-edit {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .avatar-preview {
    width: 80px;
    height: 80px;
  }

  .avatar-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-upload,
  .btn-cancel {
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-save,
  .btn-cancel {
    width: 100%;
  }
}
</style>
