// frontend/src/api/order.js


import axios from "axios"



const request = axios.create({

    baseURL:"http://localhost:8000/api",

    timeout:5000,

    headers:{
        "Content-Type":"application/json"
    }

})



// 获取订单列表
export function getOrderList(params={}){


    return request.get(

        "/order/list",

        {
            params
        }

    )

}



// 商家发货
export function shipOrder(orderId,data){


    return request.put(

        `/order/ship/${orderId}`,

        data

    )

}



export default request
