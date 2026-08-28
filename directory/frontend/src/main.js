// frontend/src/main.js

import { createApp } from 'vue'


import App from './App.vue'


// 路由
import router from './router'


// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'



const app = createApp(App)



// 注册路由
app.use(router)


// 注册 Element Plus
app.use(ElementPlus)



// 挂载应用
app.mount('#app')
