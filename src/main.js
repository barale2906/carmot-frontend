import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { routeAccessGuard, entrarAlModulo } from './guards/menuGuards'
import Login from './views/Login.vue'
import MainLayout from './layouts/MainLayout.vue'
import Dashboard from './views/Dashboard.vue'
import Profile from './views/Profile.vue'
import FormularioMatricula from './views/FormularioMatricula.vue'
import ReciboPagoView from './views/ReciboPagoView.vue'
import AsistenciaView from './views/AsistenciaView.vue'
import CalificacionesView from './views/academico/CalificacionesView.vue'
import ActivosView from './views/ActivosView.vue'
import ActivosLayout from './layouts/ActivosLayout.vue'
import ActCategoriasView from './views/activos/ActCategoriasView.vue'
import ActTrasladosView from './views/activos/ActTrasladosView.vue'
import FormulariosLayout from './layouts/FormulariosLayout.vue'
import ConfiguracionLayout from './layouts/ConfiguracionLayout.vue'
import SedesLayout from './layouts/SedesLayout.vue'
import UsuariosView from './views/configuracion/UsuariosView.vue'
import RolesView from './views/configuracion/RolesView.vue'
import PoblacionesView from './views/configuracion/PoblacionesView.vue'
import SedesView from './views/configuracion/SedesView.vue'
import AreasView from './views/configuracion/AreasView.vue'
import HorariosView from './views/configuracion/HorariosView.vue'
import EpsView from './views/configuracion/EpsView.vue'
import DiasNoLaborablesView from './views/configuracion/DiasNoLaborablesView.vue'
import AcademicoLayout from './layouts/AcademicoLayout.vue'
import ProgramacionesLayout from './layouts/ProgramacionesLayout.vue'
import FinancieroLayout from './layouts/FinancieroLayout.vue'
import CursosView from './views/academico/CursosView.vue'
import ModulosView from './views/academico/ModulosView.vue'
import TopicosView from './views/academico/TopicosView.vue'
import TemasView from './views/academico/TemasView.vue'
import BibliotecaView from './views/academico/BibliotecaView.vue'
import CiclosView from './views/academico/CiclosView.vue'
import GruposView from './views/academico/GruposView.vue'
import ConceptoPagoView from './views/financiero/ConceptoPagoView.vue'
import TipoProductoView from './views/financiero/TipoProductoView.vue'
import ProductoView from './views/financiero/ProductoView.vue'
import ListaPrecioView from './views/financiero/ListaPrecioView.vue'
import RecibosPagoView from './views/financiero/RecibosPagoView.vue'
import CarteraView from './views/financiero/CarteraView.vue'
import DescuentosView from './views/financiero/DescuentosView.vue'
import TransferenciasPendientesView from './views/financiero/TransferenciasPendientesView.vue'
import CajaView from './views/financiero/CajaView.vue'
import LibroDiarioView from './views/financiero/LibroDiarioView.vue'
import TurnosCajaView from './views/financiero/TurnosCajaView.vue'
import LdCatalogosView from './views/financiero/LdCatalogosView.vue'
import BancosView from './views/configuracion/BancosView.vue'
import MatriculaView from './views/academico/MatriculaView.vue'
import DocumentacionLayout    from './layouts/DocumentacionLayout.vue'
import DocDocumentosView      from './views/academico/documentacion/DocDocumentosView.vue'
import DocPlantillasView      from './views/academico/documentacion/DocPlantillasView.vue'
import DocTiposDocumentoView  from './views/academico/documentacion/DocTiposDocumentoView.vue'
import InventarioLayout from './layouts/InventarioLayout.vue'
import CrmLayout        from './layouts/CrmLayout.vue'
import ReferidosView    from './views/crm/ReferidosView.vue'
import SeguimientosView from './views/crm/SeguimientosView.vue'
import AgendasView      from './views/crm/AgendasView.vue'
import CategoriasView      from './views/inventario/CategoriasView.vue'
import UnidadesMedidaView  from './views/inventario/UnidadesMedidaView.vue'
import ProductosInvView    from './views/inventario/ProductosView.vue'
import AlmacenesView       from './views/inventario/AlmacenesView.vue'
import ProveedoresView     from './views/inventario/ProveedoresView.vue'
import StockView           from './views/inventario/StockView.vue'
import MovimientosView     from './views/inventario/MovimientosView.vue'
import PreciosInvView      from './views/inventario/PreciosView.vue'
import VentasView                    from './views/inventario/VentasView.vue'
import EntregasView                  from './views/inventario/EntregasView.vue'
import OrdenesCompraView             from './views/inventario/OrdenesCompraView.vue'
import InvTransferenciasPendientes   from './views/inventario/TransferenciasPendientesView.vue'
import InvRecibosPagoView            from './views/inventario/InvRecibosPagoView.vue'
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
    path: '/ayudas',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Ayudas',
        // Carga diferida: el manual solo se descarga al abrir Ayudas
        component: () => import('./views/AyudasView.vue'),
        meta: { title: 'Ayudas' }
      }
    ]
  },
  {
    path: '/activos',
    component: MainLayout,
    children: [
      {
        path: '',
        component: ActivosLayout,
        children: [
          { path: '',           name: 'Activos',             component: ActivosView, meta: { permission: 'act_activos' } },
          { path: 'traslados',  name: 'ActivosTraslados',    component: ActTrasladosView, meta: { permission: ['act_activos', 'act_activoRecibir'] } },
          { path: 'categorias', name: 'ActivosCategorias',   component: ActCategoriasView, meta: { permission: 'act_categorias' } }
        ]
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
            meta: { permission: 'aca_matriculas' },
            component: FormularioMatricula
          },
          {
            path: 'recibo-pago',
            name: 'ReciboPago',
            meta: { permission: 'fin_reciboPagoCrear' },
            component: ReciboPagoView
          },
          {
            path: 'asistencia',
            name: 'Asistencia',
            meta: { permission: 'aca_asistencias', soloPersonal: true },
            component: AsistenciaView
          },
          {
            path: 'calificaciones',
            name: 'Calificaciones',
            meta: { permission: 'aca_notas', soloPersonal: true },
            component: CalificacionesView
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
            meta: { permission: 'aca_cursos' },
            component: CursosView
          },
          {
            path: 'modulos',
            name: 'Modulos',
            meta: { permission: 'aca_modulos' },
            component: ModulosView
          },
          {
            path: 'topicos',
            name: 'Topicos',
            meta: { permission: 'aca_topicos' },
            component: TopicosView
          },
          {
            path: 'temas',
            name: 'Temas',
            meta: { permission: 'aca_temas' },
            component: TemasView
          },
          {
            path: 'biblioteca',
            name: 'Biblioteca',
            meta: { permission: 'ac_biblioteca' },
            component: BibliotecaView
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
            meta: { permission: ['aca_programaciones', 'aca_ciclos'] },
            component: CiclosView
          },
          {
            path: 'grupos',
            name: 'Grupos',
            meta: { permission: ['aca_programaciones', 'aca_grupos'] },
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
        meta: { permission: 'aca_matriculas' },
        component: MatriculaView
      }
    ]
  },
  {
    path: '/academico/documentacion',
    component: MainLayout,
    children: [
      {
        path: '',
        component: DocumentacionLayout,
        children: [
          {
            path: '',
            name: 'DocDocumentos',
            meta: { permission: 'aca_documentos' },
            component: DocDocumentosView
          },
          {
            path: 'plantillas',
            name: 'DocPlantillas',
            meta: { permission: 'aca_docPlantillas' },
            component: DocPlantillasView
          },
          {
            path: 'plantillas/:id(\\d+)',
            name: 'DocPlantillaEditor',
            meta: { permission: 'aca_docPlantillas' },
            // Carga diferida: el editor TipTap solo se descarga al abrir una plantilla
            component: () => import('./views/academico/documentacion/DocPlantillaEditorView.vue')
          },
          {
            path: 'tipos',
            name: 'DocTiposDocumento',
            meta: { permission: 'aca_docTipos' },
            component: DocTiposDocumentoView
          }
        ]
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
          // Entrada del módulo: redirige a la primera opción del menú del usuario (F01)
          { path: '', component: { render: () => null }, beforeEnter: entrarAlModulo },
          {
            path: 'tipos-producto',
            name: 'TiposProducto',
            meta: { permission: 'fin_lp_tipos_producto' },
            component: TipoProductoView
          },
          {
            path: 'productos',
            name: 'ProductosLp',
            meta: { permission: 'fin_lp_productos' },
            component: ProductoView
          },
          {
            path: 'listas-precios',
            name: 'ListasPrecios',
            meta: { permission: 'fin_lp_listas_precios' },
            component: ListaPrecioView
          },
          {
            path: 'conceptos-pago',
            name: 'ConceptosPago',
            meta: { permission: 'fin_conceptos_pago' },
            component: ConceptoPagoView
          },
          {
            path: 'recibos-pago',
            name: 'RecibosPago',
            meta: { permission: 'fin_recibos_pago' },
            component: RecibosPagoView
          },
          {
            path: 'cartera',
            name: 'Cartera',
            meta: { permission: 'fin_carteras' },
            component: CarteraView
          },
          {
            path: 'descuentos',
            name: 'Descuentos',
            meta: { permission: 'fin_descuentos' },
            component: DescuentosView
          },
          {
            path: 'transferencias-pendientes',
            name: 'TransferenciasPendientes',
            meta: { permission: 'fin_reciboPagoAprobar' },
            component: TransferenciasPendientesView
          },
          {
            path: 'caja',
            name: 'MiCaja',
            meta: { permission: 'fin_ldTurnoCaja' },
            component: CajaView
          },
          {
            path: 'libro-diario',
            name: 'LibroDiario',
            meta: { permission: 'fin_libroDiario' },
            component: LibroDiarioView
          },
          {
            path: 'turnos-caja',
            name: 'TurnosCaja',
            meta: { permission: ['fin_ldTurnoCaja', 'fin_ldTurnos', 'fin_ldCierreAprobar'] },
            component: TurnosCajaView
          },
          {
            path: 'libro-diario-catalogos',
            name: 'LibroDiarioCatalogos',
            meta: { permission: 'fin_ldCatalogos' },
            component: LdCatalogosView
          }
        ]
      },
      {
        path: 'recibos-pago/nuevo',
        name: 'NuevoReciboPago',
        meta: { permission: 'fin_reciboPagoCrear' },
        component: ReciboPagoView
      }
    ]
  },
  {
    path: '/crm',
    component: MainLayout,
    children: [
      {
        path: '',
        component: CrmLayout,
        children: [
          { path: '',             redirect: '/crm/referidos' },
          { path: 'referidos',    name: 'CrmReferidos',    component: ReferidosView, meta: { permission: 'crm_referidos' } },
          { path: 'seguimientos', name: 'CrmSeguimientos', component: SeguimientosView, meta: { permission: 'crm_seguimientos' } },
          { path: 'agendas',      name: 'CrmAgendas',      component: AgendasView, meta: { permission: 'crm_agendas' } }
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
          // Entrada del módulo: redirige a la primera opción del menú del usuario (F01)
          { path: '', component: { render: () => null }, beforeEnter: entrarAlModulo },
          {
            path: 'usuarios',
            name: 'Usuarios',
            meta: { permission: 'co_users' },
            component: UsuariosView
          },
          {
            path: 'roles',
            name: 'Roles',
            meta: { permission: ['co_roles', 'co_rolPermisos'] },
            component: RolesView
          },
          {
            path: 'eps',
            name: 'Eps',
            meta: { permission: 'co_eps' },
            component: EpsView
          },
          {
            path: 'bancos',
            name: 'Bancos',
            meta: { permission: 'co_bancos' },
            component: BancosView
          },
          {
            path: 'dias-no-laborables',
            name: 'DiasNoLaborables',
            meta: { permission: 'co_diasNoLaborables' },
            component: DiasNoLaborablesView
          }
        ]
      },
      {
        path: 'poblaciones',
        name: 'Poblaciones',
        meta: { permission: 'co_poblaciones' },
        component: PoblacionesView
      },
      {
        path: 'sedes',
        component: SedesLayout,
        children: [
          {
            path: '',
            name: 'Sedes',
            meta: { permission: 'co_sedes' },
            component: SedesView
          },
          {
            path: 'areas',
            name: 'Areas',
            meta: { permission: 'co_areas' },
            component: AreasView
          },
          {
            path: 'horarios',
            name: 'Horarios',
            meta: { permission: 'co_horarios' },
            component: HorariosView
          }
        ]
      }
    ]
  },
  {
    path: '/inventario',
    component: MainLayout,
    children: [
      {
        path: '',
        component: InventarioLayout,
        children: [
          // Entrada del módulo: redirige a la primera opción del menú del usuario (F01)
          { path: '', component: { render: () => null }, beforeEnter: entrarAlModulo },
          {
            path: 'categorias',
            name: 'InvCategorias',
            meta: { permission: 'inv_categorias' },
            component: CategoriasView
          },
          {
            path: 'unidades-medida',
            name: 'InvUnidadesMedida',
            meta: { permission: 'inv_unidades' },
            component: UnidadesMedidaView
          },
          {
            path: 'productos',
            name: 'InvProductos',
            meta: { permission: 'inv_productos' },
            component: ProductosInvView
          },
          {
            path: 'almacenes',
            name: 'InvAlmacenes',
            meta: { permission: 'inv_almacenes' },
            component: AlmacenesView
          },
          {
            path: 'proveedores',
            name: 'InvProveedores',
            meta: { permission: 'inv_proveedores' },
            component: ProveedoresView
          },
          {
            path: 'stock',
            name: 'InvStock',
            meta: { permission: 'inv_stock' },
            component: StockView
          },
          {
            path: 'movimientos',
            name: 'InvMovimientos',
            meta: { permission: 'inv_movimientos' },
            component: MovimientosView
          },
          {
            path: 'precios',
            name: 'InvPrecios',
            meta: { permission: 'inv_precios' },
            component: PreciosInvView
          },
          {
            path: 'ventas',
            name: 'InvVentas',
            meta: { permission: 'inv_ventas' },
            component: VentasView
          },
          {
            path: 'entregas',
            name: 'InvEntregas',
            meta: { permission: 'inv_entregas' },
            component: EntregasView
          },
          {
            path: 'ordenes-compra',
            name: 'InvOrdenesCompra',
            meta: { permission: 'inv_oc' },
            component: OrdenesCompraView
          },
          {
            path: 'transferencias',
            name: 'InvTransferencias',
            meta: { permission: 'fin_reciboPagoAprobar' },
            component: InvTransferenciasPendientes
          },
          {
            path: 'recibos-pago',
            name: 'InvRecibos',
            meta: { permission: 'fin_recibos_pago' },
            component: InvRecibosPagoView
          },
          {
            // Ruta anterior: se conserva para enlaces guardados
            path: 'recibos',
            redirect: { name: 'InvRecibos' }
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

// Cada pantalla exige su permiso (meta.permission); antes cualquier usuario entraba por URL
router.beforeEach(routeAccessGuard)

createApp(App).use(router).mount('#app')


