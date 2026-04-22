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
import SedesLayout from './layouts/SedesLayout.vue'
import UsuariosView from './views/configuracion/UsuariosView.vue'
import RolesView from './views/configuracion/RolesView.vue'
import PoblacionesView from './views/configuracion/PoblacionesView.vue'
import SedesView from './views/configuracion/SedesView.vue'
import AreasView from './views/configuracion/AreasView.vue'
import HorariosView from './views/configuracion/HorariosView.vue'
import AcademicoLayout from './layouts/AcademicoLayout.vue'
import ProgramacionesLayout from './layouts/ProgramacionesLayout.vue'
import FinancieroLayout from './layouts/FinancieroLayout.vue'
import CursosView from './views/academico/CursosView.vue'
import ModulosView from './views/academico/ModulosView.vue'
import TopicosView from './views/academico/TopicosView.vue'
import TemasView from './views/academico/TemasView.vue'
import CiclosView from './views/academico/CiclosView.vue'
import GruposView from './views/academico/GruposView.vue'
import ConceptoPagoView from './views/financiero/ConceptoPagoView.vue'
import TipoProductoView from './views/financiero/TipoProductoView.vue'
import ProductoView from './views/financiero/ProductoView.vue'
import ListaPrecioView from './views/financiero/ListaPrecioView.vue'
import MatriculaView from './views/academico/MatriculaView.vue'
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
    path: '/academico/cursos',
    component: MainLayout,
    children: [
      {
        path: '',
        component: AcademicoLayout,
        children: [
          {
            path: '',
            name: 'Cursos',
            component: CursosView
          },
          {
            path: 'modulos',
            name: 'Modulos',
            component: ModulosView
          },
          {
            path: 'topicos',
            name: 'Topicos',
            component: TopicosView
          },
          {
            path: 'temas',
            name: 'Temas',
            component: TemasView
          }
        ]
      }
    ]
  },
  {
    path: '/academico/programaciones',
    component: MainLayout,
    children: [
      {
        path: '',
        component: ProgramacionesLayout,
        children: [
          {
            path: '',
            name: 'Ciclos',
            component: CiclosView
          },
          {
            path: 'grupos',
            name: 'Grupos',
            component: GruposView
          }
        ]
      }
    ]
  },
  {
    path: '/academico/matriculas',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Matriculas',
        component: MatriculaView
      }
    ]
  },
  {
    path: '/financiero',
    component: MainLayout,
    children: [
      {
        path: '',
        component: FinancieroLayout,
        children: [
          {
            path: 'tipos-producto',
            name: 'TiposProducto',
            component: TipoProductoView
          },
          {
            path: 'productos',
            name: 'ProductosLp',
            component: ProductoView
          },
          {
            path: 'listas-precios',
            name: 'ListasPrecios',
            component: ListaPrecioView
          },
          {
            path: 'conceptos-pago',
            name: 'ConceptosPago',
            component: ConceptoPagoView
          }
          // Próximo módulo:
          // { path: 'recibos-pago', name: 'RecibosPago', component: RecibosPagoView },
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
          }
        ]
      },
      {
        path: 'poblaciones',
        name: 'Poblaciones',
        component: PoblacionesView
      },
      {
        path: 'sedes',
        component: SedesLayout,
        children: [
          {
            path: '',
            name: 'Sedes',
            component: SedesView
          },
          {
            path: 'areas',
            name: 'Areas',
            component: AreasView
          },
          {
            path: 'horarios',
            name: 'Horarios',
            component: HorariosView
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


