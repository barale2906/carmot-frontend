import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Login from './views/Login.vue'
import MainLayout from './layouts/MainLayout.vue'
import Dashboard from './views/Dashboard.vue'
import Profile from './views/Profile.vue'
import FormularioMatricula from './views/FormularioMatricula.vue'
import ReciboPagoView from './views/ReciboPagoView.vue'
import AsistenciaView from './views/AsistenciaView.vue'
import ActivosView from './views/ActivosView.vue'
import FormulariosLayout from './layouts/FormulariosLayout.vue'
import ConfiguracionLayout from './layouts/ConfiguracionLayout.vue'
import UsuariosView from './views/configuracion/UsuariosView.vue'
import RolesView from './views/configuracion/RolesView.vue'
import PoblacionesView from './views/configuracion/PoblacionesView.vue'
import './assets/styles/main.css'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard
      }
    ]
  },
  {
    path: '/perfil',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Profile',
        component: Profile
      }
    ]
  },
  {
    path: '/activos',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Activos',
        component: ActivosView
      }
    ]
  },
  {
    path: '/academico',
    component: MainLayout,
    children: [
      {
        path: '',
        component: FormulariosLayout,
        children: [
          {
            path: '',
            name: 'FormularioMatricula',
            component: FormularioMatricula
          },
          {
            path: 'recibo-pago',
            name: 'ReciboPago',
            component: ReciboPagoView
          },
          {
            path: 'asistencia',
            name: 'Asistencia',
            component: AsistenciaView
          }
        ]
      }
    ]
  },
  {
    path: '/configuracion',
    component: MainLayout,
    children: [
      {
        path: '',
        component: ConfiguracionLayout,
        children: [
          {
            path: 'usuarios',
            name: 'Usuarios',
            component: UsuariosView
          },
          {
            path: 'roles',
            name: 'Roles',
            component: RolesView
          },
          {
            path: 'poblaciones',
            name: 'Poblaciones',
            component: PoblacionesView
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')


