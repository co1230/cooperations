import request from './request'

// 品牌列表（分页+搜索）
export const getBrandList = (params) => request.get('/brand/list', { params })

// 新增品牌
export const createBrand = (data) => request.post('/brand/create', data)

// 修改品牌
export const updateBrand = (id, data) => request.put(`/brand/update/${id}`, data)

// 删除品牌
export const deleteBrand = (id) => request.delete(`/brand/delete/${id}`)
