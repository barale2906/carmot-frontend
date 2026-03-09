<template>
  <div class="rounded-[14px] border border-black/10 bg-white p-6">
    <form class="space-y-6" @submit.prevent="onSubmit">
      <div>
        <h2 class="text-lg font-medium text-[#213360]">
          Formulario de matrícula
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          Completa la información del estudiante para realizar la matrícula.
        </p>
      </div>

            <FormSection title="Información de matrícula">
              <FormInput
                v-model="form.numeroMatricula"
                label="Número de matrícula"
                placeholder="TBC-001"
                hint="Consecutivo automático según tipo"
                required
                span="full"
              />
              <FormSelect
                v-model="form.sede"
                label="Sede"
                placeholder="Selecciona una sede"
                :options="opcionesSede"
                required
              />
              <FormInput
                v-model="form.fechaMatricula"
                label="Fecha de matrícula"
                type="date"
                required
              />
            </FormSection>

            <FormSection title="Información personal">
              <FormInput v-model="form.nombres" label="Nombres" placeholder="Nombres completos" required />
              <FormInput v-model="form.apellidos" label="Apellidos" placeholder="Apellidos completos" required />
              <FormSelect v-model="form.tipoIdentificacion" label="Tipo de identificación" placeholder="Selecciona tipo" :options="opcionesTipoDoc" required />
              <FormInput v-model="form.numeroDocumento" label="Número de documento" placeholder="Número de documento" required />
              <FormSelect v-model="form.departamentoExpedicion" label="Departamento de expedición" placeholder="Selecciona departamento" :options="opcionesDepartamento" required />
              <FormSelect v-model="form.ciudadExpedicion" label="Ciudad de expedición" placeholder="Selecciona ciudad" :options="opcionesCiudad" required />
              <FormInput v-model="form.fechaNacimiento" label="Fecha de nacimiento" type="date" required />
              <FormSelect v-model="form.genero" label="Género" placeholder="Selecciona género" :options="opcionesGenero" required />
              <FormSelect v-model="form.estadoCivil" label="Estado civil" placeholder="Selecciona estado civil" :options="opcionesEstadoCivil" required />
              <FormSelect v-model="form.grupoSanguineo" label="Grupo sanguíneo RH" placeholder="Selecciona grupo sanguíneo" :options="opcionesGrupoSanguineo" required />
            </FormSection>

            <FormSection title="Información de contacto">
              <FormInput v-model="form.direccion" label="Dirección" placeholder="Dirección de residencia" required span="full" />
              <FormInput v-model="form.lugarOrigen" label="Lugar de origen" placeholder="Ciudad/Municipio de origen" required />
              <FormInput v-model="form.celular" label="Celular" type="tel" placeholder="3001234567" required />
              <FormInput v-model="form.telefonoFijo" label="Teléfono fijo" type="tel" placeholder="78074234" />
              <FormInput v-model="form.correo" label="Correo electrónico" type="email" placeholder="correo@ejemplo.com" required span="full" />
            </FormSection>

            <FormSection title="Información académica y socioeconómica">
              <FormSelect v-model="form.nivelEducacion" label="Nivel de educación" placeholder="Selecciona nivel" :options="opcionesNivelEducacion" required />
              <FormInput v-model="form.ocupacion" label="Ocupación" placeholder="Ocupación actual" required />
              <FormInput v-model="form.empresa" label="Empresa donde trabaja" placeholder="Nombre de la empresa" />
              <FormSelect v-model="form.estrato" label="Estrato" placeholder="Selecciona estrato" :options="opcionesEstrato" required />
              <FormSelect v-model="form.regimenSalud" label="Régimen de salud" placeholder="Selecciona régimen" :options="opcionesRegimenSalud" required />
            </FormSection>

            <FormSection title="Información médica">
              <FormSelect v-model="form.enfermedadPrioritaria" label="¿Sufre alguna enfermedad de atención prioritaria?" placeholder="Selecciona opción" :options="opcionesSiNo" required />
              <FormSelect v-model="form.discapacidad" label="¿Tiene alguna discapacidad?" placeholder="Selecciona opción" :options="opcionesSiNo" required />
            </FormSection>

            <FormSection title="Información del curso">
              <FormSelect v-model="form.curso" label="Curso/Técnica" placeholder="Selecciona un curso" :options="opcionesCurso" required />
              <FormSelect v-model="form.horario" label="Horario" placeholder="Selecciona horario" :options="opcionesHorario" required />
              <FormInput v-model="form.fechaIniciacion" label="Fecha de iniciación de clase" type="date" required />
              <FormSelect v-model="form.conocimientoCurso" label="¿Tiene conocimiento del curso que va a realizar?" placeholder="Selecciona opción" :options="opcionesSiNo" required />
              <FormSelect v-model="form.comoSeEntero" label="¿Cómo se enteró del curso/técnico?" placeholder="Selecciona opción" :options="opcionesComoSeEntero" required />
              <FormInput v-model="form.valorCuota" label="Valor costo" placeholder="$0" />
            </FormSection>

            <FormSection title="Overol/Botas">
              <p class="mb-2 text-sm text-slate-500 md:col-span-2">
                (No aplica para soldadura)
              </p>
              <FormSelect v-model="form.tallaOverol" label="Talla Overol" placeholder="Selecciona talla" :options="opcionesTalla" />
              <FormInput v-model="form.tallaBotas" label="Talla Botas" placeholder="Ej: 38" />
            </FormSection>

            <FormSection title="Persona de contacto en caso de emergencia">
              <FormInput v-model="form.contactoNombre" label="Nombre completo de persona de contacto" placeholder="Nombre completo" required span="full" />
              <FormInput v-model="form.contactoTelefono" label="Teléfono persona de contacto" type="tel" placeholder="3001234567" required />
              <FormInput v-model="form.contactoCorreo" label="Correo electrónico persona de contacto" type="email" placeholder="contacto@ejemplo.com" />
            </FormSection>

            <FormSection title="Aprobaciones y documentos">
              <FormSelect v-model="form.aprobacionImagen" label="Aprobación uso de imagen" placeholder="Selecciona opción" :options="opcionesSiNo" required />
              <FormInput v-model="form.nombreAsistente" label="Nombre asistente (Quien realiza la matrícula)" placeholder="Nombre del asistente" required />
            </FormSection>

            <FormSection title="Multiculturalidad">
              <FormSelect v-model="form.caracterizacionEspecial" label="Caracterización especial" placeholder="Selecciona una opción" :options="opcionesCaracterizacion" span="full" />
              <p class="text-sm text-slate-500 md:col-span-2">
                Información de cara a la inclusión integral del estudiante.
              </p>
            </FormSection>

            <FormSection title="Documentos del estudiante">
              <FormFileUpload
                v-model="form.fotoEstudiante"
                label="Foto del estudiante"
                description="Captura o sube la foto del estudiante"
                upload-label="Subir foto"
                accept="image/*"
              />
              <FormFileUpload
                v-model="form.huellaEstudiante"
                label="Huella del estudiante"
                description="Captura o sube la huella del estudiante"
                upload-label="Subir archivo"
                accept="image/*"
              />
            </FormSection>

            <FormSection title="Observaciones" layout="custom">
              <FormTextarea
                v-model="form.observaciones"
                placeholder="Notas adicionales sobre la matrícula"
                :rows="4"
              />
            </FormSection>

      <FormActions
        cancel-label="Cancelar"
        submit-label="Guardar matrícula"
        :loading="loading"
        @cancel="onCancel"
        @submit="onSubmit"
      />
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import FormSection from '@/components/forms/FormSection.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import FormFileUpload from '@/components/forms/FormFileUpload.vue'
import FormActions from '@/components/forms/FormActions.vue'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  numeroMatricula: '',
  sede: '',
  fechaMatricula: '',
  nombres: '',
  apellidos: '',
  tipoIdentificacion: '',
  numeroDocumento: '',
  departamentoExpedicion: '',
  ciudadExpedicion: '',
  fechaNacimiento: '',
  genero: '',
  estadoCivil: '',
  grupoSanguineo: '',
  direccion: '',
  lugarOrigen: '',
  celular: '',
  telefonoFijo: '',
  correo: '',
  nivelEducacion: '',
  ocupacion: '',
  empresa: '',
  estrato: '',
  regimenSalud: '',
  enfermedadPrioritaria: '',
  discapacidad: '',
  curso: '',
  horario: '',
  fechaIniciacion: '',
  conocimientoCurso: '',
  comoSeEntero: '',
  valorCuota: '',
  tallaOverol: '',
  tallaBotas: '',
  contactoNombre: '',
  contactoTelefono: '',
  contactoCorreo: '',
  aprobacionImagen: '',
  nombreAsistente: '',
  caracterizacionEspecial: '',
  fotoEstudiante: null,
  huellaEstudiante: null,
  observaciones: ''
})

const opcionesSiNo = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' }
]

const opcionesSede = [
  { value: 'tunja', label: 'Tunja' },
  { value: 'duitama', label: 'Duitama' },
  { value: 'sogamoso', label: 'Sogamoso' }
]

const opcionesTipoDoc = [
  { value: 'cc', label: 'Cédula de ciudadanía' },
  { value: 'ce', label: 'Cédula de extranjería' },
  { value: 'ti', label: 'Tarjeta de identidad' }
]

const opcionesDepartamento = [
  { value: 'boyaca', label: 'Boyacá' },
  { value: 'cundinamarca', label: 'Cundinamarca' }
]

const opcionesCiudad = [
  { value: 'tunja', label: 'Tunja' },
  { value: 'duitama', label: 'Duitama' },
  { value: 'bogota', label: 'Bogotá' }
]

const opcionesGenero = [
  { value: 'm', label: 'Masculino' },
  { value: 'f', label: 'Femenino' },
  { value: 'otro', label: 'Otro' }
]

const opcionesEstadoCivil = [
  { value: 'soltero', label: 'Soltero(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'union', label: 'Unión libre' }
]

const opcionesGrupoSanguineo = [
  { value: 'a+', label: 'A+' },
  { value: 'a-', label: 'A-' },
  { value: 'b+', label: 'B+' },
  { value: 'b-', label: 'B-' },
  { value: 'o+', label: 'O+' },
  { value: 'o-', label: 'O-' }
]

const opcionesNivelEducacion = [
  { value: 'primaria', label: 'Primaria' },
  { value: 'secundaria', label: 'Secundaria' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'universitario', label: 'Universitario' }
]

const opcionesEstrato = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' }
]

const opcionesRegimenSalud = [
  { value: 'contributivo', label: 'Contributivo' },
  { value: 'subsidiado', label: 'Subsidiado' }
]

const opcionesCurso = [
  { value: 'mecanica', label: 'Mecánica de Motos' },
  { value: 'soldadura', label: 'Soldadura Industrial' },
  { value: 'automotriz', label: 'Mecánica Automotriz' }
]

const opcionesHorario = [
  { value: 'am', label: 'Mañana' },
  { value: 'pm', label: 'Tarde' },
  { value: 'noche', label: 'Noche' }
]

const opcionesComoSeEntero = [
  { value: 'redes', label: 'Redes sociales' },
  { value: 'referido', label: 'Referido' },
  { value: 'web', label: 'Página web' }
]

const opcionesTalla = [
  { value: 's', label: 'S' },
  { value: 'm', label: 'M' },
  { value: 'l', label: 'L' },
  { value: 'xl', label: 'XL' }
]

const opcionesCaracterizacion = [
  { value: 'ninguna', label: 'Ninguna' },
  { value: 'etnica', label: 'Comunidad étnica' },
  { value: 'victima', label: 'Víctima' }
]

function onCancel() {
  router.back()
}

function onSubmit() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    // TODO: enviar a API
  }, 500)
}
</script>
