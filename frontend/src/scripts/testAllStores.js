/**
 * Test completo de TODOS los stores con JSON Server
 */

import axios from 'axios';

const API_URL = 'http://localhost:4077';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

const log = {
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  section: (title) => console.log(`\n${'='.repeat(50)}\n📋 ${title}\n${'='.repeat(50)}`),
};

const stores = [
  {
    name: 'AUTH',
    endpoint: '/auth',
    tests: [
      { method: 'POST', path: '/auth/login', data: { email: 'maricultor1@conchas.com', password: 'password123' }, desc: 'Login' },
      { method: 'POST', path: '/auth/register', data: { email: 'test@test.com', password: 'test123', firstName: 'Test', lastName: 'User', role: 'maricultor' }, desc: 'Register', skipTest: true }
    ]
  },
  {
    name: 'SECTORS',
    endpoint: '/sectors',
    tests: [
      { method: 'GET', path: '/sectors', desc: 'Listar sectores' },
      { method: 'POST', path: '/sectors', data: { name: 'Test Sector', hectares: 3, userId: 'test' }, desc: 'Crear sector' },
      { method: 'PUT', path: '/sectors/{id}', data: { name: 'Updated Sector' }, desc: 'Actualizar sector' },
      { method: 'DELETE', path: '/sectors/{id}', desc: 'Eliminar sector' }
    ]
  },
  {
    name: 'BATTERIES',
    endpoint: '/batteries',
    tests: [
      { method: 'GET', path: '/batteries', desc: 'Listar baterías' },
      { method: 'POST', path: '/batteries', data: { name: 'Battery Test', sectorId: 'sector-001', totalLines: 20 }, desc: 'Crear batería' }
    ]
  },
  {
    name: 'CULTIVATION LINES',
    endpoint: '/cultivationLines',
    tests: [
      { method: 'GET', path: '/cultivationLines', desc: 'Listar líneas de cultivo' },
      { method: 'POST', path: '/cultivationLines', data: { name: 'Line A-1', batteryId: 'a115', status: 'active' }, desc: 'Crear línea' }
    ]
  },
  {
    name: 'LOTS',
    endpoint: '/lots',
    tests: [
      { method: 'GET', path: '/lots', desc: 'Listar lotes' },
      { method: 'POST', path: '/lots', data: { name: 'Lote Test', sectorId: 'sector-001', initialQuantity: 10000 }, desc: 'Crear lote' }
    ]
  },
  {
    name: 'MONITORING',
    endpoint: '/monitoring',
    tests: [
      { method: 'GET', path: '/monitoring', desc: 'Listar monitoreos' },
      { method: 'POST', path: '/monitoring', data: { lotId: 'lot-001', waterTemperature: 25, oxygenLevel: 7 }, desc: 'Crear monitoreo' },
      { method: 'PUT', path: '/monitoring/{id}', data: { waterTemperature: 26 }, desc: 'Actualizar monitoreo' },
      { method: 'DELETE', path: '/monitoring/{id}', desc: 'Eliminar monitoreo' }
    ]
  },
  {
    name: 'EXPENSES',
    endpoint: '/expenses',
    tests: [
      { method: 'GET', path: '/expenses', desc: 'Listar gastos' },
      { method: 'POST', path: '/expenses', data: { category: 'Alimentación', amount: 500, date: new Date().toISOString() }, desc: 'Crear gasto' },
      { method: 'PUT', path: '/expenses/{id}', data: { amount: 600 }, desc: 'Actualizar gasto' },
      { method: 'DELETE', path: '/expenses/{id}', desc: 'Eliminar gasto' }
    ]
  },
  {
    name: 'HARVESTS',
    endpoint: '/harvests',
    tests: [
      { method: 'GET', path: '/harvests', desc: 'Listar cosechas' },
      { method: 'POST', path: '/harvests', data: { lotId: 'lot-001', plannedDate: new Date().toISOString(), estimatedQuantity: 5000 }, desc: 'Crear cosecha' },
      { method: 'PUT', path: '/harvests/{id}', data: { estimatedQuantity: 5500 }, desc: 'Actualizar cosecha' },
      { method: 'DELETE', path: '/harvests/{id}', desc: 'Eliminar cosecha' }
    ]
  },
  {
    name: 'INCOME',
    endpoint: '/income',
    tests: [
      { method: 'GET', path: '/income', desc: 'Listar ingresos' },
      { method: 'POST', path: '/income', data: { source: 'Venta', amount: 10000, date: new Date().toISOString() }, desc: 'Crear ingreso' },
      { method: 'PUT', path: '/income/{id}', data: { amount: 11000 }, desc: 'Actualizar ingreso' },
      { method: 'DELETE', path: '/income/{id}', desc: 'Eliminar ingreso' }
    ]
  },
  {
    name: 'INVENTORY',
    endpoint: '/inventory',
    tests: [
      { method: 'GET', path: '/inventory', desc: 'Listar inventario' },
      { method: 'POST', path: '/inventory', data: { name: 'Item Test', category: 'Materiales', quantity: 100, unit: 'unidades' }, desc: 'Crear item' },
      { method: 'PUT', path: '/inventory/{id}', data: { quantity: 150 }, desc: 'Actualizar item' },
      { method: 'DELETE', path: '/inventory/{id}', desc: 'Eliminar item' }
    ]
  },
  {
    name: 'INVESTMENTS',
    endpoint: '/investments',
    tests: [
      { method: 'GET', path: '/investments', desc: 'Listar inversiones' },
      { method: 'POST', path: '/investments', data: { investorId: 'investor-001', amount: 50000, status: 'active' }, desc: 'Crear inversión' },
      { method: 'PUT', path: '/investments/{id}', data: { amount: 55000 }, desc: 'Actualizar inversión' },
      { method: 'DELETE', path: '/investments/{id}', desc: 'Eliminar inversión' }
    ]
  },
  {
    name: 'NOTIFICATIONS',
    endpoint: '/notifications',
    tests: [
      { method: 'GET', path: '/notifications', desc: 'Listar notificaciones' },
      { method: 'POST', path: '/notifications', data: { userId: 'user-1', type: 'info', title: 'Test', message: 'Test notification' }, desc: 'Crear notificación' },
      { method: 'PUT', path: '/notifications/{id}', data: { read: true }, desc: 'Marcar como leída' },
      { method: 'DELETE', path: '/notifications/{id}', desc: 'Eliminar notificación' }
    ]
  },
  {
    name: 'SEED ORIGINS',
    endpoint: '/seedOrigins',
    tests: [
      { method: 'GET', path: '/seedOrigins', desc: 'Listar orígenes de semilla' },
      { method: 'POST', path: '/seedOrigins', data: { name: 'Origin Test', type: 'laboratory', location: 'Test' }, desc: 'Crear origen' },
      { method: 'PUT', path: '/seedOrigins/{id}', data: { name: 'Updated Origin' }, desc: 'Actualizar origen' },
      { method: 'DELETE', path: '/seedOrigins/{id}', desc: 'Eliminar origen' }
    ]
  },
  {
    name: 'PROJECTIONS',
    endpoint: '/projections',
    tests: [
      { method: 'GET', path: '/projections', desc: 'Listar proyecciones' },
      { method: 'POST', path: '/projections', data: { lotId: 'lot-001', revenue: 100000, costs: 60000, profit: 40000 }, desc: 'Crear proyección' },
      { method: 'PUT', path: '/projections/{id}', data: { revenue: 110000 }, desc: 'Actualizar proyección' },
      { method: 'DELETE', path: '/projections/{id}', desc: 'Eliminar proyección' }
    ]
  },
  {
    name: 'INCOME STATEMENT CLOSURES',
    endpoint: '/incomeStatementClosures',
    tests: [
      { method: 'GET', path: '/incomeStatementClosures', desc: 'Listar cierres contables' },
      { method: 'POST', path: '/incomeStatementClosures', data: { period: '2024-11', totalIncome: 100000, totalExpenses: 60000 }, desc: 'Crear cierre' },
      { method: 'PUT', path: '/incomeStatementClosures/{id}', data: { status: 'finalized' }, desc: 'Actualizar cierre' },
      { method: 'DELETE', path: '/incomeStatementClosures/{id}', desc: 'Eliminar cierre' }
    ]
  }
];

async function testEndpoint(store, test, createdId = null) {
  try {
    let path = test.path;
    if (path.includes('{id}')) {
      if (!createdId) return { success: false, error: 'No ID disponible para test' };
      path = path.replace('{id}', createdId);
    }

    let response;
    switch (test.method) {
      case 'GET':
        response = await apiClient.get(path);
        break;
      case 'POST':
        response = await apiClient.post(path, test.data);
        break;
      case 'PUT':
        response = await apiClient.put(path, test.data);
        break;
      case 'DELETE':
        response = await apiClient.delete(path);
        break;
    }

    log.success(`${test.method} ${test.desc}`);
    return { success: true, data: response.data };
  } catch (error) {
    log.error(`${test.method} ${test.desc}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testStore(store) {
  log.section(`${store.name}`);

  let createdId = null;
  let successCount = 0;
  let totalTests = 0;

  for (const test of store.tests) {
    if (test.skipTest) continue;

    totalTests++;
    const result = await testEndpoint(store, test, createdId);

    if (result.success) {
      successCount++;
      // Guardar ID si es POST para usar en PUT/DELETE
      if (test.method === 'POST' && result.data?.id) {
        createdId = result.data.id;
      }
    }
  }

  const percentage = totalTests > 0 ? (successCount / totalTests * 100).toFixed(0) : 0;
  return { store: store.name, success: successCount, total: totalTests, percentage };
}

async function runAllTests() {
  console.log('\n🚀 TEST COMPLETO DE TODOS LOS MÓDULOS CON JSON SERVER');
  console.log(`📍 API URL: ${API_URL}`);
  console.log('⏰ Timestamp:', new Date().toISOString());

  const results = [];

  for (const store of stores) {
    const result = await testStore(store);
    results.push(result);
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL POR MÓDULO');
  console.log('=' .repeat(60));

  let totalSuccess = 0;
  let totalTests = 0;

  results.forEach(r => {
    const emoji = r.percentage === '100' ? '🟢' : r.percentage >= '75' ? '🟡' : '🔴';
    console.log(`${emoji} ${r.store.padEnd(30)} ${r.success}/${r.total} (${r.percentage}%)`);
    totalSuccess += r.success;
    totalTests += r.total;
  });

  const globalPercentage = (totalSuccess / totalTests * 100).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log(`📈 RESULTADO GLOBAL: ${totalSuccess}/${totalTests} pruebas exitosas (${globalPercentage}%)`);

  if (globalPercentage >= 90) {
    console.log('\n🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL CON JSON SERVER!');
  } else if (globalPercentage >= 70) {
    console.log('\n⚠️  Sistema mayormente funcional, algunos endpoints necesitan revisión');
  } else {
    console.log('\n❌ Sistema necesita correcciones importantes');
  }
}

runAllTests().catch(console.error);