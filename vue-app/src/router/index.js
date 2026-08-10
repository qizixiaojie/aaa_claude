import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

/**
 * 路由配置
 * - /login：独立登录页
 * - MobileLayout 嵌套布局：带顶部导航栏与底部 TabBar（meta.tab 标记 Tab 项）
 * - 独立子页：无 TabBar，白底 + 返回
 * - 全局前置守卫：requiresAuth 未登录 → /login?redirect=原路径；已登录访问 /login → /
 */
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    component: () => import('../layout/MobileLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../views/Home.vue'),
        meta: { title: '仁爱医院', tab: 'home' },
      },
      {
        path: 'departments',
        name: 'departments',
        component: () => import('../views/Departments.vue'),
        meta: { title: '科室导航', tab: 'departments' },
      },
      {
        path: 'appointments',
        name: 'appointments',
        component: () => import('../views/Appointments.vue'),
        meta: { title: '我的预约', tab: 'appointments', requiresAuth: true },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('../views/Profile.vue'),
        meta: { title: '个人中心', tab: 'profile', requiresAuth: true },
      },
      {
        path: 'doctors',
        name: 'doctors',
        component: () => import('../views/Doctors.vue'),
        meta: { title: '医生列表' },
      },
      {
        path: 'medicines',
        name: 'medicines',
        component: () => import('../views/Medicines.vue'),
        meta: { title: '药品查询' },
      },
      // 未匹配：回退首页
      { path: ':pathMatch(.*)*', redirect: '/' },
    ],
  },
  {
    path: '/doctors/:id',
    name: 'doctorDetail',
    component: () => import('../views/DoctorDetail.vue'),
    meta: { title: '医生详情' },
  },
  {
    path: '/booking/:doctorId',
    name: 'booking',
    component: () => import('../views/Booking.vue'),
    meta: { title: '预约挂号', requiresAuth: true },
  },
  {
    path: '/doctor/department/:deptId',
    name: 'doctorDepartment',
    component: () => import('../views/DoctorDepartment.vue'),
    meta: { title: '科室医生' },
  },
  {
    path: '/prescriptions',
    name: 'prescriptions',
    component: () => import('../views/Prescriptions.vue'),
    meta: { title: '我的处方', requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

// 全局前置守卫：登录拦截
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  // 需要登录但未登录 → 跳登录页，带上 redirect 原路径
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  // 已登录访问登录页 → 回首页
  if (to.name === 'login' && userStore.isLoggedIn) {
    next({ name: 'home' })
    return
  }
  next()
})

export default router
