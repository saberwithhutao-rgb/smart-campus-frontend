import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  baseURL: '',
  timeout: 60000, // 请求超时时间，改为60秒以适应大模型生成
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log('[API Request]', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      headers: config.headers,
    })

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response.data
  },
  (error) => {
    // 统一处理错误
    if (error.response) {
      // 服务器返回错误状态码
      console.error('响应错误:', error.response.status, error.response.data)

      // 🟢🟢🟢 处理 401 未授权/Token过期 🟢🟢🟢
      if (error.response.status === 401) {
        // 清除过期的 token
        localStorage.removeItem('userToken')
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')

        // 提示用户
        ElMessage.error('登录已过期，请重新登录')

        // 跳转到登录页
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
      // 处理 403 禁止访问
      else if (error.response.status === 403) {
        ElMessage.error('没有权限访问此资源')
      }
      // 处理 404 资源不存在
      else if (error.response.status === 404) {
        ElMessage.error('请求的资源不存在')
      }
      // 处理 500 服务器错误
      else if (error.response.status === 500) {
        ElMessage.error('服务器开小差了，请稍后再试')
      }
      // 其他错误
      else {
        ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误:', error.request)
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      // 请求配置出错
      console.error('请求错误:', error.message)
      ElMessage.error('请求失败，请稍后再试')
    }
    return Promise.reject(error)
  },
)

export default request
