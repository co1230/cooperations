import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { useUserStore } from '../store'

// axios 实例：baseURL 为 /api，开发环境由 vite 代理转发到后端 8000 端口
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：自动携带 Token
request.interceptors.request.use((config) => {
  const store = useUserStore()
  if (store.token) {
    config.headers.Authorization = `Bearer ${store.token}`
  }
  return config
})

// 响应拦截器：统一处理 {code, message, data} 格式
request.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body.code === 200) {
      return body
    }
    ElMessage.error(body.message || '请求失败')
    return Promise.reject(new Error(body.message || '请求失败'))
  },
  (err) => {
    if (err.response && err.response.status === 401) {
      // 登录过期：清除登录态并跳转登录页
      const store = useUserStore()
      store.logout()
      ElMessage.error('登录已过期，请重新登录')
      router.push('/login')
    } else {
      const detail = err.response?.data?.message || err.message || '网络错误'
      ElMessage.error(detail)
    }
    return Promise.reject(err)
  }
)

export default request
