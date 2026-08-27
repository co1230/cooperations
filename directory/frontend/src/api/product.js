// frontend/src/api/product.js

import axios from "axios"


// 创建 axios 实例
const request = axios.create({
    baseURL: "http://localhost:8000/api",
    timeout: 5000,
    headers: {
        "Content-Type": "application/json"
    }
})


// ===============================
// 商品管理接口
// ===============================


// 获取商品列表
// GET /api/product/list
export function getProductList(params = {}) {

    return request.get("/product/list", {
        params
    })

}


// 获取商品详情
// GET /api/product/detail/{product_id}
export function getProductDetail(productId) {

    return request.get(
        `/product/detail/${productId}`
    )

}


// 新增商品
// POST /api/product/create
export function createProduct(data) {

    return request.post(
        "/product/create",
        data
    )

}


// 修改商品
// PUT /api/product/update/{product_id}
export function updateProduct(productId, data) {

    return request.put(
        `/product/update/${productId}`,
        data
    )

}


// 删除商品
// DELETE /api/product/delete/{product_id}
export function deleteProduct(productId) {

    return request.delete(
        `/product/delete/${productId}`
    )

}


// 修改商品状态（上架/下架）
// 如果你的后端没有这个接口，可以暂时不用
// PUT /api/product/status/{product_id}
export function updateProductStatus(productId, status) {

    return request.put(
        `/product/status/${productId}`,
        {
            status
        }
    )

}


export default request
