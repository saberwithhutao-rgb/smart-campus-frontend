<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/index'

// 路由实例
const router = useRouter()

// 表单数据
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  verifyCode: '',
})

// 密码是否可见
const isPasswordVisible = ref(false)

// 错误提示信息
const errorMessage = ref('')

// 判断是否是错误消息（以"失败"或"请"开头的通常是错误）
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

// 发送验证码
const sendVerifyCode = async () => {
  // 验证邮箱是否为空
  if (!form.email || !form.email.trim()) {
    errorMessage.value = '请输入邮箱地址'
    return
  }

  try {
    const response = await api.sendVerifyCode(form.email)
    console.log('验证码响应:', response)

    // 检查响应状态
    if (response.code !== 200) {
      errorMessage.value = response.message || '发送验证码失败'
      return
    }

    // 发送成功
    errorMessage.value = response.message || '验证码已发送，请查收邮件'
    // 3秒后清除成功提示
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } catch (error: unknown) {
    // 类型守卫函数
    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) {
        return err.message
      }
      if (typeof err === 'string') {
        return err
      }
      return '发送验证码失败'
    }
    errorMessage.value = getErrorMessage(error)
  }
}

// 注册
const handleRegister = async () => {
  // 清除之前的错误提示
  errorMessage.value = ''

  // 表单验证
  if (!form.username || !form.username.trim()) {
    errorMessage.value = '请输入用户名'
    return
  }

  if (!form.password || form.password.length < 6) {
    errorMessage.value = '密码长度不能少于6位'
    return
  }

  if (!form.confirmPassword || !form.confirmPassword.trim()) {
    errorMessage.value = '请确认密码'
    return
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  if (!form.email || !form.email.trim()) {
    errorMessage.value = '请输入邮箱地址'
    return
  }

  if (!form.verifyCode || !form.verifyCode.trim()) {
    errorMessage.value = '请输入验证码'
    return
  }

  try {
    const response = await api.register({
      username: form.username,
      password: form.password,
      email: form.email,
      verifyCode: form.verifyCode,
    })

    // 检查响应状态
    if (response.code === 200) {
      // 注册成功
      alert('注册成功！请登录')
      router.push('/login')
    } else {
      // 注册失败（用户名已存在等）
      errorMessage.value = response.message || '注册失败'
    }

    // 注册成功后跳转到登录页
    alert('注册成功！请登录')
    router.push('/login')
  } catch (error: unknown) {
    // 修改这里
    // 类型守卫函数
    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) {
        return err.message
      }
      if (typeof err === 'string') {
        return err
      }
      return '注册失败'
    }

    errorMessage.value = getErrorMessage(error)
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

      <!-- 错误提示 -->
      <div v-if="errorMessage" :class="['message-alert', isError ? 'error' : 'success']">
        {{ errorMessage }}
      </div>

      <!-- 用户名 -->
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          placeholder="请输入用户名"
          class="form-control"
        />
      </div>

      <!-- 密码 -->
      <div class="form-group">
        <label for="password">密码</label>
        <div class="password-input">
          <input
            id="password"
            v-model="form.password"
            :type="isPasswordVisible ? 'text' : 'password'"
            placeholder="请输入密码（至少6位）"
            class="form-control"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="password-toggle"
            title="切换密码可见性"
          >
            {{ isPasswordVisible ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
      </div>

      <!-- 确认密码 -->
      <div class="form-group">
        <label for="confirmPassword">确认密码</label>
        <div class="password-input">
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="isPasswordVisible ? 'text' : 'password'"
            placeholder="请再次输入密码"
            class="form-control"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="password-toggle"
            title="切换密码可见性"
          >
            {{ isPasswordVisible ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
      </div>

      <!-- 邮箱 -->
      <div class="form-group">
        <label for="email">QQ邮箱</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="请输入QQ邮箱"
          class="form-control"
        />
      </div>

      <!-- 验证码 -->
      <div class="form-group">
        <label for="verifyCode">验证码</label>
        <div class="captcha-input">
          <input
            id="verifyCode"
            v-model="form.verifyCode"
            type="text"
            placeholder="请输入验证码"
            class="form-control"
          />
          <button @click="sendVerifyCode" class="send-captcha-btn">发送验证码</button>
        </div>
      </div>

      <!-- 注册按钮 -->
      <button @click="handleRegister" class="register-button">注册</button>

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
</style>
