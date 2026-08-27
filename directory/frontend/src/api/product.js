import axios from "axios"


const request = axios.create({
    baseURL:"http://localhost:8000/api",
    timeout:5000
})


// 获取商品列表
export function getProductList(params){
    return request.get("/product/list",{
        params
    })
}


// 新增商品
export function createProduct(data){
    return request.post("/product/create",data)
}


// 修改商品
export function updateProduct(id,data){
    return request.put(`/product/update/${id}`,data)
}


// 删除商品
export function deleteProduct(id){
    return request.delete(`/product/delete/${id}`)
}
