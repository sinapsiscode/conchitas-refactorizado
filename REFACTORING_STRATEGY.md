# 🚀 Estrategia de Refactorización + JSON Server

## Diagnóstico Actual

### 🔴 Problemas Críticos Identificados
1. **21+ archivos** con MockAPI hardcodeada
2. **localStorage** como única persistencia
3. **Sin abstracción** - stores acoplados directamente a Mock
4. **Validaciones mezcladas** con lógica de API
5. **~45K líneas** de código con deuda técnica

## ✅ Estrategia Recomendada: "Patrón Estrangulador"

### Concepto
En lugar de refactorizar TODO y LUEGO migrar, vamos a:
1. **Mantener el código viejo funcionando**
2. **Construir el nuevo en paralelo**
3. **Migrar feature por feature**
4. **Eliminar el viejo cuando todo esté migrado**

## 📊 Plan de Ejecución

### Fase 1: Fundación (YA COMPLETADA ✅)
```
✅ JSON Server instalado
✅ Estructura de servicios API creada
✅ AuthStoreNew como ejemplo
✅ Variables de entorno configuradas
```

### Fase 2: Migración Vertical por Módulos (RECOMENDADO)

#### Opción A: Por Flujo de Negocio (MEJOR ⭐)
Migrar flujos completos de extremo a extremo:

**Semana 1: Módulo de Autenticación**
```
Day 1: authStore + LoginPage + RegisterPage
Day 2: Testing y ajustes
```

**Semana 2: Módulo de Sectores**
```
Day 3-4: sectorStore + SectorsPage
Day 5: batteriesStore + cultivationLinesStore
Day 6: Componentes relacionados
Day 7: Testing integral
```

**Semana 3: Módulo de Monitoreo**
```
Day 8-9: monitoringStore + MonitoringPage
Day 10: lotsStore + LotMonitoringPage
Day 11-12: Testing y ajustes
```

**Semana 4: Módulo Financiero**
```
Day 13: expenseStore + harvestStore
Day 14: incomeStore + inventoryStore
Day 15: Testing final
```

#### Opción B: Por Capas (NO recomendado ❌)
- Primero todos los stores
- Luego todas las páginas
- Problema: Todo roto hasta el final

## 🛠️ Implementación Práctica

### 1. Feature Flag para Migración Gradual

```javascript
// config/features.js
export const FEATURES = {
  USE_NEW_AUTH: true,      // ✅ Migrado
  USE_NEW_SECTORS: false,  // 🚧 En proceso
  USE_NEW_MONITORING: false, // ⏳ Pendiente
  // ...
};

// En el componente
import { useAuthStore } from FEATURES.USE_NEW_AUTH
  ? './stores/authStoreNew'
  : './stores/authStore';
```

### 2. Patrón para Cada Store Migrado

```javascript
// stores/[entity]StoreNew.js
import { create } from 'zustand';
import { [entity]Service } from '../services/api';

export const use[Entity]Store = create((set, get) => ({
  // Estado limpio
  data: [],
  loading: false,
  error: null,

  // Acciones con API real
  fetchAll: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await [entity]Service.getAll(params);
      set({ data, loading: false });
      return { success: true, data };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },
  // ... más acciones
}));
```

### 3. Migración de Datos Existentes

```javascript
// scripts/migrate-data.js
import { MockDB } from '../src/services/mock/db';
import fs from 'fs';

// Leer datos de localStorage
const sectors = MockDB.get('sectors');
const users = MockDB.get('users');
// ... etc

// Crear nuevo db.json
const newDb = {
  users,
  sectors,
  // ... etc
};

fs.writeFileSync('./db.json', JSON.stringify(newDb, null, 2));
console.log('✅ Datos migrados a db.json');
```

## 🎯 Criterios de Éxito por Módulo

### Para considerar un módulo COMPLETO:
- [ ] Store migrado a nueva arquitectura
- [ ] Páginas usando nuevo store
- [ ] Componentes actualizados
- [ ] Sin referencias a MockAPI
- [ ] Tests pasando (si existen)
- [ ] Datos migrados a db.json
- [ ] Feature flag activado

## ⚠️ Puntos de Atención

### NO HACER:
- ❌ Migrar todo de golpe
- ❌ Refactorizar sin objetivo claro
- ❌ Romper funcionalidad existente
- ❌ Mezclar lógica vieja y nueva en el mismo archivo

### SÍ HACER:
- ✅ Mantener ambas versiones funcionando
- ✅ Migrar por módulos completos
- ✅ Testear después de cada migración
- ✅ Commitear frecuentemente
- ✅ Documentar decisiones

## 📈 Métricas de Progreso

```
Total de Stores: 12
Migrados: 1 (authStore) ✅
En Proceso: 0 🚧
Pendientes: 11 ⏳

Progreso: ████░░░░░░░░░░░░░░░░ 8%
```

## 🏁 Definición de "Terminado"

El proyecto estará listo cuando:
1. **0 referencias a MockAPI** en el código
2. **100% stores usando servicios API**
3. **db.json con todos los datos**
4. **Sin localStorage para persistencia**
5. **Variables de entorno para toda config**
6. **Documentación actualizada**

## 💡 Quick Wins para Empezar

1. **Login/Register** (1 día) - Ya tienes authStoreNew
2. **Dashboard** (1 día) - Solo lectura, fácil de migrar
3. **Sectors básico** (2 días) - CRUD simple

## 🚦 Decisión Final

### Empezar con:
1. **Activar authStoreNew** en LoginPage
2. **Probar login/registro** con JSON Server
3. **Si funciona**, continuar con sectors
4. **Si hay problemas**, ajustar estrategia

### Comando para empezar:
```bash
npm run dev:all
# Frontend: http://localhost:3000
# API: http://localhost:3001
# JSON DB: http://localhost:3001/db
```

## 📝 Checklist Semanal

### Semana 1 (Auth + Setup)
- [ ] Activar authStoreNew en producción
- [ ] Migrar datos de usuarios a db.json
- [ ] Probar login/registro completo
- [ ] Documentar problemas encontrados

### Semana 2 (Sectors)
- [ ] Crear sectorStoreNew
- [ ] Migrar SectorsPage
- [ ] Migrar batteries y lines
- [ ] Testing integral

### Semana 3 (Core Business)
- [ ] Monitoring + Lots
- [ ] Harvests
- [ ] Income/Expenses

### Semana 4 (Polish)
- [ ] Últimos stores
- [ ] Eliminar código viejo
- [ ] Documentación final