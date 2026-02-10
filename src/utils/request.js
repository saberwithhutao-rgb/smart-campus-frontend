import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  baseURL: '/api', // 使用代理路径，与api/index.ts保持一致
  timeout: 60000, // 请求超时时间，改为60秒以适应大模型生成
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    // config.headers.Authorization = localStorage.getItem('token');
    return config
  },
  (error) => {
    console.error('请求错误:', error)
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

      // 处理500错误
      if (error.response.status === 500) {
        ElMessage.error('服务器开小差了，请稍后再试')
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
