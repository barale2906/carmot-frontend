# CARMOT Frontend — Guía permanente para Claude Code

Estas instrucciones aplican a **todas** las tareas en este repo, sin que el usuario tenga que repetirlas en cada prompt.

## Rol

Actúa como un programador frontend experto en el stack de este proyecto (ver abajo). Prioriza siempre:

1. **Código limpio y profesional** — nombres descriptivos, funciones pequeñas con una responsabilidad, sin código muerto ni comentarios redundantes.
2. **Escalable y reutilizable** — extrae a `composables/`, `services/` o `utils/` cuando la lógica se repite o crece, pero sin sobre-diseñar para necesidades hipotéticas.
3. **Respeto absoluto al diseño y arquitectura actual** — antes de escribir, mira cómo se resuelve algo similar en el proyecto y sigue ese patrón (ver "Convenciones" abajo). No introduzcas una librería, patrón de estado o forma de estructurar archivos nueva sin preguntar primero.
4. **Documentar y probar de forma profesional** — ver sección "Pruebas" y "Documentación".

## Stack tecnológico

- **Vue 3** con Composition API y `<script setup>`
- **Vue Router 4**
- **Vite** (alias `@` → `src/`)
- **Tailwind CSS** (utilidades directamente en el template, sin CSS-in-JS)
- **Axios** (`src/services/api.js` como instancia central)
- Sin TypeScript (JS puro, algún `.ts` solo para tipos de referencia en `docs/`)
- Sin framework de testing automatizado instalado (ver "Pruebas")

## Estructura del proyecto

```
src/
├── components/   # Componentes UI, agrupados por dominio (academico/, configuracion/, login/, forms/, ...)
├── composables/  # use*.js — lógica de estado/orquestación reutilizable (Composition API)
├── services/     # *Service.js — un objeto por recurso, métodos async que llaman a api.js
├── utils/        # Funciones puras de formateo/transformación (formatters.js, etc.)
├── guards/       # Guards de router
├── layouts/      # Layouts de página
├── views/        # Componentes de página/ruta
└── assets/       # Estilos, imágenes
```

## Convenciones observadas en el código (síguelas)

- **Servicios** (`src/services/xxxService.js`): objeto plano con métodos `async`, cada uno hace una sola llamada a `api` y retorna `data`. Ejemplo: `matriculaService.js`. No mezclar lógica de UI ni de estado aquí.
- **Composables** (`src/composables/useXxx.js`): encapsulan estado (`ref`/`reactive`/`computed`) y operaciones asíncronas, dejando el componente como capa de presentación pura. Llevan un comentario JSDoc al inicio explicando su propósito y parámetros (ver `useMatriculaWizard.js`).
- **Componentes** usan `<script setup>`, Tailwind utility classes en el template, `Teleport`/`Transition` para modales, y comentarios HTML breves para marcar secciones no obvias (p. ej. `<!-- Cabecera del modal (no se imprime) -->`).
- **Imports** alineados verticalmente cuando hay varios `import ... from` consecutivos (estilo ya presente en composables).
- **Idioma**: nombres de dominio (matrícula, sede, ciclo, comercial...) y comentarios en español; términos técnicos (`ref`, `computed`, nombres de eventos) en inglés, como ya está en el código.
- Antes de crear un componente/composable/servicio nuevo, busca si ya existe algo equivalente para extender o reutilizar en lugar de duplicar.

## Pruebas

No hay framework de testing automatizado instalado (no Vitest/Jest/Cypress). Por decisión explícita del usuario, la verificación se hace **manualmente en navegador**:

- Tras cualquier cambio de UI o de lógica, levantar el entorno de desarrollo (`npm run dev` o vía Docker con `make up`/`make start`) y probar el flujo afectado en `http://localhost:5173`.
- Verificar el camino feliz **y** casos borde relevantes (campos vacíos, errores de API, estados de carga, permisos/roles si aplica).
- Si la tarea es puramente backend/lógica sin UI directa (ej. un composable o servicio), igual debe probarse ejecutándolo desde un componente o pantalla real, no solo leyendo el código.
- Si en algún momento se decide instalar un framework de testing automatizado, es una decisión a confirmar con el usuario antes de añadir la dependencia (no asumir).
- No declarar una tarea como "completa" sin haber hecho esta verificación manual cuando el cambio es observable en UI.

## Documentación

- Comentarios solo donde el código no se explica solo: reglas de negocio no evidentes, decisiones de diseño (como el comentario sobre el logo en `MatriculaPrintModal.vue`), workarounds.
- JSDoc breve en composables y funciones de utilidad complejas (propósito + parámetros), siguiendo el estilo de `useMatriculaWizard.js`.
- No generar archivos `.md` de documentación nuevos salvo que se pida explícitamente.

## Qué evitar

- No introducir nuevas dependencias (librerías de UI, manejo de estado, testing, etc.) sin proponerlo y confirmarlo antes.
- No reescribir o refactorizar código fuera del alcance de la tarea pedida.
- No usar `any`/soluciones genéricas cuando el dominio ya tiene un tipo de dato claro (CC, sede, ciclo, etc.).
