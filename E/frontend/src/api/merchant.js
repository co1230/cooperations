import request from './request'

// 商家入驻申请列表
export const getMerchantApplications = (params) => request.get('/admin/merchant/applications', { params })

// 通过入驻申请
export const approveMerchant = (id) => request.post(`/admin/merchant/approve/${id}`)

// 驳回入驻申请（原因必填）
export const rejectMerchant = (id, data) => request.post(`/admin/merchant/reject/${id}`, data)
