/**
 * useMatriculaWizard
 *
 * Composable que encapsula el estado, la validación y las operaciones asíncronas
 * del wizard de creación de matrículas. El componente UI se mantiene como capa
 * de presentación pura.
 *
 * @param {{ cursos: ComputedRef, sedes: ComputedRef, comerciales: ComputedRef }} refs
 */
import { ref, reactive, computed, watch } from 'vue'

import cicloService          from '@/services/cicloService.js'
import userService           from '@/services/userService.js'
import matriculaService      from '@/services/matriculaService.js'
import productoLpService     from '@/services/productoLpService.js'
import precioProductoService from '@/services/precioProductoService.js'
import { authService }       from '@/services/authService.js'

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades puras (exportadas para uso en el template)
// ─────────────────────────────────────────────────────────────────────────────

export const today = () => new Date().toISOString().slice(0, 10)

export function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = String(d).slice(0, 10).split('-')
  return `${day}/${m}/${y}`
}

export function formatCOP(val) {
  if (val === null || val === undefined || val === '') return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(val)
}

/** Convierte { CC: 'Cédula de Ciudadanía', ... } → [{ value, label }, ...] */
export function objectToOptions(obj) {
  return Object.entries(obj ?? {}).map(([value, label]) => ({ value, label: String(label) }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

export const WIZARD_STEPS = [
  { key: 'programacion', label: 'Programación' },
  { key: 'estudiante',   label: 'Estudiante'   },
  { key: 'personales',   label: 'Personales'   },
  { key: 'detalles',     label: 'Matrícula'    },
  { key: 'confirmacion', label: 'Confirmación' }
]

/**
 * Mapa campo → paso del wizard.
 * Se usa para redirigir al usuario al paso correcto cuando el backend
 * devuelve un error 422 con errores de validación por campo.
 */
const FIELD_STEP_MAP = {
  // Paso 3 — datos personales
  tipo_identificacion: 3, departamento_expedicion: 3, ciudad_expedicion: 3,
  fecha_nacimiento: 3, genero: 3, estado_civil: 3, grupo_sanguineo: 3, rh: 3,
  direccion: 3, lugar_origen_id: 3, celular: 3, telefono: 3,
  nivel_educacion: 3, ocupacion: 3, empresa: 3, estrato: 3, regimen_salud: 3,
  enfermedad_prioritaria: 3, discapacidad: 3,
  // Paso 4 — detalles de matrícula
  comercial_id: 4, matriculado_por_id: 4, fecha_matricula: 4, fecha_inicio: 4,
  monto: 4, valor_cuota: 4, status: 4, observaciones: 4,
  como_entero_curso: 4, talla_overol: 4, talla_botas: 4, multiculturalidad: 4,
  nombre_contacto: 4, telefono_contacto: 4, correo_contacto: 4,
  conocimiento_curso: 4, aprueba_uso_imagen: 4
}

// ─────────────────────────────────────────────────────────────────────────────
// Composable principal
// ─────────────────────────────────────────────────────────────────────────────

export function useMatriculaWizard({ cursos, sedes, comerciales }) {

  // ── Estado de navegación ────────────────────────────────────────────────────
  const currentStep = ref(1)
  const saving      = ref(false)
  const apiError    = ref('')
  const fieldErrors = ref({})

  // ── Paso 1: Programación ────────────────────────────────────────────────────
  const cursoId           = ref('')
  const cicloId           = ref('')
  const ciclosDisponibles = ref([])
  const ciclosLoading     = ref(false)
  const cicloSeleccionado = ref(null)

  // ── Paso 2: Estudiante ──────────────────────────────────────────────────────
  const documentoBusqueda    = ref('')
  const estudianteBuscando   = ref(false)
  const estudianteEstado     = ref('idle')   // 'idle' | 'found' | 'not_found'
  const estudianteEncontrado = ref(null)
  const actualizarEstudiante = ref(false)
  const estudianteForm = reactive({
    primer_nombre:    '',
    segundo_nombre:   '',
    primer_apellido:  '',
    segundo_apellido: '',
    email:            '',
    documento:        '',
    password:         '',
    password_confirmation: ''
  })

  // ── Paso 3: Datos personales + catálogos ────────────────────────────────────
  const catalogsLoading = ref(false)
  const catalogsError   = ref(false)

  const catalogs = reactive({
    tipos_identificacion: {},
    generos:              {},
    estados_civiles:      {},
    grupos_sanguineos:    {},
    rhs:                  {},
    niveles_educacion:    {},
    regimenes_salud:      {},
    poblaciones:          []
  })

  const datosPersonales = reactive({
    tipo_identificacion:     '',
    departamento_expedicion: '',
    ciudad_expedicion:       '',
    fecha_nacimiento:        '',
    genero:                  '',
    estado_civil:            '',
    grupo_sanguineo:         '',
    rh:                      '',
    direccion:               '',
    lugar_origen_id:         '',
    celular:                 '',
    telefono:                '',
    nivel_educacion:         '',
    ocupacion:               '',
    empresa:                 '',
    estrato:                 '',
    regimen_salud:           '',
    enfermedad_prioritaria:  false,
    discapacidad:            false
  })

  // ── Paso 4: Detalles de matrícula ───────────────────────────────────────────
  const detalles = reactive({
    comercial_id:       '',
    matriculado_por_id: '',
    status:             '1',
    fecha_matricula:    today(),
    fecha_inicio:       '',
    monto:              '',
    valor_cuota:        '',
    observaciones:      '',
    conocimiento_curso: false,
    como_entero_curso:  '',
    talla_overol:       '',
    talla_botas:        '',
    nombre_contacto:    '',
    telefono_contacto:  '',
    correo_contacto:    '',
    aprueba_uso_imagen: false,
    multiculturalidad:  ''
  })

  const formaPago            = ref('contado')
  const precioConsultado     = ref(null)
  const precioLoading        = ref(false)
  const sinPrecioConfigurado = ref(false)

  // ── Computed: selectores ────────────────────────────────────────────────────

  const cursosOpciones = computed(() =>
    (cursos.value ?? []).map(c => ({ value: String(c.id), label: c.nombre }))
  )

  const cursosMap = computed(() => {
    const m = {}
    ;(cursos.value ?? []).forEach(c => { m[String(c.id)] = c.nombre })
    return m
  })

  const ciclosOpciones = computed(() =>
    ciclosDisponibles.value.map(c => ({
      value: String(c.id),
      label: `${c.nombre}  (${formatDate(c.fecha_inicio)} – ${formatDate(c.fecha_fin)})`
    }))
  )

  const comercialesOpciones = computed(() =>
    (comerciales.value ?? []).map(u => ({ value: String(u.id), label: u.name }))
  )

  const comercialesMap = computed(() => {
    const m = {}
    ;(comerciales.value ?? []).forEach(u => { m[String(u.id)] = u.name })
    return m
  })

  const sedeDelCiclo = computed(() => {
    if (!cicloSeleccionado.value) return null
    const sedeId = cicloSeleccionado.value.sede_id ?? cicloSeleccionado.value.sede?.id
    return (sedes.value ?? []).find(s => s.id === sedeId) ?? null
  })

  // ── Computed: catálogos como arrays de opciones ──────────────────────────────

  const catalogOpts = computed(() => ({
    tiposIdentificacion: objectToOptions(catalogs.tipos_identificacion),
    generos:             objectToOptions(catalogs.generos),
    estadosCiviles:      objectToOptions(catalogs.estados_civiles),
    gruposSanguineos:    objectToOptions(catalogs.grupos_sanguineos),
    rhs:                 objectToOptions(catalogs.rhs),
    nivelesEducacion:    objectToOptions(catalogs.niveles_educacion),
    regimenesSalud:      objectToOptions(catalogs.regimenes_salud)
  }))

  const departamentosOpciones = computed(() => {
    const provincias = [...new Set(
      catalogs.poblaciones.map(p => p.provincia).filter(Boolean)
    )].sort()
    return provincias.map(p => ({ value: p, label: p }))
  })

  const ciudadesExpedicionOpciones = computed(() => {
    const lista = datosPersonales.departamento_expedicion
      ? catalogs.poblaciones.filter(p => p.provincia === datosPersonales.departamento_expedicion)
      : catalogs.poblaciones
    return lista.map(p => ({ value: p.nombre, label: p.nombre }))
  })

  const lugarOrigenOpciones = computed(() =>
    catalogs.poblaciones.map(p => ({
      value: String(p.id),       // string para que FormSelect compare correctamente
      label: `${p.nombre} (${p.provincia})`
    }))
  )

  // ── Computed: resumen / validación ──────────────────────────────────────────

  const tieneAlgunDatoPersonal = computed(() =>
    !!(datosPersonales.tipo_identificacion || datosPersonales.fecha_nacimiento ||
       datosPersonales.genero || datosPersonales.celular ||
       datosPersonales.nivel_educacion || datosPersonales.lugar_origen_id)
  )

  const estudianteResumen = computed(() => {
    if (estudianteEstado.value === 'found') {
      return {
        name:      estudianteEncontrado.value?.name,
        email:     estudianteEncontrado.value?.email,
        documento: estudianteEncontrado.value?.documento
      }
    }
    const partes = [
      estudianteForm.primer_nombre,
      estudianteForm.segundo_nombre,
      estudianteForm.primer_apellido,
      estudianteForm.segundo_apellido
    ].filter(Boolean)
    return {
      name:      partes.join(' ') || '—',
      email:     estudianteForm.email,
      documento: estudianteForm.documento
    }
  })

  const fechaInicioError = computed(() =>
    detalles.fecha_inicio && detalles.fecha_inicio < detalles.fecha_matricula
      ? 'Debe ser igual o posterior a la fecha de matrícula.'
      : ''
  )

  // ── Validación por paso ───────────────────────────────────────────────────────

  const canProceed = computed(() => {
    switch (currentStep.value) {
      case 1: return !!cursoId.value && !!cicloId.value
      case 2:
        if (estudianteEstado.value === 'found') return true
        if (estudianteEstado.value === 'not_found') {
          return (
            !!estudianteForm.primer_nombre &&
            !!estudianteForm.primer_apellido &&
            !!estudianteForm.email &&
            !!estudianteForm.documento &&
            !!estudianteForm.password &&
            estudianteForm.password === estudianteForm.password_confirmation
          )
        }
        return false
      case 3: return true
      case 4:
        return (
          !!detalles.comercial_id &&
          !!detalles.matriculado_por_id &&
          !!detalles.fecha_matricula &&
          !!detalles.fecha_inicio &&
          detalles.monto !== '' && detalles.monto !== null &&
          !fechaInicioError.value
        )
      default: return true
    }
  })

  // ── Estilos del stepper ───────────────────────────────────────────────────────

  const stepCircleClass = (step) => {
    if (currentStep.value > step)   return 'bg-blue-600 text-white'
    if (currentStep.value === step) return 'bg-blue-600 text-white ring-4 ring-blue-100'
    return 'bg-slate-100 text-slate-400'
  }

  const stepLabelClass = (step) => {
    if (currentStep.value === step) return 'text-blue-700'
    if (currentStep.value > step)   return 'text-slate-500'
    return 'text-slate-400'
  }

  const canGoToStep = (step) => step < currentStep.value
  const goToStep    = (step) => { if (canGoToStep(step)) currentStep.value = step }

  // ── Navegación ────────────────────────────────────────────────────────────────

  async function nextStep() {
    if (!canProceed.value) return
    apiError.value    = ''
    fieldErrors.value = {}
    currentStep.value++
    if (currentStep.value === 4) await loadPrecio()
  }

  // ── Paso 1: ciclos ────────────────────────────────────────────────────────────

  async function onCursoChange() {
    cicloId.value              = ''
    cicloSeleccionado.value    = null
    ciclosDisponibles.value    = []
    precioConsultado.value     = null
    sinPrecioConfigurado.value = false
    if (cursoId.value) await loadCiclos()
  }

  async function onCicloChange(val) {
    const ciclo = ciclosDisponibles.value.find(c => String(c.id) === String(val)) ?? null
    cicloSeleccionado.value = ciclo

    if (ciclo?.fecha_inicio) {
      const fechaCiclo = ciclo.fecha_inicio.slice(0, 10)
      detalles.fecha_inicio = fechaCiclo >= detalles.fecha_matricula
        ? fechaCiclo
        : detalles.fecha_matricula
    }
  }

  async function loadCiclos() {
    if (!cursoId.value) return
    ciclosLoading.value = true
    try {
      const res = await cicloService.getAll({
        curso_id: cursoId.value, status: 1, with: 'sede,curso',
        sort_by: 'nombre', sort_direction: 'asc', per_page: 100
      })
      ciclosDisponibles.value = res.data ?? []
    } catch {
      ciclosDisponibles.value = []
    } finally {
      ciclosLoading.value = false
    }
  }

  // ── Paso 2: búsqueda de estudiante ───────────────────────────────────────────

  async function buscarEstudiante() {
    const doc = documentoBusqueda.value.trim()
    if (!doc) return

    estudianteBuscando.value   = true
    estudianteEstado.value     = 'idle'
    estudianteEncontrado.value = null
    apiError.value             = ''
    fieldErrors.value          = {}

    try {
      const res = await userService.getAll(
        { search: doc, per_page: 20, with: 'roles,sedes' },
        { _silent: true }
      )
      const encontrado = (res.data ?? []).find(u => u.documento === doc) ?? null

      if (encontrado) {
        estudianteEncontrado.value         = encontrado
        estudianteEstado.value             = 'found'
        actualizarEstudiante.value         = false
        estudianteForm.primer_nombre       = encontrado.primer_nombre    ?? ''
        estudianteForm.segundo_nombre      = encontrado.segundo_nombre   ?? ''
        estudianteForm.primer_apellido     = encontrado.primer_apellido  ?? ''
        estudianteForm.segundo_apellido    = encontrado.segundo_apellido ?? ''
        estudianteForm.email               = encontrado.email            ?? ''
        estudianteForm.documento           = encontrado.documento        ?? doc
      } else {
        _setNuevoEstudianteDefaults(doc)
      }
    } catch {
      _setNuevoEstudianteDefaults(doc)
    } finally {
      estudianteBuscando.value = false
    }
  }

  function _setNuevoEstudianteDefaults(doc) {
    estudianteEstado.value               = 'not_found'
    estudianteForm.primer_nombre         = ''
    estudianteForm.segundo_nombre        = ''
    estudianteForm.primer_apellido       = ''
    estudianteForm.segundo_apellido      = ''
    estudianteForm.email                 = ''
    estudianteForm.documento             = doc
    estudianteForm.password              = doc
    estudianteForm.password_confirmation = doc
  }

  function resetEstudianteBusqueda() {
    documentoBusqueda.value    = ''
    estudianteEstado.value     = 'idle'
    estudianteEncontrado.value = null
    actualizarEstudiante.value = false
    Object.assign(estudianteForm, {
      primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
      email: '', documento: '', password: '', password_confirmation: ''
    })
  }

  // ── Paso 3: catálogos ─────────────────────────────────────────────────────────

  async function loadCatalogs() {
    catalogsLoading.value = true
    catalogsError.value   = false
    try {
      const res  = await matriculaService.getFilters()
      const data = res.data ?? {}
      catalogs.tipos_identificacion = data.tipos_identificacion ?? {}
      catalogs.generos              = data.generos              ?? {}
      catalogs.estados_civiles      = data.estados_civiles      ?? {}
      catalogs.grupos_sanguineos    = data.grupos_sanguineos    ?? {}
      catalogs.rhs                  = data.rhs                  ?? {}
      catalogs.niveles_educacion    = data.niveles_educacion    ?? {}
      catalogs.regimenes_salud      = data.regimenes_salud      ?? {}
      catalogs.poblaciones          = data.poblaciones          ?? []
    } catch {
      catalogsError.value = true
    } finally {
      catalogsLoading.value = false
    }
  }

  // ── Paso 4: consulta de precio ────────────────────────────────────────────────

  async function loadPrecio() {
    precioConsultado.value     = null
    sinPrecioConfigurado.value = false

    const sede        = sedeDelCiclo.value
    const poblacionId = sede?.poblacion?.id ?? sede?.poblacion_id

    if (!cursoId.value || !poblacionId) {
      sinPrecioConfigurado.value = true
      return
    }

    precioLoading.value = true
    try {
      const prodRes = await productoLpService.getAll(
        { referencia_tipo: 'curso', referencia_id: cursoId.value, status: 1, with: 'tipoProducto' },
        { _silent: true }
      )
      const productos = prodRes.data ?? (Array.isArray(prodRes) ? prodRes : [])
      const producto  = productos[0] ?? null

      if (!producto) { sinPrecioConfigurado.value = true; return }

      const precioRes        = await precioProductoService.obtenerPrecio({
        producto_id: producto.id, poblacion_id: poblacionId
      })
      precioConsultado.value = precioRes.data
      applyFormaPago()
    } catch {
      sinPrecioConfigurado.value = true
    } finally {
      precioLoading.value = false
    }
  }

  function applyFormaPago() {
    if (!precioConsultado.value) return
    if (formaPago.value === 'contado') {
      detalles.monto       = precioConsultado.value.precio_contado
      detalles.valor_cuota = ''
    } else {
      detalles.monto       = precioConsultado.value.matricula ?? precioConsultado.value.precio_contado
      detalles.valor_cuota = precioConsultado.value.valor_cuota ?? ''
    }
  }

  watch(formaPago, applyFormaPago)

  // ── Submit ────────────────────────────────────────────────────────────────────

  /**
   * Ejecuta el flujo completo: crea/actualiza el estudiante y registra la matrícula.
   * @param {Function} onSuccess - callback invocado tras guardar correctamente.
   */
  async function submit(onSuccess) {
    saving.value      = true
    apiError.value    = ''
    fieldErrors.value = {}

    const estudianteId = await _resolveEstudiante()
    if (!estudianteId) { saving.value = false; return }

    try {
      const matricula = await matriculaService.create(_buildPayload(estudianteId))
      onSuccess?.(matricula)
    } catch (e) {
      _handleApiError(e)
    } finally {
      saving.value = false
    }
  }

  async function _resolveEstudiante() {
    if (estudianteEstado.value === 'not_found') {
      return await _crearEstudiante()
    }
    if (estudianteEstado.value === 'found' && actualizarEstudiante.value) {
      await _actualizarEstudiante()
    }
    return estudianteEncontrado.value?.id ?? null
  }

  async function _crearEstudiante() {
    const sedeId = cicloSeleccionado.value?.sede_id ?? cicloSeleccionado.value?.sede?.id
    const payload = {
      primer_nombre:         estudianteForm.primer_nombre,
      primer_apellido:       estudianteForm.primer_apellido,
      email:                 estudianteForm.email,
      documento:             estudianteForm.documento,
      password:              estudianteForm.password,
      password_confirmation: estudianteForm.password_confirmation,
      roles:                 ['alumno'],
      ...(estudianteForm.segundo_nombre   ? { segundo_nombre:   estudianteForm.segundo_nombre   } : {}),
      ...(estudianteForm.segundo_apellido ? { segundo_apellido: estudianteForm.segundo_apellido } : {}),
      ...(sedeId ? { sedes: [sedeId] } : {})
    }
    try {
      const res = await userService.create(payload, { _silent: true })
      return res.data?.id ?? res?.id ?? null
    } catch (e) {
      _handleApiError(e, 2)
      return null
    }
  }

  async function _actualizarEstudiante() {
    const payload = {
      primer_nombre:   estudianteForm.primer_nombre,
      primer_apellido: estudianteForm.primer_apellido,
      email:           estudianteForm.email,
      ...(estudianteForm.segundo_nombre   ? { segundo_nombre:   estudianteForm.segundo_nombre   } : {}),
      ...(estudianteForm.segundo_apellido ? { segundo_apellido: estudianteForm.segundo_apellido } : {})
    }
    try {
      await userService.update(estudianteEncontrado.value.id, payload, { _silent: true })
    } catch (e) {
      _handleApiError(e, 2)
    }
  }

  /**
   * Construye el payload para POST /api/academico/matriculas.
   * - Campos obligatorios: siempre presentes y convertidos al tipo correcto.
   * - Booleanos: siempre presentes (nunca nullable).
   * - Campos opcionales: se incluyen solo cuando tienen valor; se omiten si están vacíos.
   */
  function _buildPayload(estudianteId) {
    /** Incluye un campo de texto/fecha solo si tiene valor. */
    const str = (v) => (v !== '' && v !== null && v !== undefined) ? String(v)  : undefined
    /** Incluye un campo numérico solo si tiene valor; convierte string→número. */
    const num = (v) => (v !== '' && v !== null && v !== undefined) ? Number(v)  : undefined

    const payload = {
      // ── Obligatorios ──────────────────────────────────────────────────────
      curso_id:           Number(cursoId.value),
      ciclo_id:           Number(cicloId.value),
      estudiante_id:      Number(estudianteId),
      matriculado_por_id: Number(detalles.matriculado_por_id),
      comercial_id:       Number(detalles.comercial_id),
      fecha_matricula:    detalles.fecha_matricula,
      fecha_inicio:       detalles.fecha_inicio,
      monto:              Number(detalles.monto),
      status:             Number(detalles.status),

      // ── Booleanos (siempre presentes; backend usa cast booleano) ──────────
      enfermedad_prioritaria: Boolean(datosPersonales.enfermedad_prioritaria),
      discapacidad:           Boolean(datosPersonales.discapacidad),
      conocimiento_curso:     Boolean(detalles.conocimiento_curso),
      aprueba_uso_imagen:     Boolean(detalles.aprueba_uso_imagen),

      // ── Detalles de matrícula (opcionales) ────────────────────────────────
      valor_cuota:       num(detalles.valor_cuota),
      observaciones:     str(detalles.observaciones),
      como_entero_curso: str(detalles.como_entero_curso),
      talla_overol:      str(detalles.talla_overol),
      talla_botas:       str(detalles.talla_botas),
      multiculturalidad: str(detalles.multiculturalidad),

      // ── Contacto de emergencia (opcionales) ───────────────────────────────
      nombre_contacto:   str(detalles.nombre_contacto),
      telefono_contacto: str(detalles.telefono_contacto),
      correo_contacto:   str(detalles.correo_contacto),

      // ── Identificación (opcionales) ───────────────────────────────────────
      tipo_identificacion:     str(datosPersonales.tipo_identificacion),
      departamento_expedicion: str(datosPersonales.departamento_expedicion),
      ciudad_expedicion:       str(datosPersonales.ciudad_expedicion),

      // ── Datos demográficos (opcionales) ───────────────────────────────────
      fecha_nacimiento: str(datosPersonales.fecha_nacimiento),
      genero:           str(datosPersonales.genero),
      estado_civil:     str(datosPersonales.estado_civil),
      grupo_sanguineo:  str(datosPersonales.grupo_sanguineo),
      rh:               str(datosPersonales.rh),

      // ── Contacto y ubicación (opcionales) ─────────────────────────────────
      direccion:       str(datosPersonales.direccion),
      lugar_origen_id: num(datosPersonales.lugar_origen_id),
      celular:         str(datosPersonales.celular),
      telefono:        str(datosPersonales.telefono),

      // ── Datos socioeconómicos (opcionales) ────────────────────────────────
      nivel_educacion: str(datosPersonales.nivel_educacion),
      ocupacion:       str(datosPersonales.ocupacion),
      empresa:         str(datosPersonales.empresa),
      estrato:         num(datosPersonales.estrato),
      regimen_salud:   str(datosPersonales.regimen_salud)
    }

    // Elimina los campos opcionales que son undefined (no enviados al backend)
    return _omitUndefined(payload)
  }

  /**
   * Maneja errores de API. Si es 422, extrae errores por campo y navega
   * automáticamente al paso que contiene el primer campo con error.
   */
  function _handleApiError(e, forceStep = null) {
    if (e?.response?.status === 422) {
      const errors = e.response.data?.errors ?? {}
      fieldErrors.value = errors
      apiError.value    = e.response.data?.message ?? 'Revisa los datos ingresados.'

      if (!forceStep) {
        const primerCampoError = Object.keys(errors)[0]
        const pasoError = FIELD_STEP_MAP[primerCampoError]
        if (pasoError) currentStep.value = pasoError
      }
    } else {
      apiError.value = e?.response?.data?.message ?? 'Error al procesar la solicitud.'
    }
    if (forceStep) currentStep.value = forceStep
  }

  // ── Inicialización y reset ─────────────────────────────────────────────────

  async function init() {
    reset()
    await Promise.allSettled([loadCurrentUser(), loadCatalogs()])
  }

  async function loadCurrentUser() {
    try {
      const user = await authService.getUser()
      if (user?.id) detalles.matriculado_por_id = String(user.id)
    } catch { /* silencioso: el usuario puede seleccionarlo manualmente */ }
  }

  function reset() {
    currentStep.value  = 1
    saving.value       = false
    apiError.value     = ''
    fieldErrors.value  = {}

    cursoId.value           = ''
    cicloId.value           = ''
    ciclosDisponibles.value = []
    cicloSeleccionado.value = null

    resetEstudianteBusqueda()   // también limpia estudianteForm con los 4 campos

    Object.assign(datosPersonales, {
      tipo_identificacion: '', departamento_expedicion: '', ciudad_expedicion: '',
      fecha_nacimiento: '', genero: '', estado_civil: '', grupo_sanguineo: '', rh: '',
      direccion: '', lugar_origen_id: '', celular: '', telefono: '',
      nivel_educacion: '', ocupacion: '', empresa: '', estrato: '', regimen_salud: '',
      enfermedad_prioritaria: false, discapacidad: false
    })

    Object.assign(detalles, {
      comercial_id: '', matriculado_por_id: '', status: '1',
      fecha_matricula: today(), fecha_inicio: '',
      monto: '', valor_cuota: '', observaciones: '',
      conocimiento_curso: false, como_entero_curso: '',
      talla_overol: '', talla_botas: '',
      nombre_contacto: '', telefono_contacto: '', correo_contacto: '',
      aprueba_uso_imagen: false, multiculturalidad: ''
    })

    formaPago.value            = 'contado'
    precioConsultado.value     = null
    precioLoading.value        = false
    sinPrecioConfigurado.value = false
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return {
    // Constantes
    WIZARD_STEPS,

    // Navegación
    currentStep, saving, apiError, fieldErrors,
    canProceed, canGoToStep, goToStep, nextStep,
    stepCircleClass, stepLabelClass,

    // Paso 1
    cursoId, cicloId, ciclosDisponibles, ciclosLoading, cicloSeleccionado,
    cursosOpciones, cursosMap, ciclosOpciones,
    onCursoChange, onCicloChange,

    // Paso 2
    documentoBusqueda, estudianteBuscando, estudianteEstado,
    estudianteEncontrado, actualizarEstudiante, estudianteForm,
    buscarEstudiante, resetEstudianteBusqueda, estudianteResumen,

    // Paso 3
    catalogs, datosPersonales, catalogsLoading, catalogsError,
    catalogOpts, departamentosOpciones, ciudadesExpedicionOpciones, lugarOrigenOpciones,

    // Paso 4
    detalles, formaPago, precioConsultado, precioLoading, sinPrecioConfigurado,
    comercialesOpciones, comercialesMap, sedeDelCiclo,
    applyFormaPago, fechaInicioError,

    // Paso 5
    tieneAlgunDatoPersonal,

    // Acciones
    submit, init,

    // Utilidades
    formatDate, formatCOP
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper privado del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Retorna una copia del objeto sin las claves cuyo valor es undefined. */
function _omitUndefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  )
}
