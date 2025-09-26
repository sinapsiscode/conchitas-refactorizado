# Guía de Migración: MockAPI a JSON Server

## 📋 Estado Actual

El proyecto actualmente está **extremadamente hardcodeado** con MockAPI y localStorage. Esta guía documenta el proceso de migración a una arquitectura escalable con json-server y axios.

## 🚀 Configuración Inicial

### 1. Instalación de Dependencias
```bash
npm install json-server axios concurrently --save-dev
```

### 2. Estructura de Archivos Creada
```
frontend/
├── db.json                          # Base de datos JSON Server
├── .env                             # Variables de entorno
├── src/
│   ├── services/
│   │   ├── api/
│   │   │   ├── config.js           # Configuración de axios
│   │   │   ├── baseService.js      # Servicio CRUD genérico
│   │   │   ├── authService.js      # Servicio de autenticación
│   │   │   └── index.js            # Exportación de todos los servicios
│   │   └── mock/                   # (Mantener temporalmente para rollback)
│   └── stores/
│       ├── authStore.js            # Store original (con MockAPI)
│       └── authStoreNew.js         # Store nuevo (con API real)
```

## 🔧 Cómo Ejecutar

### Desarrollo con JSON Server
```bash
# Opción 1: Ejecutar servidores por separado
npm run dev        # Frontend en http://localhost:3000
npm run server     # API en http://localhost:3001

# Opción 2: Ejecutar ambos a la vez
npm run dev:all
```

### Solo Frontend (modo anterior con MockAPI)
```bash
npm run dev
```

## 📝 Proceso de Migración Store por Store

### Ejemplo: Migrar authStore

#### 1. Store Original (authStore.js)
```javascript
// ❌ Acoplado a MockAPI
import { MockAPI } from '../services/mock/server.js'

const response = await MockAPI.authenticate(email, password)
```

#### 2. Store Migrado (authStoreNew.js)
```javascript
// ✅ Usa servicio de API abstraído
import { authService } from '../services/api'

const response = await authService.login(email, password)
```

#### 3. Para Cambiar al Nuevo Store
```javascript
// En App.jsx o donde se importe
// import { useAuthStore } from './stores/authStore'     // Viejo
import { useAuthStore } from './stores/authStoreNew'     // Nuevo
```

## 🔄 Plan de Migración Completa

### Fase 1: Preparación ✅
- [x] Instalar json-server y axios
- [x] Crear estructura de servicios API
- [x] Configurar db.json inicial
- [x] Crear variables de entorno

### Fase 2: Migración de Stores (Por Hacer)
- [ ] authStore → authStoreNew
- [ ] sectorStore → sectorStoreNew
- [ ] monitoringStore → monitoringStoreNew
- [ ] harvestStore → harvestStoreNew
- [ ] expenseStore → expenseStoreNew
- [ ] incomeStore → incomeStoreNew
- [ ] inventoryStore → inventoryStoreNew
- [ ] investmentStore → investmentStoreNew
- [ ] notificationStore → notificationStoreNew
- [ ] seedOriginStore → seedOriginStoreNew
- [ ] projectionStore → projectionStoreNew

### Fase 3: Actualización de Componentes
- [ ] Actualizar imports en todos los componentes
- [ ] Probar cada funcionalidad
- [ ] Eliminar referencias a MockAPI

### Fase 4: Limpieza
- [ ] Eliminar archivos de MockAPI
- [ ] Eliminar stores antiguos
- [ ] Renombrar stores nuevos (quitar "New")
- [ ] Actualizar documentación

## 🎯 Ventajas de la Nueva Arquitectura

### Antes (MockAPI)
- ❌ MockAPI hardcodeada en 21+ archivos
- ❌ localStorage como única persistencia
- ❌ Sin configuración externa
- ❌ Imposible cambiar a API real sin reescribir todo

### Después (JSON Server + Axios)
- ✅ API REST real simulada
- ✅ Servicios abstraídos y reutilizables
- ✅ Configuración por variables de entorno
- ✅ Fácil migración a backend real (solo cambiar URL)
- ✅ Interceptores para auth y manejo de errores
- ✅ Posibilidad de usar con backend real sin cambios

## 🚨 Consideraciones Importantes

1. **Datos Existentes**: Los datos en localStorage NO se migran automáticamente a db.json
2. **Testing**: Probar cada store migrado antes de eliminar el original
3. **Rollback**: Mantener los stores originales hasta completar la migración
4. **Autenticación**: El token actual es falso (btoa), en producción usar JWT real

## 📊 Estimación de Tiempo

- **Por Store**: 30-60 minutos
- **Total Stores**: 12 stores
- **Testing**: 2-3 horas
- **Total Estimado**: 2-3 días de trabajo

## 🔗 Próximos Pasos para Producción

1. **Backend Real**: Implementar backend con Node.js/Express o similar
2. **Autenticación JWT**: Implementar tokens JWT reales
3. **Base de Datos**: PostgreSQL o MongoDB
4. **Validación**: Mantener schemas pero en el backend
5. **Seguridad**: Implementar CORS, rate limiting, etc.

## 📚 Referencias

- [JSON Server Documentation](https://github.com/typicode/json-server)
- [Axios Documentation](https://axios-http.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)