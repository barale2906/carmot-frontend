---
name: tests
description: Guía para generar, ajustar y ejecutar tests en carmot-frontend. Úsala cuando: crees un nuevo service/composable/guard/util, modifiques la interfaz de uno existente, o necesites verificar que los tests están al día.
---

# Tests en carmot-frontend

## Stack y ubicación

- **Framework:** Vitest 2 + @vue/test-utils + jsdom
- **Directorio:** `src/__tests__/` — espeja la estructura de `src/`
- **Comandos:**
  - `make test-run` — una pasada completa (no requiere contenedor previo)
  - `make test` — modo watch (requiere `make start` antes)
  - `make test-coverage` — genera reporte HTML en `coverage/`

## Cuándo generar o ajustar tests

| Situación | Acción |
|-----------|--------|
| Nuevo `*Service.js` | Crear `src/__tests__/services/<nombre>.test.js` |
| Nuevo `use*.js` (composable) | Crear `src/__tests__/composables/<nombre>.test.js` |
| Nueva función en `utils/` | Añadir casos en el test de utils correspondiente |
| Nuevo guard en `guards/` | Añadir casos en `src/__tests__/guards/menuGuards.test.js` o crear nuevo archivo |
| Cambio de interfaz (parámetros, respuesta) | Actualizar los tests afectados antes de declarar la tarea terminada |

## Patrones obligatorios

### Services
Mockear siempre `@/services/api.js`:
```js
vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
import api from '@/services/api.js'
// En cada test: api.get.mockResolvedValue({ data: ... })
// En beforeEach: vi.clearAllMocks()
```

### Composables
- Sin lifecycle hooks → llamar el composable directamente.
- Con `onMounted`/`onErrorCaptured`/etc. → usar `withSetup` de `src/__tests__/helpers.js`:
```js
import { withSetup } from '../helpers.js'
const [result, unmount] = withSetup(() => useAlgo())
// ... aserciones ...
unmount()
```

### Guards
Mockear `authService` y `menuService` con sus métodos relevantes, usar `vi.fn()` para `next`.

### Singletons (useNotification)
Limpiar el estado en `beforeEach`:
```js
beforeEach(() => { notif.notifications.splice(0) })
```

## Reglas de calidad

1. **Siempre verificar:** camino feliz + caso de error/fallback + edge cases obvios (null, vacío, undefined).
2. **No hacer aserciones frágiles** sobre formato exacto de moneda o fecha — verificar estructura, no string literal.
3. **`vi.clearAllMocks()` en `beforeEach`** en todos los archivos que usen mocks.
4. **Los tests no deben depender entre sí** — cada `it()` parte de estado limpio.
5. **Después de cualquier cambio en `src/`**, correr `make test-run` y confirmar que todos pasan antes de declarar la tarea terminada.

## Cómo ejecutar manualmente

```bash
# Una sola pasada (el más común tras un cambio)
make test-run

# Si el contenedor ya está activo, modo interactivo:
make test
```

Si el contenedor no está activo, `make test-run` lo levanta temporalmente, corre los tests y lo detiene.
