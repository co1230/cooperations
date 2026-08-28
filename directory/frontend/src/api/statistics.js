// frontend/src/api/statistics.js


import axios from "axios"



const request = axios.create({

    baseURL:"http://localhost:8000/api",

    timeout:5000,

    headers:{

        "Content-Type":"application/json"

    }

})





// =====================================
// 获取营收统计
//
// GET /api/statistics/summary
//
// =====================================


export function getStatistics(){


    return request.get(

        "/statistics/summary"

    )


}



export default request
