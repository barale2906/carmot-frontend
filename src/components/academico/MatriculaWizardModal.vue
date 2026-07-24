<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[1100] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
      >
        <div
          class="relative my-auto w-full max-w-3xl rounded-xl border border-black/10 bg-white shadow-xl"
          @click.stop
        >
          <!-- Botón cerrar -->
          <button
            type="button"
            class="absolute right-4 top-4 flex size-8 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar modal"
            :disabled="saving"
            @click="handleClose"
          >
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- ═══════════════════════════════════════
               Cabecera + Stepper
          ═══════════════════════════════════════ -->
          <div class="border-b border-black/5 px-6 pb-5 pt-6 pr-14">
            <h2 class="text-lg font-semibold text-slate-900">Nueva Matrícula</h2>
            <p class="mt-0.5 text-sm text-slate-500">
              Sigue los pasos para inscribir al estudiante en el ciclo académico.
            </p>

            <nav class="mt-5 flex items-center" aria-label="Pasos del wizard">
              <template v-for="(step, idx) in WIZARD_STEPS" :key="step.key">
                <button
                  type="button"
                  class="flex flex-col items-center gap-1.5"
                  :class="canGoToStep(idx + 1) ? 'cursor-pointer' : 'cursor-default'"
                  :disabled="!canGoToStep(idx + 1)"
                  :aria-current="currentStep === idx + 1 ? 'step' : undefined"
                  @click="goToStep(idx + 1)"
                >
                  <div
                    class="flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200"
                    :class="stepCircleClass(idx + 1)"
                  >
                    <svg
                      v-if="currentStep > idx + 1"
                      class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span v-else aria-hidden="true">{{ idx + 1 }}</span>
                  </div>
                  <span
                    class="hidden whitespace-nowrap text-xs font-medium sm:block"
                    :class="stepLabelClass(idx + 1)"
                  >{{ step.label }}</span>
                </button>
                <div
                  v-if="idx < WIZARD_STEPS.length - 1"
                  class="mb-5 h-0.5 flex-1 transition-colors duration-300"
                  :class="currentStep > idx + 1 ? 'bg-blue-500' : 'bg-slate-200'"
                  aria-hidden="true"
                />
              </template>
            </nav>
          </div>

          <!-- ═══════════════════════════════════════
               Cuerpo (scrollable)
          ═══════════════════════════════════════ -->
          <div class="max-h-[60vh] overflow-y-auto px-6 py-5">
            <!-- Error global de API -->
            <div
              v-if="apiError"
              role="alert"
              class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {{ apiError }}
            </div>

            <!-- ─── Paso 1: Programación ─────────────────── -->
            <div v-show="currentStep === 1" class="space-y-4">

              <!-- Sede (primer selector) -->
              <FormSelect
                v-model="sedeId"
                label="Sede"
                placeholder="Seleccionar sede..."
                help="Sede donde se realizará el curso."
                :options="sedesOpciones"
                required
                @update:model-value="onSedeChange"
              />

              <!-- Curso y Ciclo (dependientes de la sede) -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormSelect
                  v-model="cursoId"
                  label="Curso"
                  :placeholder="cursosEnSedeLoading ? 'Cargando cursos...' : 'Seleccionar curso...'"
                  help="Programa académico disponible en la sede seleccionada."
                  :options="cursosOpciones"
                  :disabled="!sedeId || cursosEnSedeLoading"
                  required
                  @update:model-value="onCursoChange"
                />
                <FormSelect
                  v-model="cicloId"
                  label="Ciclo"
                  :placeholder="ciclosLoading ? 'Cargando ciclos...' : 'Seleccionar ciclo...'"
                  help="Cohorte o periodo dentro del curso seleccionado."
                  :options="ciclosOpciones"
                  :disabled="!cursoId || ciclosLoading"
                  required
                  @update:model-value="onCicloChange"
                />
              </div>

              <Transition
                enter-active-class="transition-all duration-200"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
              >
                <InfoPanel v-if="cicloSeleccionado" color="blue">
                  <template #title>Ciclo seleccionado</template>
                  <dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <InfoItem label="Nombre"    :value="cicloSeleccionado.nombre" />
                    <InfoItem label="Sede"      :value="cicloSeleccionado.sede?.nombre" />
                    <InfoItem
                      label="Periodo"
                      :value="`${formatDate(cicloSeleccionado.fecha_inicio)} – ${formatDate(cicloSeleccionado.fecha_fin)}`"
                    />
                    <InfoItem label="Inscritos" :value="String(cicloSeleccionado.inscritos ?? 0)" />
                  </dl>
                </InfoPanel>
              </Transition>

              <div
                v-if="!sedeId"
                class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400"
              >
                Selecciona una sede para ver los cursos disponibles.
              </div>
              <div
                v-else-if="sedeId && !cursoId"
                class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400"
              >
                Selecciona un curso para ver los ciclos.
              </div>
              <div
                v-else-if="cursoId && !ciclosLoading && !ciclosDisponibles.length"
                class="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700"
              >
                No hay ciclos activos para este curso en la sede seleccionada. Verifica la programación académica.
              </div>
            </div>

            <!-- ─── Paso 2: Precio y forma de pago ─────────── -->
            <div v-show="currentStep === 2" class="space-y-4">

              <!-- Cargando -->
              <div v-if="precioLoading" class="flex flex-col items-center gap-3 py-10">
                <span class="inline-block size-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" role="status" aria-label="Cargando" />
                <p class="text-sm text-slate-500">Consultando lista de precios vigente...</p>
              </div>

              <!-- Sin precio configurado — bloquea el avance -->
              <div v-else-if="sinPrecioConfigurado" class="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                <p class="font-semibold">Sin lista de precios vigente</p>
                <p class="mt-1 text-xs text-red-600">
                  No se encontró una lista de precios activa para este curso y sede.
                  Es necesario configurar los precios antes de registrar la matrícula.
                </p>
              </div>

              <!-- Opciones de precio disponibles -->
              <template v-else-if="preciosDisponibles.length">
                <!-- Encabezado con info de la lista -->
                <InfoPanel color="blue">
                  <template #title>Lista de precios activa</template>
                  <p class="text-sm text-blue-800 font-medium">
                    {{ preciosDisponibles[0]?.lista_precio?.nombre }}
                    <span class="ml-1 text-xs font-normal text-blue-600">
                      · {{ formatDate(preciosDisponibles[0]?.lista_precio?.fecha_inicio) }}
                      – {{ formatDate(preciosDisponibles[0]?.lista_precio?.fecha_fin) }}
                    </span>
                  </p>
                </InfoPanel>

                <p class="text-sm font-medium text-slate-700">
                  Selecciona la modalidad de pago:
                </p>

                <!-- Tarjetas de precio -->
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    v-for="opcion in preciosDisponibles"
                    :key="opcion.id"
                    type="button"
                    class="group relative w-full rounded-xl border-2 p-4 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    :class="precioSeleccionado?.id === opcion.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'"
                    @click="seleccionarPrecio(opcion)"
                  >
                    <!-- Indicador de selección -->
                    <span
                      class="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border-2 transition-colors"
                      :class="precioSeleccionado?.id === opcion.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-300 bg-white'"
                      aria-hidden="true"
                    >
                      <svg
                        v-if="precioSeleccionado?.id === opcion.id"
                        class="size-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>

                    <!-- Tipo: contado o financiado -->
                    <p class="mb-1 text-xs font-semibold uppercase tracking-wide"
                       :class="opcion.numero_cuotas ? 'text-violet-600' : 'text-emerald-600'"
                    >
                      {{ opcion.numero_cuotas ? 'Financiado' : 'Contado' }}
                    </p>

                    <!-- Precio principal -->
                    <p class="text-2xl font-bold text-slate-900">
                      {{ formatCOP(opcion.precio_contado) }}
                    </p>

                    <!-- Detalle de cuotas -->
                    <template v-if="opcion.numero_cuotas">
                      <p class="mt-1 text-xs text-slate-500">
                        Matrícula: <strong class="text-slate-700">{{ formatCOP(opcion.matricula) }}</strong>
                      </p>
                      <p class="text-xs text-slate-500">
                        {{ opcion.numero_cuotas }} cuotas de
                        <strong class="text-slate-700">{{ formatCOP(opcion.valor_cuota) }}</strong>
                      </p>
                      <p v-if="opcion.precio_total" class="mt-0.5 text-xs text-slate-400">
                        Total: {{ formatCOP(opcion.precio_total) }}
                      </p>
                    </template>
                    <template v-else>
                      <p class="mt-1 text-xs text-slate-500">Pago único</p>
                    </template>

                    <!-- Observaciones -->
                    <p v-if="opcion.observaciones" class="mt-2 text-xs italic text-slate-400">
                      {{ opcion.observaciones }}
                    </p>
                  </button>
                </div>

                <!-- Precio seleccionado — confirmación visual -->
                <Transition
                  enter-active-class="transition-all duration-200"
                  enter-from-class="opacity-0 translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                >
                  <div
                    v-if="precioSeleccionado"
                    class="mt-1 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm"
                  >
                    <span class="font-medium text-emerald-700">
                      Modalidad seleccionada:
                      {{ precioSeleccionado.numero_cuotas ? 'Financiado' : 'Contado' }}
                      · {{ formatCOP(precioSeleccionado.precio_contado) }}
                    </span>
                  </div>
                </Transition>
              </template>
            </div>

            <!-- ─── Paso 3: Estudiante ───────────────────── -->
            <div v-show="currentStep === 3" class="space-y-4">

              <!-- Campo de búsqueda — visible solo mientras no se ha seleccionado un estudiante -->
              <div v-if="estudianteEstado === 'idle'" class="space-y-1.5">
                <label class="text-sm font-medium text-slate-900">
                  Buscar estudiante
                  <span class="ml-1 text-xs font-normal text-slate-500">— por nombre o número de documento</span>
                </label>
                <div class="relative">
                  <div class="relative flex items-center">
                    <svg class="pointer-events-none absolute left-3 size-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      v-model="documentoBusqueda"
                      type="text"
                      placeholder="Ej: Juan Pérez o 1020304050"
                      autocomplete="off"
                      class="w-full rounded-lg border-0 bg-[#f3f3f5] py-2 pl-9 pr-8 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      :disabled="estudianteBuscando"
                      @input="buscarEstudianteDebounced"
                      @keyup.enter="buscarEstudiante"
                      @blur="() => setTimeout(ocultarResultados, 150)"
                    />
                    <BtnSpinner v-if="estudianteBuscando" class="absolute right-2.5 border-slate-300 border-t-slate-600" />
                  </div>

                  <!-- Dropdown de resultados -->
                  <div
                    v-if="resultadosBusqueda.length > 0"
                    class="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
                  >
                    <button
                      v-for="est in resultadosBusqueda"
                      :key="est.id"
                      type="button"
                      class="flex w-full items-center gap-3 border-b border-black/5 px-4 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                      @mousedown.prevent="seleccionarCandidato(est)"
                    >
                      <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#213360]/10 text-xs font-semibold text-[#213360]">
                        {{ (est.primer_nombre || est.name || '?')[0].toUpperCase() }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="truncate font-medium text-slate-900">
                          {{ [est.primer_nombre, est.primer_apellido].filter(Boolean).join(' ') || est.name }}
                        </p>
                        <p class="truncate text-xs text-slate-500">
                          <template v-if="est.documento">Doc: {{ est.documento }}</template>
                          <template v-if="est.documento && est.email"> · </template>
                          <template v-if="est.email">{{ est.email }}</template>
                        </p>
                      </div>
                    </button>
                    <!-- Opción: registrar nuevo -->
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 border-t border-black/5 bg-slate-50 px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-700 focus:outline-none"
                      @mousedown.prevent="registrarNuevoEstudiante"
                    >
                      <svg class="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Registrar como nuevo estudiante
                    </button>
                  </div>
                </div>

                <!-- Sin resultados y búsqueda activa -->
                <div
                  v-if="!estudianteBuscando && documentoBusqueda.trim().length >= 2 && resultadosBusqueda.length === 0"
                  class="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3"
                >
                  <p class="text-sm text-amber-700">
                    No se encontró ningún estudiante con "<strong>{{ documentoBusqueda }}</strong>".
                  </p>
                  <button
                    type="button"
                    class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200 focus:outline-none"
                    @click="registrarNuevoEstudiante"
                  >
                    <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Registrar como nuevo estudiante
                  </button>
                </div>

                <!-- Estado vacío -->
                <div
                  v-if="!documentoBusqueda.trim() && !estudianteBuscando"
                  class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400"
                >
                  Escribe el nombre o documento del estudiante.
                </div>
              </div>

              <!-- Estudiante seleccionado -->
              <template v-if="estudianteEstado === 'found'">
                <InfoPanel color="green">
                  <template #title>Estudiante seleccionado</template>
                  <template #action>
                    <button type="button" class="text-xs text-emerald-600 hover:underline" @click="resetEstudianteBusqueda">
                      Cambiar
                    </button>
                  </template>
                  <p class="text-sm font-medium text-emerald-700">{{ estudianteEncontrado?.name }}</p>
                  <p class="text-xs text-emerald-600">{{ estudianteEncontrado?.email }}</p>
                  <p class="text-xs text-emerald-600">Doc: {{ estudianteEncontrado?.documento }}</p>
                </InfoPanel>

                <!-- Verificando matrícula previa -->
                <div v-if="verificandoMatricula" class="flex items-center gap-2 text-sm text-slate-500">
                  <BtnSpinner class="border-slate-300 border-t-slate-600" />
                  Verificando inscripciones previas en este curso y ciclo...
                </div>

                <!-- Error 422 del backend: duplicado detectado solo al guardar -->
                <InfoPanel v-else-if="fieldErrors.estudiante_id?.[0]" color="amber">
                  <template #title>Matrícula duplicada</template>
                  {{ fieldErrors.estudiante_id[0] }}
                </InfoPanel>

                <!-- Bloqueo: ya matriculado activo en este curso y ciclo -->
                <InfoPanel v-else-if="yaMatriculadoEnCiclo" color="amber">
                  <template #title>Estudiante ya matriculado en este curso y ciclo</template>
                  El estudiante ya tiene una matrícula activa en <strong>{{ cursosMap[cursoId] }}</strong>,
                  ciclo <strong>{{ cicloSeleccionado?.nombre }}</strong>.
                  No es posible registrar una nueva matrícula para la misma combinación de curso y ciclo.
                  <ul v-if="matriculasExistentes.length" class="mt-2 space-y-1">
                    <li
                      v-for="m in matriculasExistentes"
                      :key="m.id"
                      class="text-xs text-amber-800"
                    >
                      · Matrícula #{{ m.id }}
                      <template v-if="m.ciclo?.nombre"> — {{ m.ciclo.nombre }}</template>
                      <template v-if="m.ciclo?.sede?.nombre"> ({{ m.ciclo.sede.nombre }})</template>
                    </li>
                  </ul>
                </InfoPanel>

                <WizardCheckbox v-model="actualizarEstudiante">
                  <template #label>Actualizar información del estudiante</template>
                  <template #help>Marca esta opción si necesitas corregir el nombre o correo electrónico.</template>
                </WizardCheckbox>
                <div v-if="actualizarEstudiante" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput v-model="estudianteForm.primer_nombre"    label="Primer nombre"    :error="fieldErrors.primer_nombre?.[0]"    required />
                  <FormInput v-model="estudianteForm.segundo_nombre"   label="Segundo nombre"   :error="fieldErrors.segundo_nombre?.[0]"   />
                  <FormInput v-model="estudianteForm.primer_apellido"  label="Primer apellido"  :error="fieldErrors.primer_apellido?.[0]"  required />
                  <FormInput v-model="estudianteForm.segundo_apellido" label="Segundo apellido" :error="fieldErrors.segundo_apellido?.[0]" />
                  <FormInput v-model="estudianteForm.email"            label="Correo electrónico" :error="fieldErrors.email?.[0]" type="email" span="full" required />
                </div>
              </template>

              <!-- Nuevo estudiante -->
              <template v-if="estudianteEstado === 'not_found'">
                <InfoPanel color="amber">
                  <template #title>Nuevo estudiante</template>
                  <template #action>
                    <button type="button" class="text-xs text-amber-600 hover:underline" @click="resetEstudianteBusqueda">
                      Buscar otro
                    </button>
                  </template>
                  <p class="text-xs text-amber-700">Completa los datos para registrar al nuevo estudiante.</p>
                  <p v-if="cicloSeleccionado?.sede?.nombre" class="text-xs text-amber-700">
                    Se le asignará la sede: <strong>{{ cicloSeleccionado.sede.nombre }}</strong>
                  </p>
                </InfoPanel>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput v-model="estudianteForm.primer_nombre"    label="Primer nombre"    :error="fieldErrors.primer_nombre?.[0]"    required />
                  <FormInput v-model="estudianteForm.segundo_nombre"   label="Segundo nombre"   :error="fieldErrors.segundo_nombre?.[0]"   />
                  <FormInput v-model="estudianteForm.primer_apellido"  label="Primer apellido"  :error="fieldErrors.primer_apellido?.[0]"  required />
                  <FormInput v-model="estudianteForm.segundo_apellido" label="Segundo apellido" :error="fieldErrors.segundo_apellido?.[0]" />
                  <FormInput v-model="estudianteForm.email"            label="Correo electrónico"  :error="fieldErrors.email?.[0]"                type="email"   span="full" required />
                  <FormInput v-model="estudianteForm.documento"        label="Número de documento" :error="fieldErrors.documento?.[0]"                              required />
                  <FormInput v-model="estudianteForm.password"              label="Contraseña inicial"   :error="fieldErrors.password?.[0]"              type="password" hint="Por defecto: número de documento." required />
                  <FormInput v-model="estudianteForm.password_confirmation" label="Confirmar contraseña" :error="fieldErrors.password_confirmation?.[0]" type="password" required />
                </div>
              </template>
            </div>

            <!-- ─── Paso 4: Datos personales ─────────────── -->
            <div v-show="currentStep === 4" class="space-y-5">
              <!-- Estado de catálogos -->
              <div v-if="catalogsLoading" class="flex items-center gap-2 text-sm text-slate-500">
                <BtnSpinner class="border-slate-300 border-t-slate-600" />
                Cargando opciones de formulario...
              </div>
              <div
                v-else-if="catalogsError"
                class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                No se pudieron cargar algunas opciones del formulario. Los campos de selección pueden aparecer vacíos.
                <button type="button" class="ml-2 font-medium underline hover:no-underline" @click="loadCatalogs">
                  Reintentar
                </button>
              </div>
              <p v-else class="text-sm text-slate-500">
                Todos los campos de este paso son opcionales y complementan el expediente de la matrícula.
              </p>

              <Transition
                enter-active-class="transition-all duration-200"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
              >
                <InfoPanel v-if="matriculaReferenciaId" color="blue">
                  <template #title>Datos precargados</template>
                  Se tomaron de la matrícula #{{ matriculaReferenciaId }} del estudiante. Puedes
                  editar cualquier campo de este paso y del paso "Matrícula" antes de continuar.
                </InfoPanel>
              </Transition>

              <WizardFieldset legend="Identificación">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormSelect
                    v-model="datosPersonales.tipo_identificacion"
                    label="Tipo de identificación"
                    placeholder="Seleccionar..."
                    help="Tipo de documento de identidad."
                    :options="catalogOpts.tiposIdentificacion"
                    :error="fieldErrors.tipo_identificacion?.[0]"
                  />
                  <FormSelect
                    v-model="datosPersonales.departamento_expedicion"
                    label="Departamento de expedición"
                    placeholder="Seleccionar..."
                    :options="departamentosOpciones"
                    @update:model-value="datosPersonales.ciudad_expedicion = ''"
                  />
                  <FormSelect
                    v-model="datosPersonales.ciudad_expedicion"
                    label="Ciudad de expedición"
                    placeholder="Seleccionar..."
                    :options="ciudadesExpedicionOpciones"
                    :disabled="!datosPersonales.departamento_expedicion"
                  />
                </div>
              </WizardFieldset>

              <WizardFieldset legend="Foto">
                <p v-if="fotoExistente && !datosPersonales.foto" class="text-xs text-slate-500">
                  El estudiante ya tiene una foto registrada de una matrícula anterior.
                  Sube una nueva solo si deseas reemplazarla.
                </p>
                <FormFileUpload
                  v-model="datosPersonales.foto"
                  label="Foto del estudiante"
                  accept="image/*"
                  description="Captura o sube la foto del estudiante"
                  upload-label="Subir foto"
                  help="Foto tipo documento para carnet o expediente."
                  :error="fieldErrors.foto?.[0]"
                  span="full"
                />
              </WizardFieldset>

              <WizardFieldset legend="Datos demográficos">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput  v-model="datosPersonales.fecha_nacimiento" label="Fecha de nacimiento" type="date"        :error="fieldErrors.fecha_nacimiento?.[0]" />
                  <FormSelect v-model="datosPersonales.genero"           label="Género"              placeholder="Seleccionar..." :options="catalogOpts.generos"       :error="fieldErrors.genero?.[0]" />
                  <FormSelect v-model="datosPersonales.estado_civil"     label="Estado civil"        placeholder="Seleccionar..." :options="catalogOpts.estadosCiviles" :error="fieldErrors.estado_civil?.[0]" />
                  <div class="grid grid-cols-2 gap-3">
                    <FormSelect v-model="datosPersonales.grupo_sanguineo" label="Grupo sanguíneo" placeholder="—" :options="catalogOpts.gruposSanguineos" :error="fieldErrors.grupo_sanguineo?.[0]" />
                    <FormSelect v-model="datosPersonales.rh"              label="RH"              placeholder="—" :options="catalogOpts.rhs"              :error="fieldErrors.rh?.[0]" />
                  </div>
                </div>
              </WizardFieldset>

              <WizardFieldset legend="Contacto y ubicación">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput v-model="datosPersonales.celular"          label="Celular"                   type="tel" placeholder="3001234567"            :error="fieldErrors.celular?.[0]" />
                  <FormInput v-model="datosPersonales.telefono"         label="Teléfono fijo"             type="tel" placeholder="6011234567"            :error="fieldErrors.telefono?.[0]" />
                  <FormInput v-model="datosPersonales.direccion"        label="Dirección de residencia"   placeholder="Cra 10 # 20-30, Bogotá"          :error="fieldErrors.direccion?.[0]" span="full" />
                  <FormSelect
                    v-model="datosPersonales.lugar_origen_id"
                    label="Lugar de origen"
                    placeholder="Seleccionar ciudad..."
                    help="Ciudad o municipio de procedencia del estudiante."
                    :options="lugarOrigenOpciones"
                    span="full"
                  />
                </div>
              </WizardFieldset>

              <WizardFieldset legend="Datos socioeconómicos y salud">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormSelect v-model="datosPersonales.nivel_educacion" label="Nivel de educación"      placeholder="Seleccionar..." help="Mayor nivel educativo alcanzado." :options="catalogOpts.nivelesEducacion" :error="fieldErrors.nivel_educacion?.[0]" />
                  <FormInput  v-model="datosPersonales.ocupacion"       label="Ocupación"               placeholder="Ej: Ingeniero, Estudiante..."       :error="fieldErrors.ocupacion?.[0]" />
                  <FormInput  v-model="datosPersonales.empresa"         label="Empresa / Institución"   placeholder="Nombre de la empresa"              :error="fieldErrors.empresa?.[0]" />
                  <FormInput  v-model="datosPersonales.estrato"         label="Estrato"                 type="number" min="1" max="6" placeholder="1 – 6" :error="fieldErrors.estrato?.[0]" />
                  <FormSelect v-model="datosPersonales.regimen_salud"   label="Régimen de salud"        placeholder="Seleccionar..."                    :options="catalogOpts.regimenesSalud" :error="fieldErrors.regimen_salud?.[0]" />
                  <FormSelect v-model="datosPersonales.eps_id"          label="EPS"                     placeholder="Seleccionar EPS..."                :options="epsOpciones" help="Entidad Promotora de Salud del estudiante." :error="fieldErrors.eps_id?.[0]" />
                </div>
                <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <WizardCheckbox v-model="datosPersonales.enfermedad_prioritaria">
                    <template #label>Enfermedad prioritaria</template>
                    <template #help>Padece alguna enfermedad de atención prioritaria.</template>
                  </WizardCheckbox>
                  <WizardCheckbox v-model="datosPersonales.discapacidad">
                    <template #label>Discapacidad</template>
                    <template #help>Presenta algún tipo de discapacidad.</template>
                  </WizardCheckbox>
                </div>
              </WizardFieldset>
            </div>

            <!-- ─── Paso 5: Detalles de matrícula ────────── -->
            <div v-show="currentStep === 5" class="space-y-5">
              <InfoPanel color="slate">
                <template #title>Ciclo al que se matricula</template>
                <dl class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  <InfoItem label="Curso"   :value="cursosMap[cursoId]" />
                  <InfoItem label="Ciclo"   :value="cicloSeleccionado?.nombre" />
                  <InfoItem label="Sede"    :value="cicloSeleccionado?.sede?.nombre" />
                  <InfoItem
                    label="Periodo"
                    :value="`${formatDate(cicloSeleccionado?.fecha_inicio)} – ${formatDate(cicloSeleccionado?.fecha_fin)}`"
                  />
                </dl>
              </InfoPanel>

              <WizardFieldset legend="Personas">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormSelect
                    v-model="detalles.comercial_id"
                    label="Asesor comercial"
                    placeholder="Seleccionar asesor..."
                    help="Responsable comercial asociado a esta matrícula."
                    :options="comercialesOpciones"
                    :error="fieldErrors.comercial_id?.[0]"
                    required
                  />
                  <FormSelect
                    v-model="detalles.matriculado_por_id"
                    label="Registrado por"
                    placeholder="Seleccionar usuario..."
                    help="Usuario del sistema que formaliza el registro."
                    :options="comercialesOpciones"
                    :error="fieldErrors.matriculado_por_id?.[0]"
                    hint="Por defecto: tu usuario activo."
                    required
                  />
                </div>
              </WizardFieldset>

              <WizardFieldset legend="Fechas">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput
                    v-model="detalles.fecha_matricula"
                    label="Fecha de matrícula"
                    type="date"
                    help="Día en que se formaliza el registro."
                    :error="fieldErrors.fecha_matricula?.[0]"
                    required
                  />
                  <FormInput
                    v-model="detalles.fecha_inicio"
                    label="Inicio de clases"
                    type="date"
                    :min="detalles.fecha_matricula"
                    help="Primer día de clases. No puede ser anterior a la fecha de matrícula."
                    :error="fieldErrors.fecha_inicio?.[0] ?? fechaInicioError"
                    required
                  />
                </div>
              </WizardFieldset>

              <!-- Resumen del precio elegido en paso 2 -->
              <InfoPanel v-if="precioSeleccionado" color="blue">
                <template #title>Precio seleccionado</template>
                <dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <InfoItem
                    label="Modalidad"
                    :value="precioSeleccionado.numero_cuotas ? 'Financiado' : 'Contado'"
                  />
                  <InfoItem label="Monto" :value="formatCOP(precioSeleccionado.precio_contado)" />
                  <InfoItem v-if="precioSeleccionado.numero_cuotas"
                    label="Cuotas"
                    :value="`${precioSeleccionado.numero_cuotas} × ${formatCOP(precioSeleccionado.valor_cuota)}`"
                  />
                  <InfoItem v-if="precioSeleccionado.precio_total"
                    label="Total"
                    :value="formatCOP(precioSeleccionado.precio_total)"
                  />
                </dl>
              </InfoPanel>

              <WizardFieldset legend="Precio y pago">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput
                    v-model="detalles.monto"
                    label="Monto acordado"
                    type="number" step="0.01" min="0"
                    help="Valor total acordado para esta matrícula."
                    :error="fieldErrors.monto?.[0]"
                    hint="Pre-cargado desde el precio seleccionado. Puedes ajustarlo."
                    required
                  />
                  <FormInput
                    v-model="detalles.valor_cuota"
                    label="Valor por cuota"
                    type="number" step="0.01" min="0"
                    help="Valor de cada cuota si el pago es financiado."
                    :error="fieldErrors.valor_cuota?.[0]"
                    hint="Aplica solo en modalidad financiada."
                  />
                  <FormSelect
                    v-model="detalles.status"
                    label="Estado inicial"
                    help="Activo inscribe al ciclo de inmediato; Inactivo queda pendiente."
                    :options="[
                      { value: '1', label: 'Activo (inscribe al ciclo)' },
                      { value: '0', label: 'Inactivo' }
                    ]"
                  />
                </div>
              </WizardFieldset>

              <WizardFieldset legend="Inscripción y dotación">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput v-model="detalles.como_entero_curso" label="¿Cómo se enteró del curso?" placeholder="Ej: Redes sociales, recomendación..." :error="fieldErrors.como_entero_curso?.[0]" />
                  <FormInput v-model="detalles.multiculturalidad"  label="Multiculturalidad"          placeholder="Ej: Mestizo, Afrocolombiano..."      :error="fieldErrors.multiculturalidad?.[0]" />
                  <FormInput v-model="detalles.talla_overol"       label="Talla overol"               placeholder="S, M, L, XL..."                     :error="fieldErrors.talla_overol?.[0]" />
                  <FormInput v-model="detalles.talla_botas"        label="Talla botas"                placeholder="38, 40, 42..."                      :error="fieldErrors.talla_botas?.[0]" />
                </div>
                <WizardCheckbox v-model="detalles.conocimiento_curso" class="mt-3">
                  <template #label>Conocimiento del curso</template>
                  <template #help>El estudiante fue informado sobre el contenido y las condiciones del curso.</template>
                </WizardCheckbox>
              </WizardFieldset>

              <WizardFieldset legend="Contacto de emergencia">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput v-model="detalles.nombre_contacto"   label="Nombre del contacto"   :error="fieldErrors.nombre_contacto?.[0]"   span="full" />
                  <FormInput v-model="detalles.telefono_contacto" label="Teléfono del contacto" :error="fieldErrors.telefono_contacto?.[0]" type="tel" />
                  <FormInput v-model="detalles.correo_contacto"   label="Correo del contacto"   :error="fieldErrors.correo_contacto?.[0]"   type="email" />
                </div>
              </WizardFieldset>

              <WizardFieldset legend="Consentimientos y observaciones">
                <WizardCheckbox v-model="detalles.aprueba_uso_imagen" class="mb-3">
                  <template #label>Aprueba uso de imagen</template>
                  <template #help>El estudiante autoriza el uso de su imagen con fines institucionales.</template>
                </WizardCheckbox>
                <FormTextarea
                  v-model="detalles.observaciones"
                  label="Observaciones"
                  placeholder="Notas adicionales sobre esta matrícula (opcional)..."
                  :rows="2"
                  help="Notas internas opcionales; no alteran el precio ni el estado."
                />
              </WizardFieldset>
            </div>

            <!-- ─── Paso 6: Confirmación ─────────────────── -->
            <div v-show="currentStep === 6" class="space-y-4">
              <p class="text-sm text-slate-500">
                Revisa el resumen antes de confirmar el registro de la matrícula.
              </p>

              <SummaryCard title="Programación">
                <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <InfoItem label="Curso"            :value="cursosMap[cursoId]" />
                  <InfoItem label="Ciclo"            :value="cicloSeleccionado?.nombre" />
                  <InfoItem label="Sede"             :value="cicloSeleccionado?.sede?.nombre" />
                  <InfoItem
                    label="Periodo del ciclo"
                    :value="`${formatDate(cicloSeleccionado?.fecha_inicio)} – ${formatDate(cicloSeleccionado?.fecha_fin)}`"
                  />
                </dl>
              </SummaryCard>

              <SummaryCard title="Estudiante">
                <template #badge>
                  <span
                    class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="estudianteEstado === 'found' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ estudianteEstado === 'found' ? 'Existente' : 'Nuevo registro' }}
                  </span>
                </template>
                <dl class="space-y-1 text-sm">
                  <InfoItem label="Nombre"    :value="estudianteResumen.name"      block />
                  <InfoItem label="Correo"    :value="estudianteResumen.email"     block />
                  <InfoItem label="Documento" :value="estudianteResumen.documento" block />
                </dl>
                <p v-if="estudianteEstado === 'found' && actualizarEstudiante" class="mt-1 text-xs text-blue-600">
                  * Los datos del estudiante serán actualizados al guardar.
                </p>
              </SummaryCard>

              <SummaryCard v-if="tieneAlgunDatoPersonal" title="Datos personales">
                <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <InfoItem v-if="datosPersonales.tipo_identificacion"
                    label="Tipo ID"
                    :value="catalogOpts.tiposIdentificacion.find(o => o.value === datosPersonales.tipo_identificacion)?.label"
                  />
                  <InfoItem v-if="datosPersonales.fecha_nacimiento" label="Nacimiento"      :value="formatDate(datosPersonales.fecha_nacimiento)" />
                  <InfoItem v-if="datosPersonales.genero"           label="Género"          :value="catalogOpts.generos.find(o => o.value === datosPersonales.genero)?.label" />
                  <InfoItem v-if="datosPersonales.celular"          label="Celular"         :value="datosPersonales.celular" />
                  <InfoItem v-if="datosPersonales.nivel_educacion"  label="Nivel educativo" :value="catalogOpts.nivelesEducacion.find(o => o.value === datosPersonales.nivel_educacion)?.label" />
                  <InfoItem v-if="datosPersonales.lugar_origen_id"  label="Lugar de origen" :value="lugarOrigenOpciones.find(o => String(o.value) === String(datosPersonales.lugar_origen_id))?.label" />
                </dl>
              </SummaryCard>

              <SummaryCard title="Precio y pago">
                <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div class="col-span-2">
                    <dt class="text-xs text-slate-400">Monto acordado</dt>
                    <dd class="text-xl font-bold text-blue-700">{{ formatCOP(detalles.monto) }}</dd>
                  </div>
                  <InfoItem
                    label="Modalidad"
                    :value="precioSeleccionado
                      ? (precioSeleccionado.numero_cuotas ? 'Financiado' : 'Contado')
                      : 'Manual'"
                  />
                  <InfoItem v-if="precioSeleccionado?.matricula && precioSeleccionado.numero_cuotas" label="Valor matrícula" :value="formatCOP(precioSeleccionado.matricula)" />
                  <InfoItem v-if="detalles.valor_cuota" label="Valor por cuota" :value="formatCOP(detalles.valor_cuota)" />
                  <InfoItem v-if="precioSeleccionado?.precio_total" label="Total financiado" :value="formatCOP(precioSeleccionado.precio_total)" />
                  <InfoItem v-if="precioSeleccionado?.lista_precio" label="Lista de precios" :value="precioSeleccionado.lista_precio.nombre" />
                </dl>
              </SummaryCard>

              <SummaryCard title="Detalles de matrícula">
                <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <InfoItem label="Asesor comercial" :value="comercialesMap[detalles.comercial_id]" />
                  <InfoItem label="Registrado por"   :value="comercialesMap[detalles.matriculado_por_id]" />
                  <InfoItem label="Fecha matrícula"  :value="formatDate(detalles.fecha_matricula)" />
                  <InfoItem label="Inicio de clases" :value="formatDate(detalles.fecha_inicio)" />
                  <InfoItem                                  label="Estado inicial"      :value="detalles.status === '1' ? 'Activo' : 'Inactivo'" />
                  <InfoItem v-if="detalles.nombre_contacto" label="Contacto emergencia" :value="`${detalles.nombre_contacto} · ${detalles.telefono_contacto}`" />
                  <InfoItem v-if="detalles.observaciones"   label="Observaciones"       :value="detalles.observaciones" block />
                </dl>
              </SummaryCard>
            </div>
          </div>

          <!-- ═══════════════════════════════════════
               Footer de navegación
          ═══════════════════════════════════════ -->
          <div class="flex items-center justify-between border-t border-black/5 px-6 py-4">
            <button
              type="button"
              class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              :disabled="saving"
              @click="handleClose"
            >
              Cancelar
            </button>
            <div class="flex items-center gap-3">
              <button
                v-if="currentStep > 1"
                type="button"
                class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                :disabled="saving"
                @click="currentStep--"
              >
                ← Anterior
              </button>
              <button
                v-if="currentStep < WIZARD_STEPS.length"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                :disabled="!canProceed"
                @click="nextStep"
              >
                Siguiente →
              </button>
              <button
                v-else
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d] disabled:opacity-60"
                :disabled="saving"
                @click="handleSubmit"
              >
                <BtnSpinner v-if="saving" />
                {{ saving ? 'Registrando...' : 'Registrar matrícula' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, h } from 'vue'

import FormInput      from '@/components/forms/FormInput.vue'
import FormSelect     from '@/components/forms/FormSelect.vue'
import FormTextarea   from '@/components/forms/FormTextarea.vue'
import FormFileUpload from '@/components/forms/FormFileUpload.vue'

import { useMatriculaWizard, WIZARD_STEPS, formatDate, formatCOP } from '@/composables/useMatriculaWizard.js'
import { useNotification } from '@/composables/useNotification.js'

// ─── Props & emits ─────────────────────────────────────────────────────────────
const props = defineProps({
  open:        { type: Boolean, default: false },
  cursos:      { type: Array,   default: () => [] },
  sedes:       { type: Array,   default: () => [] },
  comerciales: { type: Array,   default: () => [] }
})
const emit = defineEmits(['close', 'saved'])

const { success: notifySuccess } = useNotification()

// ─── Lógica de negocio (composable) ───────────────────────────────────────────
const {
  currentStep, saving, apiError, fieldErrors,
  canProceed, canGoToStep, goToStep, nextStep,
  stepCircleClass, stepLabelClass,

  // Paso 1 — Programación
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
  datosPersonales, catalogsLoading, catalogsError,
  catalogOpts, departamentosOpciones, ciudadesExpedicionOpciones, lugarOrigenOpciones, epsOpciones,

  // Paso 5 — Detalles
  detalles, comercialesOpciones, comercialesMap, fechaInicioError,

  // Paso 6 — Confirmación
  tieneAlgunDatoPersonal,

  submit, init, loadCatalogs, buildPrintData
} = useMatriculaWizard({
  cursos:      computed(() => props.cursos),
  sedes:       computed(() => props.sedes),
  comerciales: computed(() => props.comerciales)
})

// ─── Handlers ──────────────────────────────────────────────────────────────────
function handleClose() {
  if (!saving.value) emit('close')
}

async function handleSubmit() {
  await submit((matricula, estudianteId) => {
    notifySuccess('Matrícula registrada correctamente.')
    emit('saved', buildPrintData(matricula, estudianteId))
    emit('close')
  })
}

watch(() => props.open, (val) => { if (val) init() })

// ─────────────────────────────────────────────────────────────────────────────
// Micro-componentes internos del wizard
// Usan funciones de renderizado (h) en lugar de template strings para evitar
// la dependencia del compilador Vue en tiempo de ejecución.
// ─────────────────────────────────────────────────────────────────────────────

/** Spinner de carga accesible para botones */
const BtnSpinner = {
  setup: () => () => h('span', {
    class: 'inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white',
    role: 'status',
    'aria-label': 'Cargando'
  })
}

/** Checkbox con etiqueta y descripción con estilo consistente */
const WizardCheckbox = {
  props: { modelValue: Boolean },
  emits: ['update:modelValue'],
  setup(props, { slots, emit }) {
    return () => h(
      'label',
      { class: 'flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 transition-colors' },
      [
        h('input', {
          type: 'checkbox',
          checked: props.modelValue,
          class: 'mt-0.5 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500',
          onChange: (e) => emit('update:modelValue', e.target.checked)
        }),
        h('div', [
          h('p', { class: 'text-sm font-medium text-slate-800' }, slots.label?.()),
          h('p', { class: 'text-xs text-slate-500' },             slots.help?.())
        ])
      ]
    )
  }
}

/** fieldset semántico con leyenda consistente */
const WizardFieldset = {
  props: { legend: String },
  setup(props, { slots }) {
    return () => h('fieldset', { class: 'space-y-3' }, [
      h('legend', { class: 'text-xs font-semibold uppercase tracking-wide text-slate-400' }, props.legend),
      slots.default?.()
    ])
  }
}

/** Panel informativo con variantes de color */
const INFO_PANEL_CLASSES = {
  blue:  { panel: 'border-blue-100 bg-blue-50',       title: 'text-blue-600'    },
  green: { panel: 'border-emerald-200 bg-emerald-50', title: 'text-emerald-800' },
  amber: { panel: 'border-amber-200 bg-amber-50',     title: 'text-amber-800'   },
  slate: { panel: 'border-slate-200 bg-slate-50',     title: 'text-slate-500'   }
}
const InfoPanel = {
  props: {
    color: { type: String, default: 'blue', validator: (v) => v in INFO_PANEL_CLASSES }
  },
  setup(props, { slots }) {
    return () => {
      const cls = INFO_PANEL_CLASSES[props.color] ?? INFO_PANEL_CLASSES.blue
      return h('div', { class: `rounded-xl border p-4 ${cls.panel}` }, [
        h('div', { class: 'mb-1.5 flex items-center justify-between gap-2' }, [
          h('p', { class: `text-xs font-semibold ${cls.title}` }, slots.title?.()),
          slots.action?.()
        ]),
        slots.default?.()
      ])
    }
  }
}

/** Par etiqueta/valor semántico para resúmenes */
const InfoItem = {
  props: { label: String, value: String, block: { type: Boolean, default: false } },
  setup(props) {
    return () => h('div', { class: props.block ? 'col-span-2' : '' }, [
      h('dt', { class: 'text-xs text-slate-400' },        props.label),
      h('dd', { class: 'font-medium text-slate-800' },    props.value ?? '—')
    ])
  }
}

/** Tarjeta de sección para el paso de confirmación */
const SummaryCard = {
  props: { title: String },
  setup(props, { slots }) {
    return () => h('div', { class: 'space-y-2 rounded-xl border border-black/10 p-4' }, [
      h('div', { class: 'flex items-center justify-between gap-2' }, [
        h('p', { class: 'text-xs font-semibold uppercase tracking-wide text-slate-400' }, props.title),
        slots.badge?.()
      ]),
      slots.default?.()
    ])
  }
}
</script>
