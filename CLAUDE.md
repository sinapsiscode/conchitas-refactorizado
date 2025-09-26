# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

> **⚠️ ADVERTENCIA CRÍTICA**: Este frontend está **EXTREMADAMENTE HARDCODEADO** y **NO ES ESCALABLE**. Fue creado como prototipo/demo pero tiene serias limitaciones para producción.

## Descripción General del Proyecto

Sistema de gestión para cultivo de conchas de abanico en Piura-Sechura. Frontend construido con React + Vite que funciona **SOLO con Mock API y localStorage**.

### 🚨 PROBLEMAS CRÍTICOS DEL PROYECTO

#### 1. **Hardcodeo Extremo**
- **MockAPI hardcodeada en TODOS los stores** (21+ archivos)
- **localStorage como única "base de datos"** con namespace fijo `conchas-abanico:`
- **Sin variables de entorno** para endpoints de API
- **Puerto hardcodeado** (3000) en vite.config.js
- **Datos de prueba hardcodeados** en el seeder

#### 2. **Imposible de Escalar**
- **Sin abstracción de API**: MockAPI está directamente importada en cada store
- **Acoplamiento extremo**: Los stores dependen directamente de MockAPI
- **Sin capa de servicios real**: No hay separación entre lógica de negocio y API
- **localStorage limitado**: Máximo ~10MB de datos
- **Sin paginación real**: Todo se carga en memoria

#### 3. **Imposible Integrar Backend Real**
- Requeriría reescribir TODOS los stores (12+ archivos)
- MockAPI está entrelazada con la lógica de validación
- Sin manejo de autenticación real (token es btoa de JSON)
- Sin manejo de errores HTTP reales
- Sin interceptores ni middleware

## Comandos de Desarrollo

```bash
# Navegar al directorio frontend (todos los comandos se ejecutan desde aquí)
cd frontend

# Instalar dependencias (versiones exactas - Node.js 22.14.0, npm 10.9.2)
npm install

# Iniciar servidor de desarrollo (puerto 3000)
npm start
# o
npm run dev

# Construir para producción
npm run build

# Vista previa del build de producción
npm run preview
```

## Arquitectura de Alto Nivel

### Sistema de Estado Global (Zustand)
El proyecto utiliza Zustand para gestión de estado con un patrón consistente:
- **Stores** (`src/stores/`): Cada entidad tiene su propio store
- **Patrón async**: Todos los stores siguen el mismo patrón para operaciones asíncronas
- **Estados de carga y error**: Cada store mantiene `loading`, `error`, y `data`
- **Comunicación con API**: Los stores llaman a MockAPI para todas las operaciones

### Sistema Mock API
Sistema completo de API simulada con características empresariales:
- **Server** (`src/services/mock/server.js`): Simula latencia (100-600ms) y errores configurables
- **Database** (`src/services/mock/db.js`): Persistencia en localStorage con namespace `conchas-abanico:`
- **Schemas** (`src/services/mock/schemas/`): Validación estricta y reglas de negocio
- **Seeder** (`src/services/mock/seeder.js`): Genera datos iniciales realistas al primer uso

### Arquitectura de Componentes
- **Sin React Router**: Navegación mediante estado `currentPage` en App.jsx (decisión de simplicidad)
- **Páginas por rol** (`src/pages/`):
  - `maricultor/`: Dashboard, Sectores, Siembras, Monitoreo, Cosechas, etc.
  - `investor/`: Dashboard, Inversiones, Herramientas, Reportes
  - `auth/`: Login y Registro
- **Componentes organizados por dominio** (`src/components/`):
  - `common/`: Modal, EmptyState, LoadingSpinner, StatCard - Reutilizables
  - `harvest/`: Gestión completa de cosechas con modales especializados
  - `sectors/`: BatteryManager, CultivationLineManager, LineManager
  - `investor/`: Calculadoras y herramientas de análisis especializadas
  - `seeding/`: SystemSelector, InvestorInvitation
  - `projections/`: Gestión de proyecciones y escenarios
  - `notifications/`: Centro de notificaciones con bell icon
  - `layout/`: Header, Sidebar totalmente responsivos

### Flujo de Datos
```
Acción Usuario → Store Method → MockAPI → Schema Validation →
localStorage → Store Update → Component Re-render
```

## Patrones Críticos del Proyecto

### ⚠️ Política Anti-Hardcodeo (IRÓNICAMENTE VIOLADA EN TODO EL PROYECTO)
```javascript
// ❌ PROHIBIDO
const sectors = ['Sector A', 'Sector B'] // NO hardcodear arrays
const mortality = 15.5 // NO hardcodear métricas
<h1>Dashboard</h1> // NO hardcodear textos

// ✅ CORRECTO
import { UI_TEXTS } from '@/constants/ui'
const sectors = useSectorStore(state => state.sectors)
const mortality = calculateMetrics(lots, 'mortality-rate')
<h1>{UI_TEXTS.dashboard.title}</h1>
```

### Motor de Métricas Inteligente
El sistema `src/utils/metrics.js` valida disponibilidad de datos:
```javascript
// Retorna estados específicos según datos disponibles
{
  status: 'success' | 'insufficient-data',
  missing: ['campos faltantes'],
  data: resultadosCalculados
}
```

### Patrón de Manejo de Errores
```javascript
// Patrón estándar en todos los stores
const fetchData = async () => {
  set({ loading: true, error: null })
  try {
    const response = await MockAPI.method()
    set({ data: response.data, loading: false })
    return { success: true }
  } catch (error) {
    set({ error: error.message, loading: false })
    return { success: false, error: error.message }
  }
}
```

## Modelo de Datos y Relaciones

### Jerarquía Principal
```
Usuario (maricultor/inversor/admin)
├── Sectores (áreas de cultivo - max 10 hectáreas)
│   ├── Baterías (A-Z, agrupaciones de líneas)
│   │   └── Líneas de Cultivo (A-1, A-2, etc)
│   │       └── Sistemas (100 por línea)
│   │           └── Pisos (10 por sistema)
│   └── Lotes (siembras específicas)
│       ├── Monitoreo (registros diarios)
│       ├── Cosechas (planificadas y ejecutadas)
│       └── Distribución (sistemas ocupados)
├── Gastos (operacionales/categorías)
├── Ingresos (ventas con detalles)
├── Inventario (insumos y movimientos)
├── Inversiones (participaciones de inversores)
└── Notificaciones (alertas del sistema)
```

### Entidades Clave
- **Sector**: Hasta 10 hectáreas, múltiples baterías
- **Batería**: Letra identificadora (A-Z), agrupa líneas
- **Línea de Cultivo**: 100 sistemas, 10 pisos por sistema
- **Lote**: Siembra con origen, cantidad, mortalidad, tallas
- **Monitoreo**: Parámetros diarios de calidad de agua y crecimiento

## Usuarios de Prueba

```javascript
// Administrador
email: admin@conchas.com
password: password123

// Maricultor (productor)
email: maricultor1@conchas.com
password: password123

// Inversor
email: investor1@conchas.com
password: password123
```

## ⚠️ ANTES DE DESARROLLAR - LEER ESTO

### 🔴 Este proyecto NO está listo para producción
**Si necesitas agregar funcionalidades para producción, considera:**
1. Crear una nueva rama para refactorización completa
2. Implementar una capa de servicios apropiada
3. Usar variables de entorno
4. Separar MockAPI de la lógica real

## Tareas Comunes de Desarrollo (Solo para Demo/Prototipo)

### Trabajar con el Código Hardcodeado Actual
1. **Localizar componente**: Los componentes están organizados por dominio en `src/components/[dominio]/`
2. **Seguir patrón existente**: Todos los componentes usan hooks y estado local cuando es apropiado
3. **Usar componentes comunes**: Modal, EmptyState, LoadingSpinner, StatCard
4. **Mantener simplicidad**: Evitar sobre-ingeniería, mantener lógica clara

### Agregar Nueva Entidad
1. Crear schema en `src/services/mock/schemas/[entidad].js`
2. Agregar validaciones y reglas de negocio
3. Implementar endpoints en `src/services/mock/server.js`
4. Actualizar seeder en `src/services/mock/seeder.js`
5. Crear store en `src/stores/[entidad]Store.js`
6. Implementar componentes UI siguiendo patrones existentes

### Modificar Vistas Existentes
1. **Identificar página**: En `src/pages/[rol]/[Página].jsx`
2. **Revisar componentes usados**: Ver imports y estructura
3. **Mantener consistencia visual**: Usar clases Tailwind existentes
4. **Preservar responsividad**: Probar en móvil, tablet y desktop

### Agregar Nueva Métrica
1. Definir en `src/utils/metrics.js`
2. Validar campos requeridos antes de calcular
3. Retornar estructura estándar con `status`
4. Consumir desde componentes vía stores

### Modificar Comportamiento Mock API
```javascript
// En src/services/mock/server.js
const API_DELAY_MIN = 100  // Latencia mínima
const API_DELAY_MAX = 600  // Latencia máxima
const ERROR_RATE = 0.1     // 10% de probabilidad de error
```

## Convenciones de Código

### Nomenclatura de Archivos
- Componentes React: `PascalCase.jsx`
- Stores: `camelCaseStore.js`
- Utils/Services: `camelCase.js`
- Constantes: archivos en `camelCase.js`, valores en `UPPER_SNAKE_CASE`

### Estructura de Componentes
```javascript
// Orden estándar de imports
import React from 'react'
import { useAuthStore } from '@/stores/authStore'
import { UI_TEXTS } from '@/constants/ui'
import EmptyState from '@/components/common/EmptyState'
```

### Validaciones y Esquemas
Todos los datos pasan por validación estricta:
```javascript
// Ejemplo de schema
export const validateSector = (data) => {
  const errors = []
  if (!data.name) errors.push('Nombre requerido')
  if (data.hectares > 10) errors.push('Máximo 10 hectáreas')
  return errors
}
```

## Funcionalidades "Implementadas" (Solo para Demo/Prototipo)

### ⚠️ Funcionales SOLO con MockAPI
- **Sistema de autenticación** con roles (maricultor/inversor/admin)
- **Gestión completa de sectores**: Baterías (A-Z) y líneas de cultivo
- **Sistema de siembras**: Creación de lotes con distribución en sistemas
- **Monitoreo detallado**: Por lote con parámetros de calidad
- **Gestión de cosechas**: Planificación, ejecución y resultados
- **Control de gastos e ingresos**: Categorización y seguimiento
- **Sistema de inventario**: Gestión de materiales y movimientos
- **Dashboard dinámico**: Métricas calculadas en tiempo real
- **Panel de inversores**: Herramientas de análisis y calculadoras
- **Sistema de notificaciones**: Centro de notificaciones integrado
- **Invitaciones a inversores**: Sistema completo de invitaciones
- **Mock API robusta**: Persistencia, validaciones, latencia simulada

### 🚧 Funcionalidades Simplificadas
- **Reportes**: Estructura implementada, exportación básica a PDF
- **Proyecciones**: Cálculos básicos de retorno de inversión
- **Herramientas de inversor**: Calculadoras funcionales pero básicas

### ⏳ Características Optimizadas
- **Interfaz responsiva**: Diseño móvil-first con Tailwind CSS
- **Estados de carga y vacíos**: Feedback visual consistente
- **Validación de datos**: Esquemas estrictos en toda la aplicación

## 🚫 Limitaciones CRÍTICAS del Proyecto

1. **IMPOSIBLE usar con backend real sin refactorización masiva**
2. **localStorage como única persistencia** (límite ~10MB)
3. **MockAPI hardcodeada en TODOS los stores**
4. **Sin variables de entorno ni configuración externa**
5. **Token de autenticación falso** (btoa de JSON)
6. **Sin manejo de errores HTTP reales**
7. **Sin paginación real** (todo en memoria)
8. **Datos volátiles** (se pierden al limpiar navegador)
9. **Puerto hardcodeado** (3000)
10. **Namespace hardcodeado** (`conchas-abanico:`)

## Debugging y Troubleshooting

### Ver datos en localStorage
```javascript
// En DevTools Console
Object.keys(localStorage)
  .filter(k => k.startsWith('conchas-abanico:'))
  .forEach(k => console.log(k, JSON.parse(localStorage[k])))
```

### Reiniciar datos
```javascript
// Limpiar y regenerar
localStorage.clear()
location.reload() // El seeder recreará los datos
```

### Logs del Mock API
El sistema incluye logs detallados en consola:
- 🔐 Auth: Operaciones de autenticación
- 📊 Sectors: Operaciones CRUD de sectores
- 🌊 Monitoring: Registros de monitoreo
- ⚠️ Validation: Errores de validación

## 🔴 DEUDA TÉCNICA MASIVA

### Problemas de Arquitectura
- **NO hay separación de responsabilidades**: MockAPI mezclada con lógica de negocio
- **Violación de DRY**: MockAPI importada en 21+ lugares diferentes
- **Acoplamiento extremo**: Cambiar a API real = reescribir todo
- **Sin abstracción de datos**: localStorage hardcodeado en todas partes
- **Sin configuración externa**: Todo está hardcodeado en el código

### Lo que se necesitaría para producción
1. **Capa de servicios real** separada de los stores
2. **Variables de entorno** para configuración
3. **Axios o Fetch** con interceptores
4. **Manejo de tokens JWT** real
5. **Error boundaries** para manejo de errores
6. **React Query o SWR** para cache y sincronización
7. **Reescribir TODOS los stores** para usar servicios reales

### Estimación de refactorización
- **Tiempo estimado**: 2-3 semanas mínimo
- **Archivos a modificar**: 50+ archivos
- **Riesgo**: ALTO - prácticamente reescribir la capa de datos
- **Recomendación**: Considerar reescribir desde cero con arquitectura apropiada