<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api, ApiResponse } from '../api/index'

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
const isConfirmPasswordVisible = ref(false)

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

const toggleConfirmPasswordVisibility = () => {
  isConfirmPasswordVisible.value = !isConfirmPasswordVisible.value
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

  // 长度限制
  if (password.length < 8) return '密码长度不能少于8位'
  if (password.length > 20) return '密码长度不能超过20位'

  // 必须包含大写字母
  if (!/[A-Z]/.test(password)) return '密码必须包含至少一个大写字母'

  // 必须包含小写字母
  if (!/[a-z]/.test(password)) return '密码必须包含至少一个小写字母'

  // 必须包含数字
  if (!/\d/.test(password)) return '密码必须包含至少一个数字'

  // 可选：特殊字符（不强制，但给提示）
  // if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
  //   return '建议包含特殊字符（!@#$%^&*等）以增强安全性'
  // }

  // 不允许空格
  if (password.includes(' ')) return '密码不能包含空格'

  return ''
}

// 验证确认密码
const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) return '请确认密码'
  if (password !== confirmPassword) return '两次输入的密码不一致'
  return ''
}

// 验证邮箱格式（加强邮箱验证）
const validateEmail = (email: string): string => {
  if (!email.trim()) return '邮箱不能为空'

  // 基础邮箱格式验证（支持所有常见邮箱）
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return '邮箱格式不正确'

  // 可选：域名白名单（如果要限制只能某些域名）
  // const allowedDomains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'foxmail.com']
  // const domain = email.split('@')[1]
  // if (!allowedDomains.includes(domain)) {
  //   return '请使用支持的邮箱（QQ、163、Gmail、Outlook、Foxmail）'
  // }

  return ''
}

// 验证邮箱验证码
const validateVerifyCode = (verifyCode: string): string => {
  if (!verifyCode.trim()) return '请输入邮箱验证码'
  if (!/^\d{6}$/.test(verifyCode)) return '验证码应为6位数字'
  return ''
}

const passwordStrength = computed(() => {
  const pwd = form.password
  if (!pwd) return 'none'

  let strength = 0

  // 长度
  if (pwd.length >= 8) strength++
  if (pwd.length >= 12) strength++

  // 字符类型
  if (/[a-z]/.test(pwd)) strength++
  if (/[A-Z]/.test(pwd)) strength++
  if (/\d/.test(pwd)) strength++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd)) strength++

  if (strength <= 3) return 'weak'
  if (strength <= 5) return 'medium'
  return 'strong'
})

// 强度文本
const strengthText = computed(() => {
  switch (passwordStrength.value) {
    case 'weak':
      return '弱'
    case 'medium':
      return '中'
    case 'strong':
      return '强'
    default:
      return ''
  }
})

// 强度颜色
const strengthColor = computed(() => {
  switch (passwordStrength.value) {
    case 'weak':
      return '#f56c6c'
    case 'medium':
      return '#e6a23c'
    case 'strong':
      return '#67c23a'
    default:
      return '#909399'
  }
})

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
    const response = (await api.sendVerifyCode(form.email)) as unknown as ApiResponse<null>

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
      errorMessage.value = response.message || '发送验证码失败'

      // 如果是邮箱已被注册，可以高亮显示邮箱输入框
      if (response.message.includes('已被注册')) {
        // 可以添加一些UI反馈
        const emailInput = document.getElementById('email')
        if (emailInput) {
          emailInput.style.borderColor = '#f56c6c'
          emailInput.focus()
        }
      }
    }
  } catch (error: any) {
    console.error('发送验证码失败:', error)
    if (error.response?.data?.message) {
      // 如果有后端的具体错误信息，使用它
      errorMessage.value = error.response.data.message
    } else if (error.message) {
      // 否则使用错误对象的消息
      errorMessage.value = error.message
    } else {
      errorMessage.value = '发送验证码失败'
    }
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
    const response = (await api.register({
      username: form.username,
      password: form.password,
      email: form.email,
      verifyCode: form.verifyCode,
    })) as unknown as ApiResponse<null>

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
            placeholder="8-20位，需包含大写字母、小写字母和数字"
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
          密码强度：
          <span :style="{ color: strengthColor, fontWeight: 'bold' }">
            {{ strengthText }}
          </span>
          <span v-if="form.password && passwordStrength !== 'strong'" class="strength-tip">
            （建议使用大小写字母、数字和特殊字符组合）
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
            :type="isConfirmPasswordVisible ? 'text' : 'password'"
            placeholder="请再次输入密码"
            :class="['form-control', { error: fieldErrors.confirmPassword }]"
          />
          <button
            type="button"
            @click="toggleConfirmPasswordVisibility"
            class="password-toggle"
            :title="isConfirmPasswordVisible ? '隐藏密码' : '显示密码'"
          >
            {{ isConfirmPasswordVisible ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
        <div v-if="fieldErrors.confirmPassword" class="field-error">
          {{ fieldErrors.confirmPassword }}
        </div>
      </div>

      <!-- 在邮箱输入框下方添加 -->
      <div class="form-group">
        <label for="email">邮箱 <span class="required">*</span></label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="请输入邮箱地址"
          :class="[
            'form-control',
            { error: fieldErrors.email || errorMessage.includes('邮箱已被注册') },
          ]"
        />
        <div v-if="fieldErrors.email" class="field-error">
          {{ fieldErrors.email }}
        </div>
        <!-- 专门显示邮箱相关的后端错误 -->
        <div v-if="errorMessage.includes('邮箱已被注册')" class="field-error">
          <span style="color: #f56c6c">⚠️</span> {{ errorMessage }}
          <br />
          <small>请使用其他邮箱或<a href="#" @click.prevent="goToLogin">直接登录</a></small>
        </div>
        <div v-else-if="!fieldErrors.email" class="field-hint">
          请使用有效的邮箱地址，验证码将发送到此邮箱
        </div>
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
  background: linear-gradient(135deg, var(--color-primary) 0%, #764ba2 100%);
  padding: 20px;
}

.register-form {
  background-color: var(--color-bg-card);
  padding: 45px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 520px;
  transition: transform 0.3s ease;
}

.register-form:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
}

.register-form h2 {
  text-align: center;
  margin-bottom: 35px;
  color: var(--color-text);
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--color-primary) 0%, #764ba2 100%);
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
  background-color: var(--color-danger-light);
  border: 1px solid rgba(245, 108, 108, 0.3);
  color: var(--color-danger);
}

.message-alert.success {
  background-color: var(--color-primary-light);
  border: 1px solid rgba(64, 158, 255, 0.3);
  color: var(--color-primary);
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background-color: var(--color-bg-light);
  color: var(--color-text);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--color-bg-card);
  box-shadow: 0 0 0 3px var(--color-primary-light);
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
  color: var(--color-text-light);
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: var(--color-primary);
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
  background: linear-gradient(135deg, var(--color-primary) 0%, #764ba2 100%);
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
  background: linear-gradient(135deg, var(--color-primary-hover) 0%, #6a4091 100%);
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
  color: var(--color-text-light);
  font-size: 14px;
}

.login-link a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.login-link a:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.send-captcha-btn {
  padding: 14px 18px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #764ba2 100%);
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
  background: linear-gradient(135deg, var(--color-primary-hover) 0%, #6a4091 100%);
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
  border: 1px solid var(--color-border);
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
  background-color: var(--color-bg-light);
  border-radius: 4px;
  border: 1px solid var(--color-border-light);
}

.captcha-text-display {
  font-size: 16px;
  margin-bottom: 5px;
}

.captcha-label {
  color: var(--color-text-light);
}

.captcha-value {
  color: var(--color-primary);
  font-size: 18px;
  letter-spacing: 3px;
  background-color: var(--color-bg-dark);
  padding: 2px 8px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.captcha-hint {
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 4px;
}

/* 修改邮箱验证码按钮样式 */
.send-captcha-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-captcha-btn:not(:disabled) {
  background: var(--color-success);
  color: white;
}

.send-captcha-btn:not(:disabled):hover {
  background: var(--color-success);
  opacity: 0.85;
}

/* 禁用按钮样式 */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.required {
  color: var(--color-danger);
}

.field-error {
  color: var(--color-danger);
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: var(--color-danger-light);
  border-radius: 4px;
  border-left: 3px solid var(--color-danger);
}

.field-hint {
  color: var(--color-text-light);
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: var(--color-bg-light);
  border-radius: 4px;
}

.form-control.error {
  border-color: var(--color-danger);
  background-color: var(--color-danger-light);
}

.form-control.error:focus {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.1);
}

/* 密码强度指示 */
.weak {
  color: var(--color-danger);
  font-weight: bold;
}

.medium {
  color: var(--color-warning);
  font-weight: bold;
}

.strong {
  color: var(--color-success);
  font-weight: bold;
}

/* 禁用状态的按钮 */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-button:disabled {
  background: linear-gradient(135deg, var(--color-text-light) 0%, #999999 100%);
  transform: none;
  box-shadow: none;
}

.register-button:disabled:hover {
  background: linear-gradient(135deg, var(--color-text-light) 0%, #999999 100%);
  transform: none;
  box-shadow: none;
}

/* 验证码按钮的禁用状态 */
.send-captcha-btn:disabled {
  background: linear-gradient(135deg, var(--color-text-light) 0%, #999999 100%);
  transform: none;
  box-shadow: none;
}

/* 错误状态样式 */
.form-control.error {
  border-color: var(--color-danger);
  background-color: var(--color-danger-light);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

.field-error {
  color: var(--color-danger);
  font-size: 14px;
  margin-top: 6px;
  padding: 8px 12px;
  background-color: var(--color-danger-light);
  border-radius: 4px;
  border-left: 3px solid var(--color-danger);
}

.field-error a {
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
