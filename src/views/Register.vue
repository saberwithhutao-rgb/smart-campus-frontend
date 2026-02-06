<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/index'

const router = useRouter()

// 表单数据 - 只需要4个必填字段
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  verifyCode: '',
})

// 密码是否可见
const isPasswordVisible = ref(false)

// 是否正在发送邮箱验证码
const isSendingVerifyCode = ref(false)

// 错误提示信息
const errorMessage = ref('')

// 字段级别的错误信息
const fieldErrors = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  verifyCode: '',
})

// 判断是否是错误消息
const isError = computed(() => {
  const msg = errorMessage.value
  return (
    msg &&
    (msg.includes('失败') || msg.includes('请') || msg.includes('不一致') || msg.includes('不能'))
  )
})

// 切换密码可见性
const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

// ==================== 验证函数 ====================

// 验证用户名格式
const validateUsername = (username: string): string => {
  if (!username.trim()) return '用户名不能为空'
  if (username.length < 3 || username.length > 20) return '用户名长度应为3-20位'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return '用户名只能包含字母、数字和下划线'
  return ''
}

// 验证密码强度
const validatePassword = (password: string): string => {
  if (!password) return '密码不能为空'
  if (password.length < 6) return '密码长度不能少于6位'
  if (!/[a-zA-Z]/.test(password)) return '密码必须包含字母'
  if (!/\d/.test(password)) return '密码必须包含数字'
  return ''
}

// 验证确认密码
const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) return '请确认密码'
  if (password !== confirmPassword) return '两次输入的密码不一致'
  return ''
}

// 验证邮箱格式（加强QQ邮箱验证）
const validateEmail = (email: string): string => {
  if (!email.trim()) return '邮箱不能为空'

  // 基础邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return '邮箱格式不正确'

  // QQ邮箱特定验证
  const qqEmailRegex = /^[1-9]\d{4,10}@qq\.com$/i
  if (!qqEmailRegex.test(email)) return '请输入正确的QQ邮箱（如：12345@qq.com）'

  return ''
}

// 验证邮箱验证码
const validateVerifyCode = (verifyCode: string): string => {
  if (!verifyCode.trim()) return '请输入邮箱验证码'
  if (!/^\d{6}$/.test(verifyCode)) return '验证码应为6位数字'
  return ''
}

// 实时字段验证
watch(
  () => form.username,
  (value) => {
    fieldErrors.username = validateUsername(value)
  },
)

watch(
  () => form.password,
  (value) => {
    fieldErrors.password = validatePassword(value)
    // 如果确认密码已输入，重新验证
    if (form.confirmPassword) {
      fieldErrors.confirmPassword = validateConfirmPassword(value, form.confirmPassword)
    }
  },
)

watch(
  () => form.confirmPassword,
  (value) => {
    fieldErrors.confirmPassword = validateConfirmPassword(form.password, value)
  },
)

watch(
  () => form.email,
  (value) => {
    fieldErrors.email = validateEmail(value)
  },
)

watch(
  () => form.verifyCode,
  (value) => {
    fieldErrors.verifyCode = validateVerifyCode(value)
  },
)

// 表单整体验证状态
const isFormValid = computed(() => {
  return (
    !fieldErrors.username &&
    !fieldErrors.password &&
    !fieldErrors.confirmPassword &&
    !fieldErrors.email &&
    !fieldErrors.verifyCode &&
    form.username.trim() &&
    form.password.trim() &&
    form.confirmPassword.trim() &&
    form.email.trim() &&
    form.verifyCode.trim()
  )
})
const sendVerifyCode = async () => {
  // 验证邮箱是否为空
  const emailError = validateEmail(form.email)
  if (emailError) {
    fieldErrors.email = emailError
    errorMessage.value = '请先填写正确的邮箱地址'
    return
  }

  isSendingVerifyCode.value = true
  try {
    // 修改：只需要email参数
    const response = await api.sendVerifyCode(form.email)

    console.log('邮箱验证码响应:', response)

    if (response.code === 200) {
      errorMessage.value = response.message || '验证码已发送，请查收邮件'

      // 3秒后清除成功提示
      setTimeout(() => {
        if (errorMessage.value === '验证码已发送，请查收邮件') {
          errorMessage.value = ''
        }
      }, 3000)
    } else {
      // 处理错误
      if (response.message.includes('已被注册')) {
        fieldErrors.email = response.message
        errorMessage.value = '该邮箱已被注册'
      } else if (response.message.includes('过于频繁')) {
        errorMessage.value = response.message
      } else {
        errorMessage.value = response.message || '发送验证码失败'
      }
    }
  } catch (error: unknown) {
    console.error('发送验证码失败:', error)
    errorMessage.value =
      '发送验证码失败: ' + (error instanceof Error ? error.message : String(error))
  } finally {
    isSendingVerifyCode.value = false
  }
}

// ========== 注册函数（简化） ==========
const handleRegister = async () => {
  // 清除之前的错误提示
  errorMessage.value = ''

  // 验证所有字段
  const errors = {
    username: validateUsername(form.username),
    password: validatePassword(form.password),
    confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    email: validateEmail(form.email),
    verifyCode: validateVerifyCode(form.verifyCode),
  }

  // 更新字段错误
  Object.assign(fieldErrors, errors)

  // 检查是否有错误
  const hasErrors = Object.values(errors).some((error) => error)
  if (hasErrors) {
    const firstError = Object.values(errors).find((error) => error)
    errorMessage.value = firstError || '请检查表单填写'
    return
  }

  try {
    // 修改：只需要4个字段
    const response = await api.register({
      username: form.username,
      password: form.password,
      email: form.email,
      verifyCode: form.verifyCode,
    })

    if (response.code === 200) {
      // 注册成功
      alert('注册成功！请登录')
      router.push('/login')
    } else {
      // 处理特定的后端错误
      if (response.message.includes('用户名已存在')) {
        fieldErrors.username = response.message
        errorMessage.value = '用户名已存在'
      } else if (response.message.includes('邮箱已被注册')) {
        fieldErrors.email = response.message
        errorMessage.value = '邮箱已被注册'
      } else if (response.message.includes('验证码错误') || response.message.includes('已过期')) {
        fieldErrors.verifyCode = response.message
        errorMessage.value = '验证码错误或已过期'
      } else {
        errorMessage.value = response.message || '注册失败'
      }
    }
  } catch (error: unknown) {
    console.error('注册请求失败:', error)
    errorMessage.value = '注册失败: ' + (error instanceof Error ? error.message : String(error))
  }
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-form">
      <h2>智慧校园平台 - 注册</h2>

      <!-- 错误/成功提示 -->
      <div v-if="errorMessage" :class="['message-alert', isError ? 'error' : 'success']">
        {{ errorMessage }}
      </div>

      <!-- 用户名 -->
      <div class="form-group">
        <label for="username">用户名 <span class="required">*</span></label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          placeholder="3-20位字母、数字、下划线"
          :class="['form-control', { error: fieldErrors.username }]"
          maxlength="20"
        />
        <div v-if="fieldErrors.username" class="field-error">
          {{ fieldErrors.username }}
        </div>
        <div v-else class="field-hint">用户名将用于登录，注册后不可修改</div>
      </div>

      <!-- 密码 -->
      <div class="form-group">
        <label for="password">密码 <span class="required">*</span></label>
        <div class="password-input">
          <input
            id="password"
            v-model="form.password"
            :type="isPasswordVisible ? 'text' : 'password'"
            placeholder="至少6位，需包含字母和数字"
            :class="['form-control', { error: fieldErrors.password }]"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="password-toggle"
            :title="isPasswordVisible ? '隐藏密码' : '显示密码'"
          >
            {{ isPasswordVisible ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
        <div v-if="fieldErrors.password" class="field-error">
          {{ fieldErrors.password }}
        </div>
        <div v-else class="field-hint">
          密码强度：<span
            :class="{
              weak: form.password.length < 6,
              medium:
                form.password.length >= 6 &&
                (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)),
              strong:
                form.password.length >= 6 &&
                /[a-zA-Z]/.test(form.password) &&
                /\d/.test(form.password),
            }"
          >
            {{
              form.password.length < 6
                ? '弱'
                : !/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)
                  ? '中'
                  : '强'
            }}
          </span>
        </div>
      </div>

      <!-- 确认密码 -->
      <div class="form-group">
        <label for="confirmPassword">确认密码 <span class="required">*</span></label>
        <div class="password-input">
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="isPasswordVisible ? 'text' : 'password'"
            placeholder="请再次输入密码"
            :class="['form-control', { error: fieldErrors.confirmPassword }]"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="password-toggle"
            :title="isPasswordVisible ? '隐藏密码' : '显示密码'"
          >
            {{ isPasswordVisible ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
        <div v-if="fieldErrors.confirmPassword" class="field-error">
          {{ fieldErrors.confirmPassword }}
        </div>
      </div>

      <!-- 邮箱 -->
      <div class="form-group">
        <label for="email">QQ邮箱 <span class="required">*</span></label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="请输入QQ邮箱（如：12345@qq.com）"
          :class="['form-control', { error: fieldErrors.email }]"
        />
        <div v-if="fieldErrors.email" class="field-error">
          {{ fieldErrors.email }}
        </div>
        <div v-else class="field-hint">请使用QQ邮箱注册，验证码将发送到此邮箱</div>
      </div>

      <!-- 邮箱验证码 -->
      <div class="form-group">
        <label for="verifyCode">邮箱验证码 <span class="required">*</span></label>
        <div class="captcha-input">
          <input
            id="verifyCode"
            v-model="form.verifyCode"
            type="text"
            placeholder="请输入6位数字验证码"
            :class="['form-control', { error: fieldErrors.verifyCode }]"
            maxlength="6"
          />
          <button
            @click="sendVerifyCode"
            class="send-captcha-btn"
            :disabled="isSendingVerifyCode || !form.email"
            :title="!form.email ? '请先填写邮箱' : ''"
          >
            {{ isSendingVerifyCode ? '发送中...' : '发送验证码' }}
          </button>
        </div>
        <div v-if="fieldErrors.verifyCode" class="field-error">
          {{ fieldErrors.verifyCode }}
        </div>
        <div v-else class="field-hint">验证码10分钟内有效</div>
      </div>

      <!-- 注册按钮 -->
      <button
        @click="handleRegister"
        class="register-button"
        :disabled="!isFormValid"
        :title="!isFormValid ? '请填写完整的表单信息' : ''"
      >
        注册
      </button>

      <!-- 登录链接 -->
      <div class="login-link">已有账号？<a href="#" @click.prevent="goToLogin">立即登录</a></div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-form {
  background-color: white;
  padding: 45px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 420px;
  transition: transform 0.3s ease;
}

.register-form:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
}

.register-form h2 {
  text-align: center;
  margin-bottom: 35px;
  color: #333;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.message-alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 25px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.message-alert.error {
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  color: #f56c6c;
}

.message-alert.success {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0284c7;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #667eea;
}

.captcha-input {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-input .form-control {
  flex: 1;
}

.register-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 10px;
}

.register-button:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4091 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.register-button:active {
  transform: translateY(1px);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.2);
}

.login-link {
  text-align: center;
  margin-top: 25px;
  color: #777;
  font-size: 14px;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.login-link a:hover {
  color: #5a6fd8;
  text-decoration: underline;
}

.send-captcha-btn {
  padding: 14px 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 110px;
}

.send-captcha-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4091 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.captcha-display {
  margin-top: 10px;
  text-align: center;
}

.captcha-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.captcha-image {
  width: 120px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.captcha-image:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.captcha-text-container {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.captcha-text-display {
  font-size: 16px;
  margin-bottom: 5px;
}

.captcha-label {
  color: #666;
}

.captcha-value {
  color: #1890ff;
  font-size: 18px;
  letter-spacing: 3px;
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.captcha-hint {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

/* 修改邮箱验证码按钮样式 */
.send-captcha-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-captcha-btn:not(:disabled) {
  background-color: #52c41a;
  color: white;
}

.send-captcha-btn:not(:disabled):hover {
  background-color: #40a51f;
}

/* 禁用按钮样式 */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.required {
  color: #f56c6c;
}

.field-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #fef0f0;
  border-radius: 4px;
  border-left: 3px solid #f56c6c;
}

.field-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.form-control.error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.form-control.error:focus {
  border-color: #f56c6c;
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.1);
}

/* 密码强度指示 */
.weak {
  color: #f56c6c;
  font-weight: bold;
}

.medium {
  color: #e6a23c;
  font-weight: bold;
}

.strong {
  color: #67c23a;
  font-weight: bold;
}

/* 禁用状态的按钮 */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-button:disabled {
  background: linear-gradient(135deg, #cccccc 0%, #999999 100%);
  transform: none;
  box-shadow: none;
}

.register-button:disabled:hover {
  background: linear-gradient(135deg, #cccccc 0%, #999999 100%);
  transform: none;
  box-shadow: none;
}

/* 验证码按钮的禁用状态 */
.send-captcha-btn:disabled {
  background: linear-gradient(135deg, #cccccc 0%, #999999 100%);
  transform: none;
  box-shadow: none;
}
</style>
