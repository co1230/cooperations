import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/category',
    children: [
      {
        path: 'category',
        name: 'Category',
        component: () => import('../views/CategoryManage.vue'),
        meta: { title: '类目管理' }
      },
      {
        path: 'brand',
        name: 'Brand',
        component: () => import('../views/BrandManage.vue'),
        meta: { title: '品牌管理' }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('../views/UserManage.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'merchant-review',
        name: 'MerchantReview',
        component: () => import('../views/MerchantReview.vue'),
        meta: { title: '商家审核' }
      },
      {
        path: 'after-sale',
        name: 'AfterSale',
        component: () => import('../views/AfterSaleManage.vue'),
        meta: { title: '售后介入' }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('../views/LogMonitor.vue'),
        meta: { title: '日志监控' }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：未登录跳转登录页
router.beforeEach((to) => {
  const store = useUserStore()
  document.title = to.meta.title ? `${to.meta.title} - 电商后台` : '电商后台'
  if (to.path !== '/login' && !store.token) {
    return '/login'
  }
})

export default router
