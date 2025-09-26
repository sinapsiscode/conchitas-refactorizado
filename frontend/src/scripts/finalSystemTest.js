/**
 * Test final del sistema completo
 */

import axios from 'axios';

const API_URL = 'http://localhost:4077';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000
});

async function testSystem() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 TEST FINAL DEL SISTEMA COMPLETO');
  console.log('=' .repeat(60));

  const results = {
    stores: 0,
    storePassed: 0,
    endpoints: 0,
    endpointsPassed: 0,
    errors: []
  };

  // Lista de stores implementados
  const stores = [
    'authStoreNew',
    'sectorStoreNew',
    'monitoringStoreNew',
    'expenseStoreNew',
    'harvestStoreNew',
    'incomeStoreNew',
    'inventoryStoreNew',
    'investmentStoreNew',
    'notificationStoreNew',
    'seedOriginStoreNew',
    'projectionStoreNew',
    'incomeStatementClosureStoreNew',
    'seedingStoreNew' // Nuevo store agregado
  ];

  // Lista de endpoints
  const endpoints = [
    { path: '/users', name: 'Usuarios' },
    { path: '/sectors', name: 'Sectores' },
    { path: '/batteries', name: 'Baterías' },
    { path: '/cultivationLines', name: 'Líneas de cultivo' },
    { path: '/lots', name: 'Lotes' },
    { path: '/monitoring', name: 'Monitoreo' },
    { path: '/expenses', name: 'Gastos' },
    { path: '/harvests', name: 'Cosechas' },
    { path: '/income', name: 'Ingresos' },
    { path: '/inventory', name: 'Inventario' },
    { path: '/investments', name: 'Inversiones' },
    { path: '/notifications', name: 'Notificaciones' },
    { path: '/seedOrigins', name: 'Orígenes de semilla' },
    { path: '/projections', name: 'Proyecciones' },
    { path: '/incomeStatementClosures', name: 'Cierres contables' }
  ];

  // Verificar stores
  console.log('\n📦 VERIFICANDO STORES:');
  console.log('-'.repeat(40));

  for (const store of stores) {
    results.stores++;
    const exists = await checkStoreExists(store);
    if (exists) {
      console.log(`✅ ${store}`);
      results.storePassed++;
    } else {
      console.log(`❌ ${store}`);
      results.errors.push(`Store ${store} no encontrado`);
    }
  }

  // Verificar endpoints
  console.log('\n🔌 VERIFICANDO ENDPOINTS:');
  console.log('-'.repeat(40));

  for (const endpoint of endpoints) {
    results.endpoints++;
    try {
      const response = await apiClient.get(endpoint.path);
      const count = Array.isArray(response.data) ? response.data.length : 0;
      console.log(`✅ ${endpoint.name.padEnd(25)} (${count} registros)`);
      results.endpointsPassed++;
    } catch (error) {
      console.log(`❌ ${endpoint.name.padEnd(25)} Error: ${error.message}`);
      results.errors.push(`Endpoint ${endpoint.path} falló`);
    }
  }

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DEL TEST');
  console.log('=' .repeat(60));

  const storePercentage = (results.storePassed / results.stores * 100).toFixed(1);
  const endpointPercentage = (results.endpointsPassed / results.endpoints * 100).toFixed(1);

  console.log(`\n📦 Stores: ${results.storePassed}/${results.stores} (${storePercentage}%)`);
  console.log(`🔌 Endpoints: ${results.endpointsPassed}/${results.endpoints} (${endpointPercentage}%)`);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORES ENCONTRADOS:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  const totalPercentage = ((results.storePassed + results.endpointsPassed) /
                          (results.stores + results.endpoints) * 100).toFixed(1);

  console.log('\n' + '='.repeat(60));
  if (totalPercentage >= 90) {
    console.log('🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
    console.log(`✨ Éxito total: ${totalPercentage}%`);
  } else if (totalPercentage >= 70) {
    console.log('⚠️  Sistema funcional con algunos problemas');
    console.log(`📈 Éxito parcial: ${totalPercentage}%`);
  } else {
    console.log('❌ Sistema requiere correcciones importantes');
    console.log(`📉 Éxito limitado: ${totalPercentage}%`);
  }
  console.log('=' .repeat(60));
}

async function checkStoreExists(storeName) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'src', 'stores', `${storeName}.js`);
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// Ejecutar test
testSystem().catch(console.error);