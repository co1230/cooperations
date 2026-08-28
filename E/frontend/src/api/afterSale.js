import request from './request'

// 售后工单列表（分页+状态/类型筛选）
export const getAfterSaleList = (params) => request.get('/after-sale/list', { params })

// 售后工单状态统计
export const getAfterSaleStats = () => request.get('/after-sale/stats')

// 平台介入（待审核 → 处理中）
export const interveneAfterSale = (id) => request.put(`/after-sale/intervene/${id}`)

// 强制退款（原因必填 1-200 字）
export const refundAfterSale = (id, data) => request.put(`/after-sale/refund/${id}`, data)

// 驳回申请/关闭争议（原因必填 1-200 字）
export const closeAfterSale = (id, data) => request.put(`/after-sale/close/${id}`, data)
