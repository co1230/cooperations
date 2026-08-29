// frontend/src/api/after_sale.js


import axios from "axios"



const request = axios.create({

    baseURL:"/trade-api",

    timeout:5000,

    headers:{

        "Content-Type":"application/json"

    }

})





// ======================================
// 获取售后列表
// GET /api/after-sale/list
// ======================================

export function getAfterSaleList(params={}){


    return request.get(

        "/after-sale/list",

        {

            params

        }

    )

}






// ======================================
// 审核售后
// PUT /api/after-sale/audit/{id}
// ======================================

export function auditAfterSale(

    id,

    data

){


    return request.put(

        `/after-sale/audit/${id}`,

        data

    )


}



export default request
