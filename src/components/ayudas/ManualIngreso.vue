<template>
  <div class="space-y-6">

    <AyudaSeccion id="ing-pantalla" numero="1" titulo="La pantalla de ingreso">
      <p>
        Es lo primero que ve al abrir el sistema. Solo tiene dos datos para llenar y un botón.
      </p>
      <AyudaCaptura
        :src="capturaLogin"
        alt="Pantalla de inicio de sesión de CARMOT con los campos Usuario y Contraseña"
        :marcas="[
          { x: 40.2, y: 60.1, titulo: 'Ayuda del campo', texto: 'Pase el mouse sobre el signo de pregunta para ver una explicación corta.' },
          { x: 50, y: 64.6, titulo: 'Usuario', texto: 'Su correo institucional o el usuario que le asignaron.' },
          { x: 50, y: 74.6, titulo: 'Contraseña', texto: 'Su clave personal. Se muestra con puntos por seguridad.' },
          { x: 50, y: 81.1, titulo: 'Ingresar', texto: 'Envía los datos. Mientras valida, el botón muestra un círculo girando.' }
        ]"
      />
    </AyudaSeccion>

    <AyudaSeccion id="ing-pasos" numero="2" titulo="Ingresar paso a paso">
      <AyudaPasos
        :pasos="[
          { titulo: 'Escriba su usuario en el campo «Usuario».' },
          { titulo: 'Escriba su contraseña en el campo «Contraseña».' },
          { titulo: 'Pulse «Ingresar» o presione la tecla Enter.', texto: 'Si los datos son correctos, entra directamente al tablero principal.' }
        ]"
      />
      <p class="text-slate-600">
        El botón que debe pulsar se ve así: <AyudaBoton>Ingresar</AyudaBoton>
      </p>
    </AyudaSeccion>

    <AyudaSeccion id="ing-error" numero="3" titulo="Si los datos no son correctos">
      <p>El sistema no lo deja entrar y le avisa de dos formas al mismo tiempo:</p>
      <AyudaCaptura
        :src="capturaError"
        alt="Pantalla de inicio de sesión mostrando el aviso de credenciales incorrectas"
        :marcas="[
          { x: 86.3, y: 8.1, titulo: 'Aviso emergente «Datos inválidos»', texto: 'Aparece arriba a la derecha y se cierra solo después de unos segundos.' },
          { x: 50, y: 62.9, titulo: 'Campo marcado en rojo', texto: 'Indica cuál dato debe revisar.' },
          { x: 50, y: 67.4, titulo: 'Mensaje del error', texto: 'Explica qué pasó; en este caso, el usuario o la contraseña no coinciden.' }
        ]"
      />
      <AyudaNota tipo="consejo">
        Revise que no tenga activada la tecla <strong>Bloq Mayús</strong> y que el correo no tenga espacios al inicio o al final.
      </AyudaNota>
      <AyudaNota tipo="atencion" titulo="¿Olvidó su contraseña?">
        Comuníquese con el administrador del sistema para que se la restablezca. No comparta su clave con otras personas.
      </AyudaNota>
    </AyudaSeccion>

  </div>
</template>

<script setup>
import AyudaSeccion from './AyudaSeccion.vue'
import AyudaCaptura from './AyudaCaptura.vue'
import AyudaPasos   from './AyudaPasos.vue'
import AyudaBoton   from './AyudaBoton.vue'
import AyudaNota    from './AyudaNota.vue'
import capturaLogin from '@/assets/images/ayudas/ingreso/login.png'
import capturaError from '@/assets/images/ayudas/ingreso/login-error.png'
</script>
