/**
 * Análisis completo de módulos del sistema
 * Compara backend (db.json) con frontend (stores)
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:4077';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000
});

// Definición completa de todos los módulos del sistema
const SYSTEM_MODULES = {
  // Módulos principales con stores
  auth: {
    name: 'Autenticación',
    collection: 'users',
    store: 'authStoreNew',
    endpoints: ['/auth/login', '/auth/register', '/users'],
    status: 'complete'
  },
  sectors: {
    name: 'Sectores',
    collection: 'sectors',
    store: 'sectorStoreNew',
    endpoints: ['/sectors'],
    status: 'complete'
  },
  batteries: {
    name: 'Baterías',
    collection: 'batteries',
    store: 'sectorStoreNew',
    endpoints: ['/batteries'],
    status: 'partial'
  },
  cultivationLines: {
    name: 'Líneas de Cultivo',
    collection: 'cultivationLines',
    store: 'sectorStoreNew',
    endpoints: ['/cultivationLines'],
    status: 'partial'
  },
  lots: {
    name: 'Lotes',
    collection: 'lots',
    store: 'seedingStoreNew',
    endpoints: ['/lots'],
    status: 'missing'
  },
  monitoring: {
    name: 'Monitoreo',
    collection: 'monitoring',
    store: 'monitoringStoreNew',
    endpoints: ['/monitoring'],
    status: 'complete'
  },
  expenses: {
    name: 'Gastos',
    collection: 'expenses',
    store: 'expenseStoreNew',
    endpoints: ['/expenses'],
    status: 'complete'
  },
  harvests: {
    name: 'Cosechas',
    collection: 'harvests',
    store: 'harvestStoreNew',
    endpoints: ['/harvests'],
    status: 'complete'
  },
  income: {
    name: 'Ingresos',
    collection: 'income',
    store: 'incomeStoreNew',
    endpoints: ['/income'],
    status: 'complete'
  },
  inventory: {
    name: 'Inventario',
    collection: 'inventory',
    store: 'inventoryStoreNew',
    endpoints: ['/inventory'],
    status: 'complete'
  },
  investments: {
    name: 'Inversiones',
    collection: 'investments',
    store: 'investmentStoreNew',
    endpoints: ['/investments'],
    status: 'complete'
  },
  notifications: {
    name: 'Notificaciones',
    collection: 'notifications',
    store: 'notificationStoreNew',
    endpoints: ['/notifications'],
    status: 'complete'
  },
  seedOrigins: {
    name: 'Orígenes de Semilla',
    collection: 'seedOrigins',
    store: 'seedOriginStoreNew',
    endpoints: ['/seedOrigins'],
    status: 'complete'
  },
  projections: {
    name: 'Proyecciones',
    collection: 'projections',
    store: 'projectionStoreNew',
    endpoints: ['/projections'],
    status: 'complete'
  },
  incomeStatementClosures: {
    name: 'Cierres Contables',
    collection: 'incomeStatementClosures',
    store: 'incomeStatementClosureStoreNew',
    endpoints: ['/incomeStatementClosures'],
    status: 'complete'
  },

  // Módulos sin stores dedicados
  distributions: {
    name: 'Distribuciones',
    collection: 'distributions',
    store: null,
    endpoints: ['/distributions'],
    status: 'no-store'
  },
  investorInvitations: {
    name: 'Invitaciones a Inversores',
    collection: 'investorInvitations',
    store: null,
    endpoints: ['/investorInvitations'],
    status: 'no-store'
  }
};

// Verificar disponibilidad de endpoint
async function checkEndpoint(endpoint) {
  try {
    const response = await apiClient.get(endpoint);
    return {
      available: true,
      count: Array.isArray(response.data) ? response.data.length : 0
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

// Verificar operaciones CRUD
async function testCRUD(endpoint, testData) {
  const results = {
    create: false,
    read: false,
    update: false,
    delete: false
  };

  try {
    // Test READ
    const readResponse = await apiClient.get(endpoint);
    results.read = true;

    // Test CREATE
    const createResponse = await apiClient.post(endpoint, testData);
    if (createResponse.data && createResponse.data.id) {
      results.create = true;
      const createdId = createResponse.data.id;

      // Test UPDATE
      try {
        await apiClient.put(`${endpoint}/${createdId}`, { ...testData, updated: true });
        results.update = true;
      } catch (e) {
        console.error(`UPDATE failed for ${endpoint}:`, e.message);
      }

      // Test DELETE
      try {
        await apiClient.delete(`${endpoint}/${createdId}`);
        results.delete = true;
      } catch (e) {
        console.error(`DELETE failed for ${endpoint}:`, e.message);
      }
    }
  } catch (error) {
    console.error(`CRUD test failed for ${endpoint}:`, error.message);
  }

  return results;
}

// Análisis principal
async function analyzeModules() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 ANÁLISIS COMPLETO DE MÓDULOS DEL SISTEMA');
  console.log('=' .repeat(80));
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  const analysis = {
    total: Object.keys(SYSTEM_MODULES).length,
    withStore: 0,
    withoutStore: 0,
    complete: 0,
    partial: 0,
    missing: 0,
    modules: []
  };

  console.log('\n' + '='.repeat(80));
  console.log('ESTADO DE CADA MÓDULO');
  console.log('=' .repeat(80));

  for (const [key, module] of Object.entries(SYSTEM_MODULES)) {
    console.log(`\n📁 ${module.name}`);
    console.log('-'.repeat(40));

    const moduleAnalysis = {
      key,
      name: module.name,
      collection: module.collection,
      store: module.store,
      status: module.status,
      endpoints: {},
      crud: {},
      records: 0
    };

    // Verificar cada endpoint
    for (const endpoint of module.endpoints) {
      const endpointStatus = await checkEndpoint(endpoint);
      moduleAnalysis.endpoints[endpoint] = endpointStatus;

      if (endpointStatus.available) {
        moduleAnalysis.records = endpointStatus.count;
        console.log(`  ✅ Endpoint: ${endpoint}`);
        console.log(`     Registros: ${endpointStatus.count}`);
      } else {
        console.log(`  ❌ Endpoint: ${endpoint}`);
        console.log(`     Error: ${endpointStatus.error}`);
      }
    }

    // Test CRUD si el endpoint principal está disponible
    if (module.endpoints[0] && moduleAnalysis.endpoints[module.endpoints[0]]?.available) {
      const testData = getTestData(key);
      const crudResults = await testCRUD(module.endpoints[0], testData);
      moduleAnalysis.crud = crudResults;

      console.log(`  📝 Operaciones CRUD:`);
      console.log(`     Create: ${crudResults.create ? '✅' : '❌'}`);
      console.log(`     Read: ${crudResults.read ? '✅' : '❌'}`);
      console.log(`     Update: ${crudResults.update ? '✅' : '❌'}`);
      console.log(`     Delete: ${crudResults.delete ? '✅' : '❌'}`);
    }

    // Estado del store
    console.log(`  📦 Store: ${module.store || 'NO TIENE STORE'}`);
    console.log(`  📊 Estado: ${getStatusEmoji(module.status)} ${module.status}`);

    // Actualizar contadores
    if (module.store) analysis.withStore++;
    else analysis.withoutStore++;

    switch(module.status) {
      case 'complete': analysis.complete++; break;
      case 'partial': analysis.partial++; break;
      case 'missing': analysis.missing++; break;
    }

    analysis.modules.push(moduleAnalysis);
  }

  // Resumen final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN EJECUTIVO');
  console.log('=' .repeat(80));

  console.log('\n📈 ESTADÍSTICAS GENERALES:');
  console.log(`  Total de módulos: ${analysis.total}`);
  console.log(`  Con store: ${analysis.withStore} (${(analysis.withStore/analysis.total*100).toFixed(1)}%)`);
  console.log(`  Sin store: ${analysis.withoutStore} (${(analysis.withoutStore/analysis.total*100).toFixed(1)}%)`);

  console.log('\n📊 ESTADO DE IMPLEMENTACIÓN:');
  console.log(`  🟢 Completos: ${analysis.complete} (${(analysis.complete/analysis.total*100).toFixed(1)}%)`);
  console.log(`  🟡 Parciales: ${analysis.partial} (${(analysis.partial/analysis.total*100).toFixed(1)}%)`);
  console.log(`  🔴 Faltantes: ${analysis.missing} (${(analysis.missing/analysis.total*100).toFixed(1)}%)`);
  console.log(`  ⚫ Sin store: ${analysis.withoutStore} (${(analysis.withoutStore/analysis.total*100).toFixed(1)}%)`);

  // Módulos con problemas
  const problematicModules = analysis.modules.filter(m =>
    m.status === 'missing' ||
    m.status === 'partial' ||
    m.status === 'no-store' ||
    Object.values(m.crud).some(v => v === false)
  );

  if (problematicModules.length > 0) {
    console.log('\n⚠️ MÓDULOS QUE REQUIEREN ATENCIÓN:');
    problematicModules.forEach(m => {
      console.log(`  • ${m.name}:`);
      if (m.status === 'missing') console.log(`    - Store no implementado`);
      if (m.status === 'partial') console.log(`    - Implementación incompleta`);
      if (m.status === 'no-store') console.log(`    - No tiene store dedicado`);

      const failedOps = Object.entries(m.crud)
        .filter(([_, success]) => !success)
        .map(([op]) => op);
      if (failedOps.length > 0) {
        console.log(`    - Operaciones fallidas: ${failedOps.join(', ')}`);
      }
    });
  }

  // Módulos funcionales
  const functionalModules = analysis.modules.filter(m =>
    m.status === 'complete' &&
    Object.values(m.crud).every(v => v === true)
  );

  console.log('\n✅ MÓDULOS COMPLETAMENTE FUNCIONALES:');
  functionalModules.forEach(m => {
    console.log(`  • ${m.name} (${m.records} registros)`);
  });

  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  if (analysis.missing > 0) {
    console.log('  1. Implementar stores faltantes para módulos críticos');
  }
  if (analysis.partial > 0) {
    console.log('  2. Completar implementación de módulos parciales');
  }
  if (analysis.withoutStore > 0) {
    console.log('  3. Evaluar si los módulos sin store requieren uno');
  }

  const crudIssues = analysis.modules.filter(m =>
    Object.values(m.crud).some(v => v === false)
  );
  if (crudIssues.length > 0) {
    console.log('  4. Corregir operaciones CRUD que están fallando');
  }

  return analysis;
}

// Obtener emoji de estado
function getStatusEmoji(status) {
  switch(status) {
    case 'complete': return '🟢';
    case 'partial': return '🟡';
    case 'missing': return '🔴';
    case 'no-store': return '⚫';
    default: return '❓';
  }
}

// Datos de prueba para cada módulo
function getTestData(moduleKey) {
  const testData = {
    auth: { email: 'test@test.com', password: 'test123', role: 'maricultor' },
    sectors: { name: 'Test Sector', hectares: 3, userId: 'test' },
    batteries: { name: 'Battery Test', sectorId: 'test', totalLines: 10 },
    cultivationLines: { name: 'Line Test', batteryId: 'test', status: 'active' },
    lots: { name: 'Lot Test', sectorId: 'test', initialQuantity: 1000 },
    monitoring: { lotId: 'test', waterTemperature: 25, oxygenLevel: 7 },
    expenses: { category: 'Test', amount: 100, date: new Date().toISOString() },
    harvests: { lotId: 'test', plannedDate: new Date().toISOString(), estimatedQuantity: 1000 },
    income: { source: 'Test', amount: 1000, date: new Date().toISOString() },
    inventory: { name: 'Test Item', category: 'Test', quantity: 10, unit: 'units' },
    investments: { investorId: 'test', amount: 10000, status: 'active' },
    notifications: { userId: 'test', type: 'info', title: 'Test', message: 'Test' },
    seedOrigins: { name: 'Test Origin', type: 'laboratory', location: 'Test' },
    projections: { lotId: 'test', revenue: 10000, costs: 5000, profit: 5000 },
    incomeStatementClosures: { period: '2024-11', totalIncome: 10000, totalExpenses: 5000 },
    distributions: { lotId: 'test', systems: ['A-1'], quantity: 100 },
    investorInvitations: { email: 'test@test.com', investorId: 'test', status: 'pending' }
  };

  return testData[moduleKey] || { test: true };
}

// Ejecutar análisis
analyzeModules()
  .then(analysis => {
    console.log('\n' + '='.repeat(80));
    console.log('🏁 ANÁLISIS COMPLETADO');
    console.log('=' .repeat(80));

    // Guardar resultados
    const resultsPath = path.join(process.cwd(), 'module-analysis-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(analysis, null, 2));
    console.log(`\n📁 Resultados guardados en: ${resultsPath}`);
  })
  .catch(error => {
    console.error('\n❌ Error en análisis:', error);
  });