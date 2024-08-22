import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/admin/bus',
      name: 'admin-bus',
      component: () => import('../views/AdminBus.vue')
    },
    {
      path: '/admin/ticket',
      name: 'admin-ticket',
      component: () => import('../views/AdminTicket.vue')
    },
    {
      path: '/admin/ticket/:ticketSifer',
      name: 'admin-ticket-details',
      component: () => import('../views/AdminTicketDetails.vue')
    },
    {
      path: '/admin/bus-station',
      name: 'admin-bus-station',
      component: () => import('../views/AdminBusStation.vue')
    },
  ]
})

export default router
