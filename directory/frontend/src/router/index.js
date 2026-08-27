// frontend/src/router/index.js


import { createRouter, createWebHistory } from "vue-router"



// 页面组件

import Product from "../views/Product.vue"

import Order from "../views/Order.vue"





const routes = [



    // 默认进入商品管理

    {
        path: "/",
        redirect: "/product"
    },



    // 商品管理

    {
        path: "/product",
        name: "Product",
        component: Product
    },



    // 订单管理

    {
        path: "/order",
        name: "Order",
        component: Order
    }



]





const router = createRouter({


    history: createWebHistory(),


    routes


})





export default router
