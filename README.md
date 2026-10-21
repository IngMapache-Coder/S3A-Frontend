# S3A Frontend — Portal Web del Sistema de Asistencia Digital "Amigo Académico"

Aplicación web Single Page Application (SPA) desarrollada en **React 19**, **TypeScript** y **Vite**, optimizada para su despliegue en **Cloudflare Pages**.

Ofrece la interfaz de usuario para el programa **Amigo Académico** (UFPS), permitiendo la proyección de códigos QR de sala compartida, firma digital manuscrita en celulares de estudiantes, auditoría en tiempo real y generación institucional de reportes en Excel (`.xlsx`) con firmas gráficas incrustadas.

---

## 🛠️ Stack Tecnológico

- **Librería UI:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/).
- **Entorno y Empaquetador:** [Vite](https://vitejs.dev/) (Configurado con HMR y proxy reverso hacia el backend local).
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Diseño adaptativo para móviles, tablets y pantallas de sala con paleta institucional UFPS).
- **Iconos:** [`@heroicons/react`](https://heroicons.com/).
- **Generación de QR:** [`qrcode.react`](https://www.npmjs.com/package/qrcode.react) (Proyección en alta resolución del QR dinámico de sala).
- **Motor de Excel:** [`exceljs`](https://www.npmjs.com/package/exceljs) (Generación cliente de libros `.xlsx` con celdas tipadas, estilos institucionales y firmas incrustadas como imágenes PNG).
- **Signature Pad:** Canvas HTML5 nativo con captura de trazos manuscritos en tinta negra institucional (`#000000`).

---

## 📁 Estructura del Repositorio

```text
S3A-Frontend/
├── public/
│   ├── _headers                # Cabeceras de seguridad y caché para Cloudflare Pages
│   └── _redirects              # Proxy de API al worker del backend y enrutamiento SPA
├── src/
│   ├── main.tsx                # Entrada raíz de la aplicación React
│   ├── index.css               # Estilos globales y directivas de Tailwind CSS
│   ├── App.tsx                 # Enrutador principal, detección de modo estudiante y gestión de sesión
│   ├── api/
│   │   └── client.ts           # Cliente HTTP, tipado de entidades y almacenamiento de token en localStorage
│   ├── components/
│   │   ├── Navbar.tsx          # Barra superior institucional y perfil de usuario
│   │   ├── Sidebar.tsx         # Navegación lateral adaptativa según rol
│   │   └── CambioPasswordObligatorio.tsx  # Interceptor modal para forzar actualización de contraseña
│   ├── utils/
│   │   ├── date.ts             # Utilidades de fecha y hora en zona horaria Colombia (America/Bogota)
│   │   └── excelExport.ts      # Generador de hojas de cálculo con incrustación de firmas digitales
│   └── views/
│       ├── LoginView.tsx       # Inicio de sesión institucional
│       ├── TutorSalaView.tsx   # Sala de asesorías: apertura de sesión, proyección QR y asistencias en vivo
│       ├── EstudianteFirmaView.tsx # Formulario móvil para que el estudiante registre sus datos y firme
│       ├── TutoresView.tsx     # Administración y aprovisionamiento de Directores y Amigos Académicos
│       ├── MateriasView.tsx    # Catálogo de asignaturas de la carrera
│       ├── ReportesView.tsx    # Consulta de asistencias, visualización de firmas y exportación masiva
│       └── PerfilView.tsx      # Datos del usuario y actualización de credenciales
├── index.html                  # Plantilla HTML principal con favicon SVG institucional
├── vite.config.ts              # Configuración de Vite y proxy local al backend (puerto 8787)
├── tsconfig.json               # Configuración TypeScript base
├── tsconfig.app.json           # Configuración TypeScript de la aplicación
├── tsconfig.node.json          # Configuración TypeScript para Vite
└── package.json                # Scripts y dependencias del frontend
```

---

## 📱 Módulos y Flujos de Usuario

### 1. Sala Compartida de Asesoría (`TutorSalaView`)
- Visualiza si existe una sesión activa en la sala compartida.
- Si no está activa, cualquier Amigo Académico en turno puede **iniciar la sesión**.
- Proyecta en pantalla gigante el **Código QR único** y el código corto alfanumérico (ej: `A3K9`).
- Muestra en tiempo real la tabla de alumnos que van registrando su firma durante el turno.
- Permite exportar la lista de la sala a Excel al instante y **cerrar la sesión** al terminar el turno.

### 2. Registro y Firma del Estudiante (`EstudianteFirmaView`)
- Flujo público optimizado para dispositivos móviles, sin necesidad de cuenta.
- El estudiante escanea el QR de la sala o accede mediante enlace `?codigo=XXXX`.
- Formulario de registro:
  - Selector interactivo de materia con filtro de búsqueda.
  - Motivo o tema de la asesoría.
  - Nombre completo y código universitario.
  - Pad táctil para firma manuscrita en tinta negra con botón de limpiar y confirmación.

### 3. Reportes y Auditoría (`ReportesView`)
- Filtros por fechas y materias para Directores de Programa y Administradores.
- Vista previa de la firma manuscrita de cada estudiante.
- **Exportación a Excel institucional (`.xlsx`):**
  - Genera las 8 columnas reglamentarias: `N° Registro`, `Código Materia`, `Nombre Materia`, `Nombre y Apellido Estudiante`, `Código Estudiante`, `Temas / Motivo`, `Fecha y Hora (Colombia)`, `Firma`.
  - Descarga las imágenes de las firmas desde el bucket y las incrusta ajustadas dentro de la celda de cada fila.

### 4. Gestión de Cuentas y Materias (`TutoresView` & `MateriasView`)
- Aprovisionamiento de Directores y Amigos Académicos sin registro público abierto.
- Manejo del catálogo institucional de asignaturas.
- Intercepción obligatoria de cambio de contraseña en el primer inicio de sesión.

---

## ⚙️ Configuración y Variables de Entorno

### Configuración en local (`vite.config.ts`)
Durante el desarrollo local, Vite reenvía las rutas de la API al backend en `http://localhost:8787` de manera transparente:

```typescript
// vite.config.ts
proxy: {
  '/auth':        { target: 'http://localhost:8787', changeOrigin: true },
  '/usuarios':    { target: 'http://localhost:8787', changeOrigin: true },
  '/materias':    { target: 'http://localhost:8787', changeOrigin: true },
  '/sesiones':    { target: 'http://localhost:8787', changeOrigin: true },
  '/asistencias': { target: 'http://localhost:8787', changeOrigin: true },
  '/firmas':      { target: 'http://localhost:8787', changeOrigin: true },
  '/reportes':    { target: 'http://localhost:8787', changeOrigin: true },
}
```

### Variables de entorno (Opcional)
Si se desea apuntar a una URL externa en lugar de usar proxy o rutas relativas, cree un archivo `.env`:

```env
VITE_API_URL=https://backend.amigoacademicoufps.workers.dev
```

*(Si se deja vacío, consumirá rutas relativas, lo cual es ideal con `public/_redirects` en Cloudflare Pages).*

---

## 💻 Comandos de Desarrollo

```bash
# 1. Instalar dependencias
pnpm install

# 2. Iniciar servidor de desarrollo en http://localhost:3000
pnpm run dev

# 3. Validar código con linter
pnpm run lint

# 4. Compilar la aplicación para producción (genera carpeta /dist)
pnpm run build

# 5. Previsualizar la compilación de producción localmente
pnpm run preview
```

---

## 🚀 Despliegue en Cloudflare Pages

El frontend está optimizado para desplegarse como Single Page Application (SPA):

- `public/_redirects`: Redirige las rutas de la API al Worker de producción y asegura que cualquier ruta profunda de la SPA retorne `index.html` (evitando errores 404).
- `public/_headers`: Aplica cabeceras de seguridad (`SAMEORIGIN`, `nosniff`, `strict-origin-when-cross-origin`) y caché inmutable de 1 año para archivos compilados en `/assets/*`.

### 1. Despliegue Automático Continuo (CI/CD con GitHub Actions)
Cada vez que se hace `git push` o merge hacia la rama `main`, el workflow [deploy.yml](.github/workflows/deploy.yml) compila los assets y despliega la SPA automáticamente en Cloudflare Pages (`s3a-frontend`).

Para que el workflow funcione, configura estos **Secrets** en tu repositorio de GitHub (**Settings > Secrets and variables > Actions > Repository secrets**):

| Secret | Descripción |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token de API de Cloudflare con permisos de edición para Cloudflare Pages. |
| `CLOUDFLARE_ACCOUNT_ID` | ID de tu cuenta de Cloudflare (visible en la URL o barra lateral del Dashboard). |

### 2. Despliegue Manual desde la Terminal
```bash
pnpm run deploy
```

### 3. Conexión Directa en el panel web de Cloudflare Pages (Alternativa)
Si vinculas el repositorio de GitHub directamente desde el panel de Cloudflare Pages:
- **Framework preset:** `Vite`
- **Build command:** `pnpm run build`
- **Build output directory:** `dist`
- **Node.js version:** `20` o superior
