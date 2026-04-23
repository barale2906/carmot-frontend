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
                help="Identificador único de la matrícula en el centro."
                required
                span="full"
              />
              <FormSelect
                v-model="form.sede"
                label="Sede"
                placeholder="Selecciona una sede"
                help="Sede donde cursará o se registra el estudiante."
                :options="opcionesSede"
                required
              />
              <FormInput
                v-model="form.fechaMatricula"
                label="Fecha de matrícula"
                type="date"
                help="Fecha en que se firma o registra esta matrícula."
                required
              />
            </FormSection>

            <FormSection title="Información personal">
              <FormInput v-model="form.nombres" label="Nombres" placeholder="Nombres completos" help="Nombres de pila del estudiante." required />
              <FormInput v-model="form.apellidos" label="Apellidos" placeholder="Apellidos completos" help="Apellidos según documento." required />
              <FormSelect v-model="form.tipoIdentificacion" label="Tipo de identificación" placeholder="Selecciona tipo" help="CC, TI, CE u otro tipo válido." :options="opcionesTipoDoc" required />
              <FormInput v-model="form.numeroDocumento" label="Número de documento" placeholder="Número de documento" help="Número impreso en el documento de identidad." required />
              <FormSelect v-model="form.departamentoExpedicion" label="Departamento de expedición" placeholder="Selecciona departamento" help="Departamento donde se expidió el documento." :options="opcionesDepartamento" required />
              <FormSelect v-model="form.ciudadExpedicion" label="Ciudad de expedición" placeholder="Selecciona ciudad" help="Ciudad o municipio de expedición del documento." :options="opcionesCiudad" required />
              <FormInput v-model="form.fechaNacimiento" label="Fecha de nacimiento" type="date" help="Fecha de nacimiento del estudiante." required />
              <FormSelect v-model="form.genero" label="Género" placeholder="Selecciona género" help="Autoidentificación de género registrada." :options="opcionesGenero" required />
              <FormSelect v-model="form.estadoCivil" label="Estado civil" placeholder="Selecciona estado civil" help="Estado civil declarado." :options="opcionesEstadoCivil" required />
              <FormSelect v-model="form.grupoSanguineo" label="Grupo sanguíneo RH" placeholder="Selecciona grupo sanguíneo" help="Grupo y factor RH para emergencias." :options="opcionesGrupoSanguineo" required />
            </FormSection>

            <FormSection title="Información de contacto">
              <FormInput v-model="form.direccion" label="Dirección" placeholder="Dirección de residencia" help="Dirección y barrio de residencia actual." required span="full" />
              <FormInput v-model="form.lugarOrigen" label="Lugar de origen" placeholder="Ciudad/Municipio de origen" help="Ciudad o municipio de procedencia." required />
              <FormInput v-model="form.celular" label="Celular" type="tel" placeholder="3001234567" help="Número móvil principal de contacto." required />
              <FormInput v-model="form.telefonoFijo" label="Teléfono fijo" type="tel" placeholder="78074234" help="Teléfono fijo opcional de contacto." />
              <FormInput v-model="form.correo" label="Correo electrónico" type="email" placeholder="correo@ejemplo.com" help="Correo para comunicaciones institucionales." required span="full" />
            </FormSection>

            <FormSection title="Información académica y socioeconómica">
              <FormSelect v-model="form.nivelEducacion" label="Nivel de educación" placeholder="Selecciona nivel" help="Último grado o título alcanzado." :options="opcionesNivelEducacion" required />
              <FormInput v-model="form.ocupacion" label="Ocupación" placeholder="Ocupación actual" help="Actividad laboral o dedicación actual." required />
              <FormInput v-model="form.empresa" label="Empresa donde trabaja" placeholder="Nombre de la empresa" help="Lugar de trabajo si aplica." />
              <FormSelect v-model="form.estrato" label="Estrato" placeholder="Selecciona estrato" help="Estrato socioeconómico de vivienda." :options="opcionesEstrato" required />
              <FormSelect v-model="form.regimenSalud" label="Régimen de salud" placeholder="Selecciona régimen" help="EPS o régimen contributivo/subsidiado." :options="opcionesRegimenSalud" required />
            </FormSection>

            <FormSection title="Información médica">
              <FormSelect v-model="form.enfermedadPrioritaria" label="¿Sufre alguna enfermedad de atención prioritaria?" placeholder="Selecciona opción" help="Condiciones que requieren seguimiento médico prioritario." :options="opcionesSiNo" required />
              <FormSelect v-model="form.discapacidad" label="¿Tiene alguna discapacidad?" placeholder="Selecciona opción" help="Declaración para apoyos de inclusión." :options="opcionesSiNo" required />
            </FormSection>

            <FormSection title="Información del curso">
              <FormSelect v-model="form.curso" label="Curso/Técnica" placeholder="Selecciona un curso" help="Programa al que se matricula." :options="opcionesCurso" required />
              <FormSelect v-model="form.horario" label="Horario" placeholder="Selecciona horario" help="Jornada o franja del grupo elegido." :options="opcionesHorario" required />
              <FormInput v-model="form.fechaIniciacion" label="Fecha de iniciación de clase" type="date" help="Fecha prevista de inicio de clases." required />
              <FormSelect v-model="form.conocimientoCurso" label="¿Tiene conocimiento del curso que va a realizar?" placeholder="Selecciona opción" help="Experiencia previa en la temática del programa." :options="opcionesSiNo" required />
              <FormSelect v-model="form.comoSeEntero" label="¿Cómo se enteró del curso/técnico?" placeholder="Selecciona opción" help="Canal de captación o referido." :options="opcionesComoSeEntero" required />
              <FormInput v-model="form.valorCuota" label="Valor costo" placeholder="$0" help="Valor de referencia o cuota informada en matrícula." />
            </FormSection>

            <FormSection title="Overol/Botas">
              <p class="mb-2 text-sm text-slate-500 md:col-span-2">
                (No aplica para soldadura)
              </p>
              <FormSelect v-model="form.tallaOverol" label="Talla Overol" placeholder="Selecciona talla" help="Talla de dotación de overol." :options="opcionesTalla" />
              <FormInput v-model="form.tallaBotas" label="Talla Botas" placeholder="Ej: 38" help="Talla de calzado de seguridad si aplica." />
            </FormSection>

            <FormSection title="Persona de contacto en caso de emergencia">
              <FormInput v-model="form.contactoNombre" label="Nombre completo de persona de contacto" placeholder="Nombre completo" help="Familiar o acudiente a contactar en urgencias." required span="full" />
              <FormInput v-model="form.contactoTelefono" label="Teléfono persona de contacto" type="tel" placeholder="3001234567" help="Teléfono del contacto de emergencia." required />
              <FormInput v-model="form.contactoCorreo" label="Correo electrónico persona de contacto" type="email" placeholder="contacto@ejemplo.com" help="Correo opcional del contacto de emergencia." />
            </FormSection>

            <FormSection title="Aprobaciones y documentos">
              <FormSelect v-model="form.aprobacionImagen" label="Aprobación uso de imagen" placeholder="Selecciona opción" help="Autorización para fotos o video en actividades." :options="opcionesSiNo" required />
              <FormInput v-model="form.nombreAsistente" label="Nombre asistente (Quien realiza la matrícula)" placeholder="Nombre del asistente" help="Persona que diligencia el formulario si no es el estudiante." required />
            </FormSection>

            <FormSection title="Multiculturalidad">
              <FormSelect v-model="form.caracterizacionEspecial" label="Caracterización especial" placeholder="Selecciona una opción" help="Etnia, comunidad u otra caracterización para políticas de inclusión." :options="opcionesCaracterizacion" span="full" />
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
                help="Foto tipo documento para carnet o expediente."
              />
              <FormFileUpload
                v-model="form.huellaEstudiante"
                label="Huella del estudiante"
                description="Captura o sube la huella del estudiante"
                upload-label="Subir archivo"
                accept="image/*"
                help="Archivo o captura de huella si el proceso lo exige."
              />
            </FormSection>

            <FormSection title="Observaciones" layout="custom">
              <FormTextarea
                v-model="form.observaciones"
                label="Observaciones"
                placeholder="Notas adicionales sobre la matrícula"
                help="Notas libres para secretaría o bienestar."
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
