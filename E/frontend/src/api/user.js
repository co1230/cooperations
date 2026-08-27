import request from './request'

// 用户列表（分页+搜索+状态筛选）
export const getUserList = (params) => request.get('/admin/user/list', { params })

// 封禁用户
export const banUser = (id, data) => request.put(`/admin/user/ban/${id}`, data)

// 解封用户
export const unbanUser = (id) => request.put(`/admin/user/unban/${id}`)
