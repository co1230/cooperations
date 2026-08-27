import request from './request'

// 获取类目树
export const getCategoryTree = () => request.get('/category/list')

// 新增类目
export const createCategory = (data) => request.post('/category/create', data)

// 修改类目
export const updateCategory = (id, data) => request.put(`/category/update/${id}`, data)

// 删除类目
export const deleteCategory = (id) => request.delete(`/category/delete/${id}`)
