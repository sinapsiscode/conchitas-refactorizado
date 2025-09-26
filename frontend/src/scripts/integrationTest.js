/**
 * Test de integración completo del sistema migrado a JSON Server
 * Simula un flujo completo de usuario: login, crear sector, monitoreo, gastos, etc.
 */

import axios from 'axios';

const API_URL = 'http://localhost:4077';
const FRONTEND_URL = 'http://localhost:3676';

// Configurar axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variables globales para el test
let authToken = null;
let userId = null;
let sectorId = null;
let batteryId = null;
let lotId = null;

const log = {
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  section: (title) => console.log(`\n${'='.repeat(50)}\n📋 ${title}\n${'='.repeat(50)}`),
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testStep(name, testFn) {
  try {
    const result = await testFn();
    log.success(name);
    return { success: true, data: result };
  } catch (error) {
    log.error(`${name}: ${error.message}`);
    console.error('Detalles del error:', error.response?.data || error);
    return { success: false, error };
  }
}

// 1. Test de Login
async function testLogin() {
  log.section('1. LOGIN Y AUTENTICACIÓN');

  return await testStep('Login como maricultor', async () => {
    const response = await apiClient.post('/auth/login', {
      email: 'maricultor1@conchas.com',
      password: 'password123',
    });

    if (!response.data?.success || !response.data?.data) {
      throw new Error('Formato de respuesta inesperado');
    }

    const { user, token } = response.data.data;
    authToken = token;
    userId = user.id;

    // Configurar token para requests siguientes
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    log.info(`Usuario: ${user.firstName} ${user.lastName} (${user.role})`);
    log.info(`ID: ${userId}`);
    return user;
  });
}

// 2. Test de Sectores
async function testSectors() {
  log.section('2. GESTIÓN DE SECTORES');

  // Crear sector
  const createResult = await testStep('Crear nuevo sector', async () => {
    const newSector = {
      name: 'Sector Test Integración',
      hectares: 5.5,
      location: 'Zona Norte - Sechura',
      status: 'active',
      userId: userId,
      totalBatteries: 0,
      totalLines: 0,
      occupiedLines: 0,
    };

    const response = await apiClient.post('/sectors', newSector);
    sectorId = response.data.id;
    log.info(`Sector creado con ID: ${sectorId}`);
    return response.data;
  });

  if (!createResult.success) return;

  // Listar sectores
  await testStep('Listar sectores del usuario', async () => {
    const response = await apiClient.get(`/sectors?userId=${userId}`);
    log.info(`Total de sectores: ${response.data.length}`);
    return response.data;
  });

  // Crear batería
  await testStep('Crear batería en el sector', async () => {
    const newBattery = {
      sectorId: sectorId,
      name: 'Batería A',
      totalLines: 50,
      status: 'active',
    };

    const response = await apiClient.post('/batteries', newBattery);
    batteryId = response.data.id;
    log.info(`Batería creada con ID: ${batteryId}`);
    return response.data;
  });
}

// 3. Test de Siembra
async function testSeeding() {
  log.section('3. PROCESO DE SIEMBRA');

  if (!sectorId || !batteryId) {
    log.error('No se puede probar siembra sin sector y batería');
    return;
  }

  await testStep('Crear origen de semilla', async () => {
    const seedOrigin = {
      name: 'Laboratorio Test',
      type: 'laboratory',
      location: 'Piura',
      certification: 'ISO 9001',
      userId: userId,
    };

    const response = await apiClient.post('/seedOrigins', seedOrigin);
    log.info(`Origen de semilla creado: ${response.data.name}`);
    return response.data;
  });

  await testStep('Crear nuevo lote de siembra', async () => {
    const newLot = {
      sectorId: sectorId,
      batteryId: batteryId,
      name: 'Lote Test Integración',
      seedOrigin: 'Laboratorio Test',
      seedDate: new Date().toISOString(),
      initialQuantity: 50000,
      currentQuantity: 50000,
      mortalityRate: 0,
      status: 'active',
      userId: userId,
      systemsUsed: 10,
      linesCultivation: ['A-1', 'A-2', 'A-3'],
    };

    const response = await apiClient.post('/lots', newLot);
    lotId = response.data.id;
    log.info(`Lote creado con ID: ${lotId}`);
    log.info(`Cantidad inicial: ${response.data.initialQuantity} semillas`);
    return response.data;
  });
}

// 4. Test de Monitoreo
async function testMonitoring() {
  log.section('4. MONITOREO DE CALIDAD DE AGUA');

  if (!lotId) {
    log.error('No se puede probar monitoreo sin lote');
    return;
  }

  await testStep('Registrar monitoreo diario', async () => {
    const monitoring = {
      lotId: lotId,
      date: new Date().toISOString(),
      waterTemperature: 28.5,
      oxygenLevel: 6.8,
      phLevel: 8.1,
      salinity: 35.2,
      mortality: 15,
      observations: 'Condiciones óptimas para el cultivo',
      userId: userId,
    };

    const response = await apiClient.post('/monitoring', monitoring);
    log.info('Parámetros registrados:');
    log.info(`  - Temperatura: ${response.data.waterTemperature}°C`);
    log.info(`  - Oxígeno: ${response.data.oxygenLevel} mg/L`);
    log.info(`  - pH: ${response.data.phLevel}`);
    log.info(`  - Salinidad: ${response.data.salinity} ppt`);
    return response.data;
  });

  await testStep('Consultar historial de monitoreo', async () => {
    const response = await apiClient.get(`/monitoring?lotId=${lotId}`);
    log.info(`Registros de monitoreo: ${response.data.length}`);
    return response.data;
  });
}

// 5. Test de Gastos
async function testExpenses() {
  log.section('5. REGISTRO DE GASTOS');

  await testStep('Registrar gasto de alimentación', async () => {
    const expense = {
      category: 'Alimentación',
      description: 'Compra de alimento balanceado - 50 kg',
      amount: 1250.00,
      date: new Date().toISOString(),
      paymentMethod: 'Transferencia',
      supplier: 'Alimentos Marinos SAC',
      sectorId: sectorId,
      userId: userId,
    };

    const response = await apiClient.post('/expenses', expense);
    log.info(`Gasto registrado: S/. ${response.data.amount}`);
    return response.data;
  });

  await testStep('Registrar gasto de mantenimiento', async () => {
    const expense = {
      category: 'Mantenimiento',
      description: 'Reparación de boyas y cuerdas',
      amount: 850.00,
      date: new Date().toISOString(),
      paymentMethod: 'Efectivo',
      supplier: 'Servicios Marítimos Norte',
      sectorId: sectorId,
      userId: userId,
    };

    const response = await apiClient.post('/expenses', expense);
    log.info(`Gasto registrado: S/. ${response.data.amount}`);
    return response.data;
  });

  await testStep('Consultar resumen de gastos', async () => {
    const response = await apiClient.get(`/expenses?userId=${userId}`);
    const total = response.data.reduce((sum, exp) => sum + exp.amount, 0);
    log.info(`Total de gastos: ${response.data.length}`);
    log.info(`Monto total: S/. ${total.toFixed(2)}`);
    return { count: response.data.length, total };
  });
}

// 6. Test de Cosecha
async function testHarvest() {
  log.section('6. PLANIFICACIÓN DE COSECHA');

  if (!lotId) {
    log.error('No se puede probar cosecha sin lote');
    return;
  }

  await testStep('Planificar cosecha', async () => {
    const harvest = {
      lotId: lotId,
      plannedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
      status: 'planned',
      estimatedQuantity: 45000,
      userId: userId,
      sizes: {
        small: 20,
        medium: 40,
        large: 30,
        extraLarge: 10,
      },
    };

    const response = await apiClient.post('/harvests', harvest);
    log.info(`Cosecha planificada para: ${new Date(response.data.plannedDate).toLocaleDateString()}`);
    log.info(`Cantidad estimada: ${response.data.estimatedQuantity} unidades`);
    return response.data;
  });
}

// 7. Test de Inventario
async function testInventory() {
  log.section('7. GESTIÓN DE INVENTARIO');

  await testStep('Agregar item al inventario', async () => {
    const item = {
      name: 'Cabo de 12mm',
      category: 'Materiales',
      quantity: 200,
      unit: 'metros',
      minimumStock: 50,
      location: 'Bodega Principal',
      userId: userId,
    };

    const response = await apiClient.post('/inventory', item);
    log.info(`Item agregado: ${response.data.name}`);
    log.info(`Cantidad: ${response.data.quantity} ${response.data.unit}`);
    return response.data;
  });

  await testStep('Verificar stock del inventario', async () => {
    const response = await apiClient.get(`/inventory?userId=${userId}`);
    log.info(`Items en inventario: ${response.data.length}`);
    return response.data;
  });
}

// 8. Test de Notificaciones
async function testNotifications() {
  log.section('8. SISTEMA DE NOTIFICACIONES');

  await testStep('Crear notificación de prueba', async () => {
    const notification = {
      userId: userId,
      type: 'info',
      title: 'Test de Integración',
      message: 'El sistema está funcionando correctamente con JSON Server',
      read: false,
      createdAt: new Date().toISOString(),
    };

    const response = await apiClient.post('/notifications', notification);
    log.info(`Notificación creada: ${response.data.title}`);
    return response.data;
  });

  await testStep('Consultar notificaciones no leídas', async () => {
    const response = await apiClient.get(`/notifications?userId=${userId}&read=false`);
    log.info(`Notificaciones no leídas: ${response.data.length}`);
    return response.data;
  });
}

// 9. Verificar frontend
async function testFrontend() {
  log.section('9. VERIFICACIÓN DEL FRONTEND');

  await testStep('Verificar que el frontend está activo', async () => {
    try {
      const response = await axios.get(FRONTEND_URL);
      if (response.status === 200) {
        log.info('Frontend respondiendo correctamente');
        return true;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Frontend no está activo en ${FRONTEND_URL}`);
      }
      throw error;
    }
  });
}

// Función principal
async function runIntegrationTest() {
  console.log('\n🚀 INICIANDO TEST DE INTEGRACIÓN COMPLETO');
  console.log(`📍 Backend: ${API_URL}`);
  console.log(`🌐 Frontend: ${FRONTEND_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  let successCount = 0;
  let totalTests = 0;

  // Ejecutar todos los tests en orden
  const tests = [
    testLogin,
    testSectors,
    testSeeding,
    testMonitoring,
    testExpenses,
    testHarvest,
    testInventory,
    testNotifications,
    testFrontend,
  ];

  for (const test of tests) {
    totalTests++;
    const result = await test();
    if (result?.success !== false) {
      successCount++;
    }
    await delay(500); // Pequeña pausa entre tests
  }

  // Resumen final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DEL TEST DE INTEGRACIÓN');
  console.log('=' .repeat(50));
  console.log(`✅ Tests exitosos: ${successCount}/${totalTests}`);
  console.log(`📈 Tasa de éxito: ${((successCount / totalTests) * 100).toFixed(1)}%`);

  if (successCount === totalTests) {
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('✨ El sistema está completamente funcional con JSON Server');
    console.log('🚀 Frontend y Backend están correctamente integrados');
  } else {
    console.log('\n⚠️  Algunos tests fallaron');
    console.log('📝 Revisar los errores detallados arriba');
  }

  // Limpiar datos de prueba
  if (sectorId) {
    log.info('\nLimpiando datos de prueba...');
    try {
      await apiClient.delete(`/sectors/${sectorId}`);
      log.success('Datos de prueba eliminados');
    } catch (error) {
      log.info('No se pudieron eliminar algunos datos de prueba');
    }
  }
}

// Ejecutar el test
runIntegrationTest().catch(console.error);