# Centro de Capacitaciones CARMOT - Frontend

Aplicación web desarrollada con Vue 3 para el Centro de Capacitaciones CARMOT.

## 🚀 Tecnologías

- Vue 3 (Composition API)
- Vue Router 4
- Vite
- Axios (para consumo de API REST)

## 📦 Instalación

```bash
npm install
```

## 🛠️ Desarrollo

### Sin Docker (requiere Node.js instalado)

```bash
npm run dev
```

La aplicación se abrirá en `http://localhost:5173`

### Con Docker (recomendado según la guía)

No necesitas instalar Node.js en tu sistema. Todo corre dentro de contenedores.

**Primera vez o tras cambios en Docker:**

```bash
make up
```

La primera vez el contenedor instalará las dependencias automáticamente. Si añades dependencias a `package.json`, ejecuta `make npm install` y reinicia con `make restart`.

**Flujo diario (recomendado):**

- **Fin del día:** `make stop` — detiene contenedores sin borrar datos.
- **Inicio del día:** `make start` — arranca contenedores y muestra la URL.

**Otros comandos:**

```bash
make npm install    # Instalar dependencias dentro del contenedor
make vue            # Acceder al contenedor Vue (bash)
make logs           # Ver logs del servidor de desarrollo
make down           # Detener y eliminar contenedores (solo cuando haga falta)
```

**Acceso:** http://localhost:5173

## 🏗️ Build

```bash
npm run build
```

## 📱 Características

- Diseño responsive
- Interfaz moderna y futurista
- Integración con API REST
- Sistema de autenticación

## 📁 Estructura del Proyecto

```
carmot-frontend/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css
│   ├── views/
│   │   └── Login.vue
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```


