import request from './request'

// 管理员登录
export const login = (data) => request.post('/admin/login', data)

// 获取当前管理员信息
export const getAdminInfo = () => request.get('/admin/info')
