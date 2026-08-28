// frontend/src/router/index.js


import { createRouter, createWebHistory } from "vue-router"


// 布局组件

import Layout from "../layouts/Layout.vue"


// 页面组件

import Product from "../views/Product.vue"

import Order from "../views/Order.vue"

import AfterSale from "../views/AfterSale.vue"

import Statistics from "../views/Statistics.vue"





const routes = [


    // 商家后台布局

    {
        path: "/",

        component: Layout,


        children: [


            // 商品管理

            {
                path: "product",

                name: "Product",

                component: Product
            },



            // 商家订单管理

            {
                path: "order",

                name: "Order",

                component: Order
            },



            // 商家售后审核

            {
                path: "after-sale",

                name: "AfterSale",

                component: AfterSale
            },



            // 商家营收统计

            {
                path: "statistics",

                name: "Statistics",

                component: Statistics
            }


        ]

    }



]





const router = createRouter({


    history: createWebHistory(),


    routes


})





export default router

