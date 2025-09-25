# Sistema de Cultivo de Conchas de Abanico

Sistema integral para la gestión de cultivo de conchas de abanico en Piura-Sechura. Aplicación frontend construida con React + Vite.

## 🚀 Características

- **Dashboard de Maricultor**: Vista principal con métricas de sectores, lotes y mortalidad
- **Gestión de Sectores**: Administración de sectores de cultivo y lotes
- **Sistema de Autenticación**: Login con roles (Administrador/Maricultor)
- **Mock API Realista**: Simulación de API con latencia, errores y persistencia
- **Arquitectura Modular**: Componentes reutilizables y stores con Zustand
- **Diseño Responsivo**: UI moderna con Tailwind CSS
- **Motor de Métricas**: Cálculos solo con datos disponibles

## 📋 Requisitos

- **Node.js**: 22.14.0 (exacto)
- **npm**: 10.9.2 (exacto)

## 🛠️ Instalación

```bash
# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias (versiones exactas)
npm install

# Iniciar servidor de desarrollo
npm start
```

El servidor se ejecutará en: http://localhost:3000

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── common/         # Componentes comunes (EmptyState, LoadingSpinner, StatCard)
│   │   ├── layout/         # Layout (Header, Sidebar)
│   │   └── features/       # Componentes específicos de funcionalidad
│   ├── pages/              # Páginas principales
│   │   ├── auth/           # Páginas de autenticación
│   │   ├── maricultor/     # Páginas del maricultor
│   │   └── admin/          # Páginas del administrador
│   ├── stores/             # Estados globales con Zustand
│   ├── services/           # Servicios y Mock API
│   │   └── mock/           # API simulada
│   │       ├── schemas/    # Esquemas de validación
│   │       ├── server.js   # Servidor mock con latencia y errores
│   │       ├── db.js       # Capa de persistencia (localStorage)
│   │       └── seeder.js   # Generador de datos iniciales
│   ├── utils/              # Utilidades (metrics.js)
│   ├── constants/          # Constantes y textos UI
│   ├── hooks/              # Custom hooks
│   └── styles/             # Estilos CSS
└── public/                 # Assets estáticos
```

## 🔧 Scripts Disponibles

```bash
npm start    # Iniciar servidor de desarrollo (puerto 3000)
npm build    # Construir para producción
npm preview  # Vista previa de build de producción
```

## 🎮 Datos de Prueba

El sistema incluye datos iniciales generados automáticamente:

### Usuarios de Prueba
- **Admin**: admin@conchas.com / password123
- **Maricultor 1**: maricultor1@conchas.com / password123

### Datos Generados
- 2 usuarios (1 admin, 1 maricultor)
- 6 sectores (3 por maricultor)
- 6 lotes (1 por sector)
- 180 registros de monitoreo (30 días por lote)

## 🔍 Funcionalidades Implementadas

### ✅ Completadas
- [x] Sistema de autenticación con roles
- [x] Dashboard con métricas calculadas dinámicamente
- [x] Gestión completa de sectores y lotes
- [x] Mock API con validaciones y persistencia
- [x] Motor de métricas con validación de datos
- [x] Estados vacíos y manejo de errores
- [x] UI responsive con Tailwind CSS
- [x] Stores de estado con Zustand
- [x] Componentes reutilizables

### 🚧 En Desarrollo (Placeholders)
- [ ] Sistema de monitoreo de parámetros
- [ ] Gestión de cosechas
- [ ] Control de inventario
- [ ] Generación de reportes PDF
- [ ] Panel de administrador
- [ ] Análisis de calidad de agua

## 🔒 Política Anti-Hardcodeo

**OBLIGATORIO**: El proyecto sigue estrictas políticas anti-hardcodeo:

- ❌ **Prohibido**: Arrays fijos, métricas inventadas, datos hardcodeados en componentes
- ✅ **Requerido**: Todos los datos desde stores, servicios o constantes
- ✅ **Fuente única**: Textos desde `src/constants/ui.js`
- ✅ **Mock datos**: Generados por seeder reutilizable

## 📊 Motor de Métricas

El sistema incluye un motor inteligente de métricas (`src/utils/metrics.js`) que:

- Verifica disponibilidad de datos antes de calcular
- Retorna estado `insufficient-data` cuando faltan campos
- Calcula únicamente métricas basadas en leer.md
- Proporciona mensajes explicativos sobre datos faltantes

### Métricas Disponibles
- **mortality-rate**: Tasa de mortalidad por lotes
- **growth-rate**: Tasa de crecimiento por registros de monitoreo
- **sector-summary**: Resumen general de sectores
- **water-quality**: Promedio de parámetros de calidad

## 🎯 Mock API

### Características
- **Latencia Simulada**: 100-600ms aleatoria
- **Tasa de Error**: 10% configurable
- **Persistencia**: localStorage con namespace `conchas-abanico:*`
- **Validaciones**: Esquemas con reglas de negocio
- **Paginación**: Soporte completo
- **Estados HTTP**: 400, 404, 409, 500

### Endpoints Principales
```
GET /users         # Lista de usuarios (admin)
POST /auth/login   # Autenticación
POST /auth/register # Registro de usuarios
GET /sectors       # Sectores por usuario
POST /sectors      # Crear sector
POST /lots         # Crear lote
GET /monitoring    # Registros de monitoreo
POST /monitoring   # Crear registro
```

## 🧪 Checklist de Calidad

### ✅ Verificaciones Técnicas
- [x] Sin hardcode en componentes UI
- [x] Stores como única fuente de datos
- [x] Reportes solo con datos disponibles
- [x] Estados vacíos y errores manejados
- [x] Dashboard reactivo a filtros
- [x] Validaciones basadas en esquemas
- [x] Sin warnings de compilación
- [x] Rutas compatibles Windows/Linux

### ✅ Verificaciones UX/UI
- [x] Diseño responsive (móvil/tablet/desktop)
- [x] Loading states en operaciones asíncronas
- [x] Feedback visual en acciones
- [x] Navegación intuitiva
- [x] Mensajes de error descriptivos
- [x] Confirmaciones en acciones críticas

## 🚀 Despliegue

```bash
# Construir para producción
npm run build

# Los archivos se generarán en dist/
# Servir con cualquier servidor web estático
```

## 🔧 Personalización

### Agregar Nueva Métrica
1. Definir función en `src/utils/metrics.js`
2. Validar campos requeridos
3. Retornar estructura estándar con status
4. Usar desde componentes vía stores

### Agregar Nueva Entidad
1. Crear esquema en `src/services/mock/schemas/`
2. Agregar endpoints en `src/services/mock/server.js`
3. Actualizar seeder en `src/services/mock/seeder.js`
4. Crear store correspondiente
5. Implementar componentes UI

## ⚠️ Limitaciones Conocidas

- **Solo Frontend**: No incluye backend real
- **Datos Mock**: Simulación en localStorage
- **Funcionalidades**: Algunos módulos son placeholders
- **Persistencia**: Los datos se pierden al limpiar navegador

## 📞 Soporte

Para problemas técnicos:
1. Verificar versiones exactas de Node.js y npm
2. Limpiar cache: `npm cache clean --force`
3. Reinstalar dependencias: `rm -rf node_modules && npm install`
4. Verificar datos seed: Abrir DevTools > Application > localStorage

## 🏗️ Decisiones Técnicas

- **React 18.3.1**: Componentes funcionales con hooks
- **Vite 5.4.0**: Build tool moderno y rápido
- **Zustand 4.5.0**: Estado global simple y eficiente
- **Tailwind CSS**: Diseño utilitario y responsive
- **SweetAlert2**: Alertas modernas y accesibles
- **localStorage**: Persistencia simple para mock