// frontend/src/api/product.js


import axios from "axios"



// =====================================================
// axios实例
// =====================================================

const request = axios.create({

    baseURL: "http://localhost:8000/api",

    timeout: 5000,

    headers: {

        "Content-Type": "application/json"

    }

})





// =====================================================
// 商品管理接口
// =====================================================



/**
 * 获取商品列表
 *
 * GET
 * /api/product/list
 *
 * 参数:
 * page
 * page_size
 * keyword
 * category_id
 * brand_id
 * status
 */
export function getProductList(params = {}){


    return request.get(

        "/product/list",

        {

            params

        }

    )

}





/**
 * 新增商品
 *
 * POST
 * /api/product/create
 *
 */
export function createProduct(data){


    return request.post(

        "/product/create",

        data

    )

}





/**
 * 修改商品
 *
 * PUT
 * /api/product/update/{product_id}
 *
 */
export function updateProduct(
    productId,
    data
){


    return request.put(

        `/product/update/${productId}`,

        data

    )

}





/**
 * 删除商品
 *
 * DELETE
 * /api/product/delete/{product_id}
 *
 */
export function deleteProduct(productId){


    return request.delete(

        `/product/delete/${productId}`

    )

}





/**
 * 修改商品状态
 *
 * PUT
 * /api/product/status/{product_id}
 *
 * data:
 * {
 *    status:1
 * }
 */
export function updateProductStatus(
    productId,
    status
){


    return request.put(

        `/product/status/${productId}`,

        {

            status

        }

    )

}





export default request
