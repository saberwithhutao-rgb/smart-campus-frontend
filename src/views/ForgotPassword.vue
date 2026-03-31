<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/index'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 步骤控制：1-输入邮箱+图形码，2-输入验证码+新密码
const step = ref(1)

// 表单数据
const form = reactive({
  email: '',
  captcha: '',
  captchaId: '',
  verifyCode: '',
  newPassword: '',
  confirmPassword: '',
})

// 图形验证码相关
const captchaBase64 = ref('')
const isGettingCaptcha = ref(false)

// 倒计时
const countdown = ref(0)
const canSendCode = computed(() => countdown.value === 0)

// 加载状态
const isSendingCode = ref(false)
const isResetting = ref(false)

// 错误提示
const errorMessage = ref('')

// ==================== 验证函数 ====================

const validateEmail = (email: string): string => {
  if (!email.trim()) return '邮箱不能为空'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return '邮箱格式不正确'
  return ''
}
// 验证密码强度（加强版）
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

  // 不允许空格
  if (password.includes(' ')) return '密码不能包含空格'

  return ''
}

const validateConfirmPassword = (password: string, confirm: string): string => {
  if (!confirm) return '请确认密码'
  if (password !== confirm) return '两次输入的密码不一致'
  return ''
}

// ==================== 获取图形验证码 ====================
const getCaptcha = async () => {
  isGettingCaptcha.value = true
  try {
    const res = await api.getCaptcha()
    console.log('图形验证码响应:', res)

    if (res.captchaBase64) {
      captchaBase64.value = res.captchaBase64
      form.captchaId = res.captchaId
      form.captcha = ''
      errorMessage.value = ''
    } else {
      errorMessage.value = '获取验证码失败'
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    errorMessage.value = '获取验证码失败'
  } finally {
    isGettingCaptcha.value = false
  }
}

// ==================== 发送重置验证码 ====================
const sendResetCode = async () => {
  // 验证邮箱
  const emailError = validateEmail(form.email)
  if (emailError) {
    errorMessage.value = emailError
    return
  }

  // 验证图形验证码
  if (!form.captcha.trim()) {
    errorMessage.value = '请输入图形验证码'
    return
  }

  isSendingCode.value = true
  errorMessage.value = ''

  try {
    const res = await api.sendResetCode({
      email: form.email,
      captcha: form.captcha,
      captchaId: form.captchaId,
    })

    if (res.code === 200) {
      ElMessage.success('验证码已发送至邮箱')
      // 进入第二步
      step.value = 2
      // 开始倒计时
      startCountdown()
    } else {
      errorMessage.value = res.message || '发送失败'
      // 刷新图形验证码
      getCaptcha()
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    errorMessage.value = '发送失败'
    getCaptcha()
  } finally {
    isSendingCode.value = false
  }
}

// 倒计时
const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// ==================== 重置密码 ====================
const handleReset = async () => {
  errorMessage.value = ''

  // 验证验证码
  if (!form.verifyCode.trim()) {
    errorMessage.value = '请输入邮箱验证码'
    return
  }
  if (!/^\d{6}$/.test(form.verifyCode)) {
    errorMessage.value = '验证码应为6位数字'
    return
  }

  // 验证新密码
  const pwdError = validatePassword(form.newPassword)
  if (pwdError) {
    errorMessage.value = pwdError
    return
  }

  // 验证确认密码
  const confirmError = validateConfirmPassword(form.newPassword, form.confirmPassword)
  if (confirmError) {
    errorMessage.value = confirmError
    return
  }

  isResetting.value = true

  try {
    const res = await api.resetPassword({
      email: form.email,
      verifyCode: form.verifyCode,
      newPassword: form.newPassword,
    })

    if (res.code === 200) {
      ElMessage.success('密码重置成功，请重新登录')
      // 跳转回登录页
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      errorMessage.value = res.message || '重置失败'
    }
  } catch (error) {
    console.error('重置密码失败:', error)
    errorMessage.value = '重置失败'
  } finally {
    isResetting.value = false
  }
}

// 返回登录页
const goToLogin = () => {
  router.push('/login')
}

// 组件挂载时获取验证码
onMounted(() => {
  getCaptcha()
})
</script>

<template>
  <div class="forgot-container">
    <div class="forgot-form-wrapper">
      <div class="forgot-form">
        <h2>找回密码</h2>

        <!-- 步骤指示器 -->
        <div class="steps">
          <div class="step" :class="{ active: step === 1, completed: step > 1 }">
            <div class="step-number">1</div>
            <div class="step-label">验证身份</div>
          </div>
          <div class="step-line" :class="{ active: step > 1 }"></div>
          <div class="step" :class="{ active: step === 2 }">
            <div class="step-number">2</div>
            <div class="step-label">重置密码</div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-alert">
          {{ errorMessage }}
        </div>

        <!-- 步骤1：验证身份 -->
        <div v-if="step === 1">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="请输入注册时使用的邮箱"
              class="form-control"
            />
            <div class="field-hint">验证码将发送到此邮箱</div>
          </div>

          <div class="form-group">
            <label for="captcha">图形验证码</label>
            <div class="captcha-input">
              <input
                id="captcha"
                v-model="form.captcha"
                type="text"
                placeholder="请输入验证码"
                class="form-control"
                maxlength="4"
                style="text-transform: uppercase"
              />
              <button @click="getCaptcha" class="refresh-captcha-btn" :disabled="isGettingCaptcha">
                {{ isGettingCaptcha ? '加载中' : '刷新' }}
              </button>
            </div>
            <div class="captcha-image-container">
              <img
                :src="captchaBase64"
                alt="验证码"
                @click="getCaptcha"
                class="captcha-image"
                title="点击刷新验证码"
              />
              <div class="captcha-hint">点击图片刷新验证码</div>
            </div>
          </div>

          <button @click="sendResetCode" class="submit-button" :disabled="isSendingCode">
            {{ isSendingCode ? '发送中...' : '发送验证码' }}
          </button>
        </div>

        <!-- 步骤2：重置密码 -->
        <div v-if="step === 2">
          <div class="form-group">
            <label for="verifyCode">邮箱验证码</label>
            <div class="verify-input">
              <input
                id="verifyCode"
                v-model="form.verifyCode"
                type="text"
                placeholder="请输入6位数字验证码"
                class="form-control"
                maxlength="6"
              />
              <button @click="sendResetCode" class="resend-btn" :disabled="!canSendCode">
                {{ canSendCode ? '重新发送' : `${countdown}秒后重试` }}
              </button>
            </div>
            <div class="field-hint">验证码10分钟内有效</div>
          </div>

          <div class="form-group">
            <label for="newPassword">新密码</label>
            <input
              id="newPassword"
              v-model="form.newPassword"
              type="password"
              placeholder="8-20位，需包含大写字母、小写字母和数字"
              class="form-control"
            />
            <div class="field-hint">
              密码强度：
              <span
                :class="{
                  weak: form.newPassword.length < 8,
                  medium:
                    form.newPassword.length >= 8 &&
                    (!/[A-Z]/.test(form.newPassword) ||
                      !/[a-z]/.test(form.newPassword) ||
                      !/\d/.test(form.newPassword)),
                  strong:
                    form.newPassword.length >= 8 &&
                    /[A-Z]/.test(form.newPassword) &&
                    /[a-z]/.test(form.newPassword) &&
                    /\d/.test(form.newPassword),
                }"
              >
                {{
                  form.newPassword.length < 8
                    ? '弱'
                    : !/[A-Z]/.test(form.newPassword) ||
                        !/[a-z]/.test(form.newPassword) ||
                        !/\d/.test(form.newPassword)
                      ? '中'
                      : '强'
                }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">确认新密码</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              class="form-control"
            />
          </div>

          <button @click="handleReset" class="submit-button" :disabled="isResetting">
            {{ isResetting ? '重置中...' : '重置密码' }}
          </button>
        </div>

        <!-- 返回登录链接 -->
        <div class="back-link">
          <a href="#" @click.prevent="goToLogin">返回登录</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background-image: url('../img/bg_login.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: var(--color-bg-dark);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0;
}

/* 表单外层包装器 - 控制位置 */
.forgot-form-wrapper {
  width: 30%;
  max-width: 480px;
  min-width: 320px;
  margin-right: 5%;
  max-height: 90vh;
  overflow-y: auto;
}

/* 表单样式 */
.forgot-form {
  background-color: var(--color-bg-card);
  padding: 45px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  transition: transform 0.3s ease;
}

.forgot-form:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
}

.forgot-form h2 {
  text-align: center;
  margin-bottom: 35px;
  color: var(--color-text);
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 步骤指示器 */
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 35px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-border);
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: var(--color-bg-card);
}

.step.completed .step-number {
  background-color: var(--color-success);
  color: var(--color-bg-card);
}

.step-label {
  font-size: 12px;
  color: var(--color-text-light);
}

.step.active .step-label {
  color: var(--color-primary);
  font-weight: 500;
}

.step-line {
  width: 60px;
  height: 2px;
  background-color: var(--color-border);
  margin: 0 15px;
  margin-bottom: 28px;
}

.step-line.active {
  background-color: var(--color-success);
}

/* 表单样式 */
.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 16px;
  transition: all 0.3s ease;
  background-color: var(--color-bg-light);
  color: var(--color-text);
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--color-bg-card);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.field-hint {
  color: var(--color-text-light);
  font-size: 12px;
  margin-top: 4px;
}

.error-alert {
  background-color: var(--color-danger-light);
  border: 1px solid var(--color-danger-light);
  color: var(--color-danger);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  margin-bottom: 25px;
  font-size: 14px;
}

/* 验证码输入 */
.captcha-input {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.captcha-input .form-control {
  flex: 1;
}

.refresh-captcha-btn {
  padding: 0 20px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.refresh-captcha-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--color-primary-light);
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
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s;
}

.captcha-image:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.captcha-hint {
  font-size: 12px;
  color: var(--color-text-light);
}

/* 验证码输入 + 重发按钮 */
.verify-input {
  display: flex;
  gap: 12px;
}

.verify-input .form-control {
  flex: 1;
}

.resend-btn {
  padding: 0 20px;
  background-color: var(--color-bg-light);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.resend-btn:hover:not(:disabled) {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.resend-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 提交按钮 */
.submit-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--color-primary-light);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 返回链接 */
.back-link {
  text-align: center;
  margin-top: 25px;
}

.back-link a {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 14px;
}

.back-link a:hover {
  text-decoration: underline;
}

/* 密码强度 */
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

/* ========== 响应式适配 ========== */

/* 大屏幕 (1440px+) */
@media (min-width: 1440px) {
  .forgot-form-wrapper {
    width: 28%;
    max-width: 520px;
    margin-right: 6%;
  }

  .forgot-form {
    padding: 45px 40px;
  }
}

/* 桌面 (1024px - 1440px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .forgot-form-wrapper {
    width: 32%;
    max-width: 450px;
    margin-right: 5%;
  }

  .forgot-form {
    padding: 38px 32px;
  }
}

/* 小桌面/大平板 (768px - 1024px) - 表单居中 */
@media (min-width: 768px) and (max-width: 1023px) {
  .forgot-container {
    justify-content: center;
  }

  .forgot-form-wrapper {
    width: 60%;
    max-width: 450px;
    margin-right: 0;
  }

  .forgot-form {
    background-color: var(--color-bg-card);
  }
}

/* 移动端 (小于768px) */
@media (max-width: 767px) {
  .forgot-container {
    justify-content: center;
    background-position: 30% center;
  }

  .forgot-form-wrapper {
    width: 90%;
    min-width: auto;
    margin-right: 0;
    max-height: 85vh;
  }

  .forgot-form {
    padding: 30px 24px;
  }

  .forgot-form h2 {
    font-size: 24px;
    margin-bottom: 28px;
  }

  .captcha-input {
    flex-direction: column;
    gap: 8px;
  }

  .refresh-captcha-btn {
    width: 100%;
    padding: 10px;
  }

  .captcha-image {
    width: 100%;
    height: auto;
    min-height: 45px;
  }
}
</style>
