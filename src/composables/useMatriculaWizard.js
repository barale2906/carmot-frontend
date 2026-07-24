/**
 * useMatriculaWizard
 *
 * Composable que encapsula el estado, la validación y las operaciones asíncronas
 * del wizard de creación de matrículas. El componente UI se mantiene como capa
 * de presentación pura.
 *
 * @param {{ cursos: ComputedRef, sedes: ComputedRef, comerciales: ComputedRef }} refs
 */
import { ref, reactive, computed } from 'vue'

import cicloService          from '@/services/cicloService.js'
import userService           from '@/services/userService.js'
import matriculaService      from '@/services/matriculaService.js'
import precioProductoService from '@/services/precioProductoService.js'
import poblacionService      from '@/services/poblacionService.js'
import epsService            from '@/services/epsService.js'
import { nombreCompleto }    from '@/utils/formatters.js'
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

/** Trae todas las páginas de poblaciones activas (usado para el selector de "lugar de origen"). */
export async function fetchAllPoblaciones() {
  const perPage = 200
  let page      = 1
  let lastPage  = 1
  const acc     = []
  do {
    const res = await poblacionService.getAll({
      status:         1,
      sort_by:        'nombre',
      sort_direction: 'asc',
      per_page:       perPage,
      page
    })
    acc.push(...(res.data ?? []))
    lastPage = res.meta?.last_page ?? 1
    page += 1
  } while (page <= lastPage)
  return acc
}

/**
 * Construye el mismo snapshot que `buildPrintData()` (ver más abajo, dentro del
 * composable) pero a partir de un registro de matrícula ya guardado — usado para
 * reimprimir la hoja desde el listado, donde no hay estado de wizard disponible.
 *
 * @param {Object} record   Matrícula con relaciones: curso, ciclo (idealmente con ciclo.sede
 *                          ya resuelto a mano, ver MatriculaView.vue), estudiante, matriculado_por.
 * @param {Object} lookups  { catalogs, poblaciones } — mismos catálogos que usa el wizard.
 */
export function buildPrintDataFromRecord(record, { catalogs = {}, poblaciones = [] } = {}) {
  const estudiante = record.estudiante ?? {}
  const poblacion  = poblaciones.find(p => String(p.id) === String(record.lugar_origen_id))

  const nombres = estudiante.primer_nombre
    ? [estudiante.primer_nombre, estudiante.segundo_nombre].filter(Boolean).join(' ')
    : (estudiante.name ?? '')
  const apellidos = estudiante.primer_apellido
    ? [estudiante.primer_apellido, estudiante.segundo_apellido].filter(Boolean).join(' ')
    : ''

  const anio = (record.fecha_matricula || today()).slice(0, 4)

  return {
    matriculaId:  record.id ?? null,
    estudianteId: record.estudiante_id ?? null,
    codigo:       record.id ? `MAT-${anio}-${String(record.id).padStart(3, '0')}` : '',
    fecha:        record.fecha_matricula,
    sede:         record.ciclo?.sede?.nombre ?? record.sede?.nombre ?? '',
    curso:        record.curso?.nombre ?? '',
    ciclo:       record.ciclo?.nombre ?? '',

    personal: {
      nombres,
      apellidos,
      // El backend ya entrega etiquetas legibles (`*_texto`) para varios campos;
      // se usan de primeras y se cae a los catálogos solo si no vienen.
      tipoIdentificacion: record.tipo_identificacion_texto ?? catalogs.tipos_identificacion?.[record.tipo_identificacion] ?? '',
      documento:          estudiante.documento ?? '',
      expedicion:         [record.departamento_expedicion, record.ciudad_expedicion].filter(Boolean).join(', '),
      fechaNacimiento:    record.fecha_nacimiento,
      lugarOrigen:        record.lugar_origen?.nombre ?? (poblacion ? `${poblacion.nombre} (${poblacion.provincia})` : ''),
      genero:             record.genero_texto ?? catalogs.generos?.[record.genero] ?? '',
      estadoCivil:        record.estado_civil_texto ?? catalogs.estados_civiles?.[record.estado_civil] ?? '',
      tipoSangre:         [
        catalogs.grupos_sanguineos?.[record.grupo_sanguineo] ?? record.grupo_sanguineo,
        record.rh_texto ?? catalogs.rhs?.[record.rh]
      ].filter(Boolean).join(' ')
    },

    contacto: {
      direccion: record.direccion,
      telefono:  record.telefono,
      celular:   record.celular,
      email:     estudiante.email ?? ''
    },

    academico: {
      nivelEducacion: record.nivel_educacion_texto ?? catalogs.niveles_educacion?.[record.nivel_educacion] ?? '',
      ocupacion:      record.ocupacion,
      empresa:        record.empresa,
      estrato:        record.estrato,
      regimenSalud:   record.regimen_salud_texto ?? catalogs.regimenes_salud?.[record.regimen_salud] ?? '',
      eps:            record.eps?.nombre ?? ''
    },

    medica: {
      enfermedadPrioritaria: Boolean(record.enfermedad_prioritaria),
      discapacidad:          Boolean(record.discapacidad)
    },

    detalleCurso: {
      fechaInicio: record.fecha_inicio,
      monto:       record.monto,
      tallaOverol: record.talla_overol,
      tallaBotas:  record.talla_botas
    },

    emergencia: {
      nombre:   record.nombre_contacto,
      telefono: record.telefono_contacto,
      correo:   record.correo_contacto
    },

    apruebaUsoImagen:  Boolean(record.aprueba_uso_imagen),
    observaciones:     record.observaciones,
    multiculturalidad: record.multiculturalidad,
    // La foto se guarda en el registro de la matrícula, no en el usuario.
    fotoUrl:           record.foto_url || record.foto || estudiante.foto_url || estudiante.foto || null,
    registradoPor:     record.matriculado_por?.name ?? ''
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

export const WIZARD_STEPS = [
  { key: 'programacion', label: 'Programación' },
  { key: 'precio',       label: 'Precio'       },
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
  // Paso 4 — datos personales
  tipo_identificacion: 4, departamento_expedicion: 4, ciudad_expedicion: 4,
  fecha_nacimiento: 4, genero: 4, estado_civil: 4, grupo_sanguineo: 4, rh: 4,
  direccion: 4, lugar_origen_id: 4, celular: 4, telefono: 4,
  nivel_educacion: 4, ocupacion: 4, empresa: 4, estrato: 4, regimen_salud: 4, eps_id: 4,
  enfermedad_prioritaria: 4, discapacidad: 4, foto: 4,
  // Paso 3 — estudiante (matrícula duplicada detectada por el backend)
  estudiante_id: 3,
  // Paso 5 — detalles de matrícula
  comercial_id: 5, matriculado_por_id: 5, fecha_matricula: 5, fecha_inicio: 5,
  monto: 5, valor_cuota: 5, status: 5, observaciones: 5,
  como_entero_curso: 5, talla_overol: 5, talla_botas: 5, multiculturalidad: 5,
  nombre_contacto: 5, telefono_contacto: 5, correo_contacto: 5,
  conocimiento_curso: 5, aprueba_uso_imagen: 5
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

  // ── Paso 1: Programación — sede → curso → ciclo ─────────────────────────────
  const sedeId              = ref('')
  const cursosEnSede        = ref([])   // cursos con ciclos activos en la sede elegida
  const cursosEnSedeLoading = ref(false)
  const cursoId             = ref('')
  const cicloId             = ref('')
  const ciclosDisponibles   = ref([])
  const ciclosLoading       = ref(false)
  const cicloSeleccionado   = ref(null)

  // ── Paso 2: Precio ──────────────────────────────────────────────────────────
  const preciosDisponibles  = ref([])   // array de opciones devuelto por el endpoint
  const precioSeleccionado  = ref(null) // opción elegida por el usuario
  const precioLoading       = ref(false)
  const sinPrecioConfigurado = ref(false)

  // ── Paso 3: Estudiante ──────────────────────────────────────────────────────
  const documentoBusqueda       = ref('')
  const estudianteBuscando      = ref(false)
  const estudianteEstado        = ref('idle')   // 'idle' | 'found' | 'not_found'
  const resultadosBusqueda      = ref([])
  let   _busquedaTimer          = null
  const estudianteEncontrado    = ref(null)
  const actualizarEstudiante    = ref(false)
  const matriculasExistentes = ref([])
  const verificandoMatricula = ref(false)
  /** ID de la matrícula de referencia desde la que se precargaron los datos (solo informativo). */
  const matriculaReferenciaId = ref(null)
  /** Valor crudo de `foto` devuelto por la precarga: indica que el estudiante ya tiene una foto registrada. */
  const fotoExistente = ref(null)
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

  // ── Paso 4: Datos personales + catálogos ────────────────────────────────────
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
    poblaciones:          [],
    eps:                  []
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
    eps_id:                  '',
    enfermedad_prioritaria:  false,
    discapacidad:            false,
    foto:                    null
  })

  // ── Paso 5: Detalles de matrícula ───────────────────────────────────────────
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

  // ── Computed: selectores ────────────────────────────────────────────────────

  const sedesOpciones = computed(() =>
    (sedes.value ?? []).map(s => ({ value: String(s.id), label: s.nombre }))
  )

  /**
   * Cuando hay sede elegida, muestra solo los cursos con ciclos activos en esa sede.
   * Si aún no hay sede, cae a la lista completa del prop para no bloquear al usuario.
   */
  const cursosOpciones = computed(() => {
    const lista = sedeId.value ? cursosEnSede.value : (cursos.value ?? [])
    return lista.map(c => ({ value: String(c.id), label: c.nombre }))
  })

  const cursosMap = computed(() => {
    const m = {}
    ;(cursos.value ?? []).forEach(c => { m[String(c.id)] = c.nombre })
    cursosEnSede.value.forEach(c => { m[String(c.id)] = c.nombre })
    return m
  })

  const ciclosOpciones = computed(() =>
    ciclosDisponibles.value.map(c => ({
      value: String(c.id),
      label: `${c.nombre}  (${formatDate(c.fecha_inicio)} – ${formatDate(c.fecha_fin)})`
    }))
  )

  const comercialesOpciones = computed(() =>
    (comerciales.value ?? []).map(u => ({ value: String(u.id), label: nombreCompleto(u) }))
  )

  const comercialesMap = computed(() => {
    const m = {}
    ;(comerciales.value ?? []).forEach(u => { m[String(u.id)] = nombreCompleto(u) })
    return m
  })

  const sedeDelCiclo = computed(() => {
    if (!cicloSeleccionado.value) return null
    const cicloSedeId = cicloSeleccionado.value.sede_id ?? cicloSeleccionado.value.sede?.id
    return (sedes.value ?? []).find(s => s.id === cicloSedeId) ?? null
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

  const epsOpciones = computed(() =>
    catalogs.eps.map(e => ({ value: String(e.id), label: e.nombre }))
  )

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
      case 1:
        return !!sedeId.value && !!cursoId.value && !!cicloId.value
      case 2:
        return !precioLoading.value && !!precioSeleccionado.value
      case 3:
        if (verificandoMatricula.value) return false
        if (estudianteEstado.value === 'found') return !yaMatriculadoEnCiclo.value
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
      case 4: return true
      case 5:
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
    if (currentStep.value === 2) await loadPrecio()
  }

  // ── Paso 1: sede → curso → ciclo ─────────────────────────────────────────────

  /**
   * Cuando cambia la sede: resetea curso, ciclo y precios, y carga los cursos
   * que tienen ciclos activos en esa sede para filtrar el selector.
   */
  async function onSedeChange() {
    cursoId.value              = ''
    cicloId.value              = ''
    cicloSeleccionado.value    = null
    ciclosDisponibles.value    = []
    cursosEnSede.value         = []
    preciosDisponibles.value   = []
    precioSeleccionado.value   = null
    sinPrecioConfigurado.value = false
    if (sedeId.value) await loadCursosEnSede()
  }

  /** Obtiene los cursos únicos con ciclos activos en la sede seleccionada. */
  async function loadCursosEnSede() {
    if (!sedeId.value) { cursosEnSede.value = []; return }
    cursosEnSedeLoading.value = true
    try {
      const res = await cicloService.getAll({
        sede_id:  sedeId.value,
        status:   1,
        with:     'curso',
        per_page: 200
      })
      const ciclos = res.data ?? []
      const map    = new Map()
      for (const c of ciclos) {
        if (c.curso?.id && !map.has(c.curso.id)) map.set(c.curso.id, c.curso)
      }
      cursosEnSede.value = [...map.values()].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es')
      )
    } catch {
      cursosEnSede.value = []
    } finally {
      cursosEnSedeLoading.value = false
    }
  }

  async function onCursoChange() {
    cicloId.value              = ''
    cicloSeleccionado.value    = null
    ciclosDisponibles.value    = []
    preciosDisponibles.value   = []
    precioSeleccionado.value   = null
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

    // Si ya hay un estudiante encontrado, la verificación de duplicado depende
    // del ciclo (curso + ciclo), así que debe repetirse al cambiarlo.
    if (estudianteEstado.value === 'found' && estudianteEncontrado.value) {
      await _verificarMatriculaExistente(estudianteEncontrado.value.id)
    }
  }

  async function loadCiclos() {
    if (!cursoId.value) return
    ciclosLoading.value = true
    try {
      const params = {
        curso_id:       cursoId.value,
        status:         1,
        // 'sede.poblacion' provee el poblacion_id necesario para consultar el precio
        with:           'sede,sede.poblacion,curso',
        sort_by:        'nombre',
        sort_direction: 'asc',
        per_page:       100
      }
      if (sedeId.value) params.sede_id = sedeId.value
      const res = await cicloService.getAll(params)
      ciclosDisponibles.value = res.data ?? []
    } catch {
      ciclosDisponibles.value = []
    } finally {
      ciclosLoading.value = false
    }
  }

  // ── Paso 3: búsqueda de estudiante ───────────────────────────────────────────

  /** Dispara la búsqueda con debounce mientras el usuario escribe. */
  function buscarEstudianteDebounced() {
    clearTimeout(_busquedaTimer)
    const q = documentoBusqueda.value.trim()
    if (q.length < 2) {
      resultadosBusqueda.value = []
      return
    }
    _busquedaTimer = setTimeout(buscarEstudiante, 350)
  }

  /** Ejecuta la búsqueda inmediatamente (Enter o botón). */
  async function buscarEstudiante() {
    const q = documentoBusqueda.value.trim()
    if (!q) return

    clearTimeout(_busquedaTimer)
    estudianteBuscando.value   = true
    resultadosBusqueda.value   = []
    apiError.value             = ''
    fieldErrors.value          = {}

    try {
      const res = await userService.getAll(
        { search: q, per_page: 10, with: 'roles' },
        { _silent: true }
      )
      resultadosBusqueda.value = res.data ?? []
    } catch {
      resultadosBusqueda.value = []
    } finally {
      estudianteBuscando.value = false
    }
  }

  /** Selecciona un candidato del listado de resultados y carga sus datos. */
  async function seleccionarCandidato(est) {
    resultadosBusqueda.value           = []
    estudianteEncontrado.value         = est
    estudianteEstado.value             = 'found'
    actualizarEstudiante.value         = false
    estudianteForm.primer_nombre       = est.primer_nombre    ?? ''
    estudianteForm.segundo_nombre      = est.segundo_nombre   ?? ''
    estudianteForm.primer_apellido     = est.primer_apellido  ?? ''
    estudianteForm.segundo_apellido    = est.segundo_apellido ?? ''
    estudianteForm.email               = est.email            ?? ''
    estudianteForm.documento           = est.documento        ?? ''
    apiError.value                     = ''
    fieldErrors.value                  = {}
    _resetDatosPrecargados()
    await Promise.allSettled([
      _verificarMatriculaExistente(est.id),
      _precargarDatosEstudiante(est.id)
    ])
  }

  /** Inicia el flujo de nuevo estudiante usando el texto escrito como documento. */
  function registrarNuevoEstudiante() {
    resultadosBusqueda.value = []
    _setNuevoEstudianteDefaults(documentoBusqueda.value.trim())
  }

  /** Oculta el dropdown de resultados (usado en blur del input con delay). */
  function ocultarResultados() {
    resultadosBusqueda.value = []
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

  /**
   * Verifica si el estudiante ya tiene una matrícula activa en la combinación
   * curso + ciclo seleccionada. La regla de negocio del backend valida esa
   * combinación exacta (no solo el curso): un estudiante puede matricularse en
   * el mismo curso si es un ciclo distinto.
   */
  async function _verificarMatriculaExistente(estudianteId) {
    if (!estudianteId || !cursoId.value || !cicloId.value) return
    verificandoMatricula.value = true
    matriculasExistentes.value = []
    try {
      const res = await matriculaService.getAll({
        estudiante_id: estudianteId,
        curso_id:      cursoId.value,
        ciclo_id:      cicloId.value,
        status:        1,
        with:          'ciclo,ciclo.sede',
        per_page:      10
      })
      matriculasExistentes.value = res.data ?? []
    } catch {
      matriculasExistentes.value = []
    } finally {
      verificandoMatricula.value = false
    }
  }

  /** Precarga los datos personales y de inscripción del estudiante desde su matrícula
   *  más reciente (ver GUIA_FRONTEND_PRECARGA_MATRICULA.md). 404 = sin matrículas
   *  previas → se ignora silenciosamente y el formulario continúa en blanco. */
  async function _precargarDatosEstudiante(estudianteId) {
    try {
      const res = await matriculaService.precargaEstudiante(estudianteId)
      const d   = res.data ?? res

      matriculaReferenciaId.value = d.matricula_referencia_id ?? null
      fotoExistente.value         = d.foto ?? null

      Object.assign(datosPersonales, {
        tipo_identificacion:     d.tipo_identificacion     ?? '',
        departamento_expedicion: d.departamento_expedicion ?? '',
        ciudad_expedicion:       d.ciudad_expedicion       ?? '',
        fecha_nacimiento:        d.fecha_nacimiento        ?? '',
        genero:                  d.genero                  ?? '',
        estado_civil:            d.estado_civil            ?? '',
        grupo_sanguineo:         d.grupo_sanguineo         ?? '',
        rh:                      d.rh                      ?? '',
        direccion:               d.direccion               ?? '',
        lugar_origen_id:         d.lugar_origen_id
          ? String(d.lugar_origen_id)
          : (d.lugar_origen?.id ? String(d.lugar_origen.id) : ''),
        celular:                 d.celular                 ?? '',
        telefono:                d.telefono                ?? '',
        nivel_educacion:         d.nivel_educacion         ?? '',
        ocupacion:               d.ocupacion               ?? '',
        empresa:                 d.empresa                 ?? '',
        estrato:                 d.estrato                 ?? '',
        regimen_salud:           d.regimen_salud           ?? '',
        eps_id:                  d.eps_id ? String(d.eps_id) : '',
        enfermedad_prioritaria:  Boolean(d.enfermedad_prioritaria),
        discapacidad:            Boolean(d.discapacidad)
      })

      // Campos del paso 5 (detalles de inscripción) que también entrega la precarga.
      Object.assign(detalles, {
        conocimiento_curso: Boolean(d.conocimiento_curso),
        como_entero_curso:  d.como_entero_curso  ?? '',
        talla_overol:       d.talla_overol       ?? '',
        talla_botas:        d.talla_botas        ?? '',
        nombre_contacto:    d.nombre_contacto    ?? '',
        telefono_contacto:  d.telefono_contacto  ?? '',
        correo_contacto:    d.correo_contacto    ?? '',
        aprueba_uso_imagen: Boolean(d.aprueba_uso_imagen),
        multiculturalidad:  d.multiculturalidad  ?? ''
      })
    } catch { /* 404 u otro error: el estudiante no tiene matrículas previas */ }
  }

  const yaMatriculadoEnCiclo = computed(() => matriculasExistentes.value.some(m => m.status === 1))

  function resetEstudianteBusqueda() {
    clearTimeout(_busquedaTimer)
    documentoBusqueda.value    = ''
    resultadosBusqueda.value   = []
    estudianteEstado.value     = 'idle'
    estudianteEncontrado.value = null
    actualizarEstudiante.value = false
    matriculasExistentes.value = []
    verificandoMatricula.value = false
    Object.assign(estudianteForm, {
      primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
      email: '', documento: '', password: '', password_confirmation: ''
    })
    _resetDatosPrecargados()
  }

  /** Limpia los datos personales y de inscripción que pudo haber dejado la precarga de un estudiante anterior. */
  function _resetDatosPrecargados() {
    Object.assign(datosPersonales, _defaultDatosPersonales())
    Object.assign(detalles, _defaultDetallesPrecarga())
    matriculaReferenciaId.value = null
    fotoExistente.value         = null
  }

  // ── Paso 4: catálogos ─────────────────────────────────────────────────────────

  async function loadCatalogs() {
    catalogsLoading.value = true
    catalogsError.value   = false
    try {
      const [filtersRes, pobRes, epsRes] = await Promise.allSettled([
        matriculaService.getFilters(),
        fetchAllPoblaciones(),
        epsService.getActivas()
      ])

      if (filtersRes.status === 'fulfilled') {
        const data = filtersRes.value?.data ?? {}
        catalogs.tipos_identificacion = data.tipos_identificacion ?? {}
        catalogs.generos              = data.generos              ?? {}
        catalogs.estados_civiles      = data.estados_civiles      ?? {}
        catalogs.grupos_sanguineos    = data.grupos_sanguineos    ?? {}
        catalogs.rhs                  = data.rhs                  ?? {}
        catalogs.niveles_educacion    = data.niveles_educacion    ?? {}
        catalogs.regimenes_salud      = data.regimenes_salud      ?? {}
      } else {
        throw filtersRes.reason
      }

      if (pobRes.status === 'fulfilled') {
        catalogs.poblaciones = pobRes.value
      }

      if (epsRes.status === 'fulfilled') {
        catalogs.eps = epsRes.value?.data ?? []
      }
    } catch {
      catalogsError.value = true
    } finally {
      catalogsLoading.value = false
    }
  }

  // ── Paso 2: consulta de precios ───────────────────────────────────────────────

  async function loadPrecio() {
    preciosDisponibles.value   = []
    precioSeleccionado.value   = null
    sinPrecioConfigurado.value = false

    /**
     * Resolución del poblacion_id con múltiples fuentes:
     * 1. Sede del prop `sedes` (puede tener poblacion.id o poblacion_id)
     * 2. Sede embebida en el ciclo cargado con `with: 'sede,sede.poblacion'`
     */
    const sedeFromProp  = sedeDelCiclo.value
    const sedeFromCiclo = cicloSeleccionado.value?.sede ?? null
    const poblacionId =
      sedeFromProp?.poblacion?.id  ??
      sedeFromProp?.poblacion_id   ??
      sedeFromCiclo?.poblacion?.id ??
      sedeFromCiclo?.poblacion_id  ??
      null

    if (!cursoId.value || !poblacionId) {
      sinPrecioConfigurado.value = true
      return
    }

    precioLoading.value = true
    try {
      /**
       * Una sola llamada: el endpoint resuelve internamente el producto LP
       * a partir de referencia_tipo + referencia_id, eliminando la búsqueda
       * previa a /lp/productos.
       * Respuesta: { message, total, data: [{ id, precio_contado, numero_cuotas, ... }] }
       */
      const res      = await precioProductoService.obtenerPrecio(
        {
          referencia_tipo: 'curso',
          referencia_id:   cursoId.value,
          poblacion_id:    poblacionId,
          fecha:           today()
        },
        { _silent: true }
      )
      const opciones = res?.data ?? (Array.isArray(res) ? res : [])

      if (!opciones.length) {
        sinPrecioConfigurado.value = true
        return
      }

      preciosDisponibles.value = opciones
      // Auto-seleccionar cuando solo hay una opción disponible
      if (opciones.length === 1) seleccionarPrecio(opciones[0])
    } catch {
      sinPrecioConfigurado.value = true
    } finally {
      precioLoading.value = false
    }
  }

  /**
   * Registra el precio elegido por el usuario y pre-rellena monto/cuota en detalles.
   * - Sin cuotas (numero_cuotas === null): pago de contado → monto = precio_contado.
   * - Con cuotas: financiado → monto = matrícula inicial, valor_cuota = cuota.
   */
  function seleccionarPrecio(precio) {
    precioSeleccionado.value = precio
    if (!precio) {
      detalles.monto       = ''
      detalles.valor_cuota = ''
      return
    }
    detalles.monto = precio.precio_contado
    if (precio.numero_cuotas) {
      detalles.valor_cuota = precio.valor_cuota
    } else {
      detalles.valor_cuota = ''
    }
  }

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
      const fields = _buildPayload(estudianteId)
      // Solo se usa FormData (multipart) cuando hay una foto nueva que subir;
      // el resto de los casos conserva el envío como JSON plano.
      const fotoFile = datosPersonales.foto instanceof File ? datosPersonales.foto : null
      const payload  = fotoFile ? _toFormData(fields, fotoFile) : fields

      const matricula = await matriculaService.create(payload)
      // Se pasa estudianteId explícito porque en la ruta de nuevo estudiante
      // (not_found) estudianteEncontrado permanece null y buildPrintData no puede
      // derivar el ID desde ahí.
      onSuccess?.(matricula, estudianteId)
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
    const cicloSedeId = cicloSeleccionado.value?.sede_id ?? cicloSeleccionado.value?.sede?.id
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
      ...(cicloSedeId ? { sedes: [cicloSedeId] } : {})
    }
    try {
      const res = await userService.create(payload, { _silent: true })
      return res.data?.id ?? res?.id ?? null
    } catch (e) {
      _handleApiError(e, 3)
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
      sede_id:            Number(sedeDelCiclo.value?.id ?? cicloSeleccionado.value?.sede_id),
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

      // ── Precio de lista seleccionado ──────────────────────────────────────
      lp_precio_producto_id: num(precioSeleccionado.value?.id),

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
      regimen_salud:   str(datosPersonales.regimen_salud),
      eps_id:          num(datosPersonales.eps_id)
    }

    // Elimina los campos opcionales que son undefined (no enviados al backend)
    return _omitUndefined(payload)
  }

  // ── Hoja de matrícula imprimible ─────────────────────────────────────────────

  /**
   * Construye el snapshot de datos para la hoja de matrícula imprimible
   * (ver MatriculaPrintModal.vue), a partir del estado ya recolectado en el
   * wizard. Se invoca justo después de un `submit()` exitoso.
   */
  function buildPrintData(matricula, estudianteIdFallback = null) {
    const record = matricula?.data ?? matricula ?? {}
    const matriculaId = record.id ?? null
    const anio = (detalles.fecha_matricula || today()).slice(0, 4)

    const findLabel = (opts, value) => opts.find(o => String(o.value) === String(value))?.label ?? ''

    return {
      matriculaId,
      estudianteId: record.estudiante_id ?? estudianteIdFallback ?? estudianteEncontrado.value?.id ?? null,
      codigo: matriculaId ? `MAT-${anio}-${String(matriculaId).padStart(3, '0')}` : '',
      fecha: detalles.fecha_matricula,
      sede: sedeDelCiclo.value?.nombre ?? cicloSeleccionado.value?.sede?.nombre ?? '',
      curso: cursosMap.value[cursoId.value] ?? '',
      ciclo: cicloSeleccionado.value?.nombre ?? '',

      personal: {
        nombres:             [estudianteForm.primer_nombre, estudianteForm.segundo_nombre].filter(Boolean).join(' '),
        apellidos:           [estudianteForm.primer_apellido, estudianteForm.segundo_apellido].filter(Boolean).join(' '),
        tipoIdentificacion:  findLabel(catalogOpts.value.tiposIdentificacion, datosPersonales.tipo_identificacion),
        documento:           estudianteForm.documento,
        expedicion:          [datosPersonales.departamento_expedicion, datosPersonales.ciudad_expedicion].filter(Boolean).join(', '),
        fechaNacimiento:     datosPersonales.fecha_nacimiento,
        lugarOrigen:         findLabel(lugarOrigenOpciones.value, datosPersonales.lugar_origen_id),
        genero:              findLabel(catalogOpts.value.generos, datosPersonales.genero),
        estadoCivil:         findLabel(catalogOpts.value.estadosCiviles, datosPersonales.estado_civil),
        tipoSangre:          [findLabel(catalogOpts.value.gruposSanguineos, datosPersonales.grupo_sanguineo), findLabel(catalogOpts.value.rhs, datosPersonales.rh)].filter(Boolean).join(' ')
      },

      contacto: {
        direccion: datosPersonales.direccion,
        telefono:  datosPersonales.telefono,
        celular:   datosPersonales.celular,
        email:     estudianteForm.email
      },

      academico: {
        nivelEducacion: findLabel(catalogOpts.value.nivelesEducacion, datosPersonales.nivel_educacion),
        ocupacion:      datosPersonales.ocupacion,
        empresa:        datosPersonales.empresa,
        estrato:        datosPersonales.estrato,
        regimenSalud:   findLabel(catalogOpts.value.regimenesSalud, datosPersonales.regimen_salud),
        eps:            findLabel(epsOpciones.value, datosPersonales.eps_id)
      },

      medica: {
        enfermedadPrioritaria: Boolean(datosPersonales.enfermedad_prioritaria),
        discapacidad:          Boolean(datosPersonales.discapacidad)
      },

      detalleCurso: {
        fechaInicio: detalles.fecha_inicio,
        monto:       detalles.monto,
        tallaOverol: detalles.talla_overol,
        tallaBotas:  detalles.talla_botas
      },

      emergencia: {
        nombre:   detalles.nombre_contacto,
        telefono: detalles.telefono_contacto,
        correo:   detalles.correo_contacto
      },

      apruebaUsoImagen:  Boolean(detalles.aprueba_uso_imagen),
      observaciones:     detalles.observaciones,
      multiculturalidad: detalles.multiculturalidad,
      // Se prefiere la URL que devuelve el backend tras guardar (ya persistida en el
      // servidor) sobre un blob: local — los navegadores no siempre resuelven blobs
      // de forma confiable durante la generación del PDF de impresión.
      fotoUrl:           record.foto_url || record.foto || fotoExistente.value || null,
      registradoPor:     comercialesMap.value[detalles.matriculado_por_id] ?? ''
    }
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

    sedeId.value              = ''
    cursosEnSede.value        = []
    cursosEnSedeLoading.value = false
    cursoId.value             = ''
    cicloId.value             = ''
    ciclosDisponibles.value   = []
    cicloSeleccionado.value   = null

    preciosDisponibles.value   = []
    precioSeleccionado.value   = null
    precioLoading.value        = false
    sinPrecioConfigurado.value = false

    // Restaura datosPersonales completo y el subconjunto de detalles que
    // proviene de la precarga (incluye foto, matriculaReferenciaId, fotoExistente).
    resetEstudianteBusqueda()

    // Resto de detalles del paso 5, independientes de la precarga del estudiante.
    Object.assign(detalles, {
      comercial_id: '', matriculado_por_id: '', status: '1',
      fecha_matricula: today(), fecha_inicio: '',
      monto: '', valor_cuota: '', observaciones: ''
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return {
    // Constantes
    WIZARD_STEPS,

    // Navegación
    currentStep, saving, apiError, fieldErrors,
    canProceed, canGoToStep, goToStep, nextStep,
    stepCircleClass, stepLabelClass,

    // Paso 1 — Programación (sede → curso → ciclo)
    sedeId, sedesOpciones, onSedeChange, cursosEnSedeLoading,
    cursoId, cicloId, ciclosDisponibles, ciclosLoading, cicloSeleccionado,
    cursosOpciones, cursosMap, ciclosOpciones,
    onCursoChange, onCicloChange,

    // Paso 2 — Precio
    preciosDisponibles, precioSeleccionado, precioLoading, sinPrecioConfigurado,
    seleccionarPrecio,

    // Paso 3 — Estudiante
    documentoBusqueda, estudianteBuscando, estudianteEstado,
    estudianteEncontrado, actualizarEstudiante, estudianteForm,
    buscarEstudiante, buscarEstudianteDebounced,
    seleccionarCandidato, registrarNuevoEstudiante, ocultarResultados,
    resultadosBusqueda, resetEstudianteBusqueda, estudianteResumen,
    matriculasExistentes, verificandoMatricula, yaMatriculadoEnCiclo,
    matriculaReferenciaId, fotoExistente,

    // Paso 4 — Datos personales
    catalogs, datosPersonales, catalogsLoading, catalogsError,
    catalogOpts, departamentosOpciones, ciudadesExpedicionOpciones, lugarOrigenOpciones, epsOpciones,

    // Paso 5 — Detalles de matrícula
    detalles, comercialesOpciones, comercialesMap, sedeDelCiclo,
    fechaInicioError,

    // Paso 6 — Confirmación
    tieneAlgunDatoPersonal,

    // Acciones
    submit, init, loadCatalogs, buildPrintData,

    // Utilidades
    formatDate, formatCOP
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers privados del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Retorna una copia del objeto sin las claves cuyo valor es undefined. */
function _omitUndefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  )
}

/** Valores en blanco de `datosPersonales` (paso 4). */
function _defaultDatosPersonales() {
  return {
    tipo_identificacion: '', departamento_expedicion: '', ciudad_expedicion: '',
    fecha_nacimiento: '', genero: '', estado_civil: '', grupo_sanguineo: '', rh: '',
    direccion: '', lugar_origen_id: '', celular: '', telefono: '',
    nivel_educacion: '', ocupacion: '', empresa: '', estrato: '', regimen_salud: '', eps_id: '',
    enfermedad_prioritaria: false, discapacidad: false, foto: null
  }
}

/** Valores en blanco del subconjunto de `detalles` (paso 5) que entrega la precarga. */
function _defaultDetallesPrecarga() {
  return {
    conocimiento_curso: false, como_entero_curso: '',
    talla_overol: '', talla_botas: '',
    nombre_contacto: '', telefono_contacto: '', correo_contacto: '',
    aprueba_uso_imagen: false, multiculturalidad: ''
  }
}

/** Convierte el payload de la matrícula (objeto plano) a FormData para incluir un archivo. */
function _toFormData(fields, fotoFile) {
  const fd = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    fd.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
  })
  fd.append('foto', fotoFile)
  return fd
}
