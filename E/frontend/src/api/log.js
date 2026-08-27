import request from './request'

// 操作日志列表（分页+筛选）
export const getLogList = (params) => request.get('/log/list', { params })

// 日志统计（今日/累计）
export const getLogStats = () => request.get('/log/stats')
