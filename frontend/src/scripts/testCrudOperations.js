/**
 * Script para verificar que todas las operaciones CRUD funcionan con JSON Server
 */

import axios from 'axios';

const API_URL = 'http://localhost:4077';
const TEST_TOKEN = 'test-token-123';

// Configurar axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tests counter
let passedTests = 0;
let failedTests = 0;

const log = {
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  section: (title) => console.log(`\n${'='.repeat(50)}\n📋 ${title}\n${'='.repeat(50)}`),
};

async function testEndpoint(name, testFn) {
  try {
    await testFn();
    passedTests++;
    log.success(name);
    return true;
  } catch (error) {
    failedTests++;
    log.error(`${name}: ${error.message}`);
    return false;
  }
}

async function testAuth() {
  log.section('AUTENTICACIÓN');

  // Test login
  await testEndpoint('Login con credenciales válidas', async () => {
    const response = await apiClient.post('/auth/login', {
      email: 'maricultor1@conchas.com',
      password: 'password123',
    });

    // El servidor retorna {success: true, data: {user, token}}
    if (response.data?.success && response.data?.data) {
      const { user, token } = response.data.data;

      if (!token || !user) {
        throw new Error('Login no retornó token o usuario');
      }

      // Guardar token para pruebas siguientes
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      log.info(`Usuario logueado: ${user.firstName} ${user.lastName} (${user.role})`);
    } else {
      throw new Error('Formato de respuesta inesperado');
    }
  });

  // Test login con credenciales inválidas
  await testEndpoint('Login rechaza credenciales inválidas', async () => {
    try {
      await apiClient.post('/auth/login', {
        email: 'invalido@test.com',
        password: 'wrongpassword',
      });
      throw new Error('Login debería fallar con credenciales inválidas');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        // Esto es lo esperado
        return;
      }
      throw error;
    }
  });
}

async function testSectors() {
  log.section('SECTORES CRUD');

  let createdSectorId = null;

  // GET - Listar sectores
  await testEndpoint('GET /sectors - Listar todos los sectores', async () => {
    const response = await apiClient.get('/sectors');
    if (!Array.isArray(response.data)) {
      throw new Error('Respuesta no es un array');
    }
    log.info(`Sectores encontrados: ${response.data.length}`);
  });

  // POST - Crear sector
  await testEndpoint('POST /sectors - Crear nuevo sector', async () => {
    const newSector = {
      name: 'Sector Test ' + Date.now(),
      hectares: 5,
      location: 'Zona Test',
      status: 'active',
      userId: 'user-1',
    };

    const response = await apiClient.post('/sectors', newSector);

    if (!response.data.id) {
      throw new Error('Sector creado no tiene ID');
    }

    createdSectorId = response.data.id;
    log.info(`Sector creado con ID: ${createdSectorId}`);
  });

  // GET by ID - Obtener sector específico
  if (createdSectorId) {
    await testEndpoint('GET /sectors/:id - Obtener sector por ID', async () => {
      const response = await apiClient.get(`/sectors/${createdSectorId}`);

      if (response.data.id !== createdSectorId) {
        throw new Error('ID del sector no coincide');
      }
    });

    // PUT - Actualizar sector
    await testEndpoint('PUT /sectors/:id - Actualizar sector', async () => {
      const updateData = {
        name: 'Sector Actualizado ' + Date.now(),
        hectares: 7,
      };

      const response = await apiClient.put(`/sectors/${createdSectorId}`, updateData);

      if (response.data.hectares !== 7) {
        throw new Error('Sector no se actualizó correctamente');
      }
      log.info('Sector actualizado correctamente');
    });

    // DELETE - Eliminar sector
    await testEndpoint('DELETE /sectors/:id - Eliminar sector', async () => {
      await apiClient.delete(`/sectors/${createdSectorId}`);

      // Verificar que fue eliminado
      try {
        await apiClient.get(`/sectors/${createdSectorId}`);
        throw new Error('Sector no fue eliminado');
      } catch (error) {
        if (error.response?.status === 404) {
          // Esto es lo esperado
          log.info('Sector eliminado correctamente');
          return;
        }
        throw error;
      }
    });
  }
}

async function testMonitoring() {
  log.section('MONITOREO CRUD');

  let createdMonitoringId = null;

  // GET - Listar monitoreos
  await testEndpoint('GET /monitoring - Listar todos los monitoreos', async () => {
    const response = await apiClient.get('/monitoring');
    if (!Array.isArray(response.data)) {
      throw new Error('Respuesta no es un array');
    }
    log.info(`Monitoreos encontrados: ${response.data.length}`);
  });

  // POST - Crear monitoreo
  await testEndpoint('POST /monitoring - Crear nuevo monitoreo', async () => {
    const newMonitoring = {
      lotId: 'lot-1',
      date: new Date().toISOString(),
      waterTemperature: 28.5,
      oxygenLevel: 6.2,
      phLevel: 8.1,
      salinity: 35,
      mortality: 2,
      observations: 'Test monitoring',
      userId: 'user-1',
    };

    const response = await apiClient.post('/monitoring', newMonitoring);

    if (!response.data.id) {
      throw new Error('Monitoreo creado no tiene ID');
    }

    createdMonitoringId = response.data.id;
    log.info(`Monitoreo creado con ID: ${createdMonitoringId}`);
  });

  // DELETE - Eliminar monitoreo
  if (createdMonitoringId) {
    await testEndpoint('DELETE /monitoring/:id - Eliminar monitoreo', async () => {
      await apiClient.delete(`/monitoring/${createdMonitoringId}`);
      log.info('Monitoreo eliminado correctamente');
    });
  }
}

async function testExpenses() {
  log.section('GASTOS CRUD');

  let createdExpenseId = null;

  // GET - Listar gastos
  await testEndpoint('GET /expenses - Listar todos los gastos', async () => {
    const response = await apiClient.get('/expenses');
    if (!Array.isArray(response.data)) {
      throw new Error('Respuesta no es un array');
    }
    log.info(`Gastos encontrados: ${response.data.length}`);
  });

  // POST - Crear gasto
  await testEndpoint('POST /expenses - Crear nuevo gasto', async () => {
    const newExpense = {
      category: 'Alimentación',
      description: 'Compra de alimento balanceado',
      amount: 1500.00,
      date: new Date().toISOString(),
      paymentMethod: 'Efectivo',
      supplier: 'Proveedor Test',
      userId: 'user-1',
    };

    const response = await apiClient.post('/expenses', newExpense);

    if (!response.data.id) {
      throw new Error('Gasto creado no tiene ID');
    }

    createdExpenseId = response.data.id;
    log.info(`Gasto creado con ID: ${createdExpenseId}`);
  });

  // DELETE - Eliminar gasto
  if (createdExpenseId) {
    await testEndpoint('DELETE /expenses/:id - Eliminar gasto', async () => {
      await apiClient.delete(`/expenses/${createdExpenseId}`);
      log.info('Gasto eliminado correctamente');
    });
  }
}

async function testHarvests() {
  log.section('COSECHAS CRUD');

  let createdHarvestId = null;

  // GET - Listar cosechas
  await testEndpoint('GET /harvests - Listar todas las cosechas', async () => {
    const response = await apiClient.get('/harvests');
    if (!Array.isArray(response.data)) {
      throw new Error('Respuesta no es un array');
    }
    log.info(`Cosechas encontradas: ${response.data.length}`);
  });

  // POST - Crear cosecha
  await testEndpoint('POST /harvests - Crear nueva cosecha', async () => {
    const newHarvest = {
      lotId: 'lot-1',
      plannedDate: new Date().toISOString(),
      status: 'planned',
      estimatedQuantity: 1000,
      actualQuantity: null,
      actualDate: null,
      sizes: {
        small: 0,
        medium: 0,
        large: 0,
        extraLarge: 0,
      },
      userId: 'user-1',
    };

    const response = await apiClient.post('/harvests', newHarvest);

    if (!response.data.id) {
      throw new Error('Cosecha creada no tiene ID');
    }

    createdHarvestId = response.data.id;
    log.info(`Cosecha creada con ID: ${createdHarvestId}`);
  });

  // DELETE - Eliminar cosecha
  if (createdHarvestId) {
    await testEndpoint('DELETE /harvests/:id - Eliminar cosecha', async () => {
      await apiClient.delete(`/harvests/${createdHarvestId}`);
      log.info('Cosecha eliminada correctamente');
    });
  }
}

async function testInventory() {
  log.section('INVENTARIO CRUD');

  let createdItemId = null;

  // GET - Listar inventario
  await testEndpoint('GET /inventory - Listar todo el inventario', async () => {
    const response = await apiClient.get('/inventory');
    if (!Array.isArray(response.data)) {
      throw new Error('Respuesta no es un array');
    }
    log.info(`Items en inventario: ${response.data.length}`);
  });

  // POST - Crear item
  await testEndpoint('POST /inventory - Crear nuevo item', async () => {
    const newItem = {
      name: 'Cabo 10mm',
      category: 'Materiales',
      quantity: 100,
      unit: 'metros',
      minimumStock: 50,
      location: 'Bodega A',
      userId: 'user-1',
    };

    const response = await apiClient.post('/inventory', newItem);

    if (!response.data.id) {
      throw new Error('Item creado no tiene ID');
    }

    createdItemId = response.data.id;
    log.info(`Item creado con ID: ${createdItemId}`);
  });

  // DELETE - Eliminar item
  if (createdItemId) {
    await testEndpoint('DELETE /inventory/:id - Eliminar item', async () => {
      await apiClient.delete(`/inventory/${createdItemId}`);
      log.info('Item eliminado correctamente');
    });
  }
}

async function runAllTests() {
  console.log('\n🚀 Iniciando pruebas de operaciones CRUD con JSON Server');
  console.log(`📍 API URL: ${API_URL}`);
  console.log('⏰ Timestamp:', new Date().toISOString());

  try {
    // Verificar que el servidor esté activo
    log.info('Verificando conexión con el servidor...');
    await apiClient.get('/');
    log.success('Servidor conectado y respondiendo');
  } catch (error) {
    log.error('No se puede conectar al servidor. ¿Está ejecutándose en el puerto 4077?');
    return;
  }

  // Ejecutar todas las pruebas
  await testAuth();
  await testSectors();
  await testMonitoring();
  await testExpenses();
  await testHarvests();
  await testInventory();

  // Resumen final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(50));
  console.log(`✅ Pruebas exitosas: ${passedTests}`);
  console.log(`❌ Pruebas fallidas: ${failedTests}`);
  console.log(`📈 Tasa de éxito: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('✨ El sistema está completamente migrado a JSON Server');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisar los errores arriba.');
  }
}

// Ejecutar las pruebas
runAllTests().catch(console.error);