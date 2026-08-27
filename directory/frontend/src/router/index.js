// frontend/src/router/index.js

import { createRouter, createWebHistory } from "vue-router"


// 页面组件
import Product from "../views/Product.vue"



const routes = [

    {
        path: "/",
        redirect: "/product"
    },


    {
        path: "/product",
        name: "Product",
        component: Product
    }

]



const router = createRouter({

    history: createWebHistory(),

    routes

})



export default router
