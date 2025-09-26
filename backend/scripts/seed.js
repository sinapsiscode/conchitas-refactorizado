/**
 * Script para agregar datos de prueba a db.json
 * Ejecutar con: node scripts/seed.js
 */

const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, '..', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Agregar lotes a los sectores existentes
const lotsToAdd = [
  {
    id: "lot-001",
    sectorId: "sector-001",
    entryDate: "2024-06-01",
    origin: "Semillero Local",
    initialQuantity: 25000,
    currentQuantity: 22000,
    expectedMonthlyMortality: 5,
    cost: 8500,
    averageSize: 45,
    maxSize: 55,
    minSize: 35,
    status: "growing",
    createdAt: "2024-06-01T00:00:00.000Z",
    updatedAt: new Date().toISOString()
  },
  {
    id: "lot-002",
    sectorId: "sector-001",
    entryDate: "2024-07-15",
    origin: "Laboratorio Acuícola",
    initialQuantity: 30000,
    currentQuantity: 28500,
    expectedMonthlyMortality: 3,
    cost: 12000,
    averageSize: 38,
    maxSize: 48,
    minSize: 28,
    status: "growing",
    createdAt: "2024-07-15T00:00:00.000Z",
    updatedAt: new Date().toISOString()
  },
  {
    id: "lot-003",
    sectorId: "sector-002",
    entryDate: "2024-08-01",
    origin: "Semillero Local",
    initialQuantity: 20000,
    currentQuantity: 19000,
    expectedMonthlyMortality: 4,
    cost: 7000,
    averageSize: 32,
    maxSize: 42,
    minSize: 22,
    status: "seeded",
    createdAt: "2024-08-01T00:00:00.000Z",
    updatedAt: new Date().toISOString()
  },
  {
    id: "lot-004",
    sectorId: "sector-003",
    entryDate: "2024-05-15",
    origin: "Laboratorio Acuícola",
    initialQuantity: 35000,
    currentQuantity: 31000,
    expectedMonthlyMortality: 6,
    cost: 15000,
    averageSize: 52,
    maxSize: 65,
    minSize: 40,
    status: "growing",
    createdAt: "2024-05-15T00:00:00.000Z",
    updatedAt: new Date().toISOString()
  }
];

// Agregar algunos gastos de ejemplo
const expensesToAdd = [
  {
    id: "expense-001",
    userId: "maricultor-001",
    category: "Alimentación",
    description: "Compra de alimento balanceado",
    amount: 2500,
    date: "2024-11-01",
    createdAt: "2024-11-01T00:00:00.000Z",
    updatedAt: "2024-11-01T00:00:00.000Z"
  },
  {
    id: "expense-002",
    userId: "maricultor-001",
    category: "Mantenimiento",
    description: "Reparación de líneas de cultivo",
    amount: 1800,
    date: "2024-11-05",
    createdAt: "2024-11-05T00:00:00.000Z",
    updatedAt: "2024-11-05T00:00:00.000Z"
  },
  {
    id: "expense-003",
    userId: "maricultor-001",
    category: "Personal",
    description: "Pago de salarios",
    amount: 5000,
    date: "2024-11-10",
    createdAt: "2024-11-10T00:00:00.000Z",
    updatedAt: "2024-11-10T00:00:00.000Z"
  }
];

// Agregar registros de monitoreo
const monitoringToAdd = [
  {
    id: "monitoring-001",
    lotId: "lot-001",
    sectorId: "sector-001",
    recordedBy: "maricultor-001",
    date: "2024-11-01",
    averageSize: 46,
    minSize: 36,
    maxSize: 56,
    estimatedQuantity: 21800,
    mortalityRate: 2.5,
    waterTemperature: 22,
    salinity: 35,
    pH: 8.1,
    oxygen: 7.5,
    observations: "Crecimiento normal, buenas condiciones",
    createdAt: "2024-11-01T00:00:00.000Z",
    updatedAt: "2024-11-01T00:00:00.000Z"
  },
  {
    id: "monitoring-002",
    lotId: "lot-001",
    sectorId: "sector-001",
    recordedBy: "maricultor-001",
    date: "2024-11-08",
    averageSize: 47,
    minSize: 37,
    maxSize: 57,
    estimatedQuantity: 21500,
    mortalityRate: 1.8,
    waterTemperature: 23,
    salinity: 34,
    pH: 8.0,
    oxygen: 7.8,
    observations: "Ligero aumento de temperatura",
    createdAt: "2024-11-08T00:00:00.000Z",
    updatedAt: "2024-11-08T00:00:00.000Z"
  }
];

// Actualizar db.json
db.lots = [...(db.lots || []), ...lotsToAdd];
db.expenses = [...(db.expenses || []), ...expensesToAdd];
db.monitoring = [...(db.monitoring || []), ...monitoringToAdd];

// Escribir de vuelta
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Datos de prueba agregados exitosamente:');
console.log(`   - ${lotsToAdd.length} lotes`);
console.log(`   - ${expensesToAdd.length} gastos`);
console.log(`   - ${monitoringToAdd.length} registros de monitoreo`);
console.log('\n📊 Total en base de datos:');
console.log(`   - ${db.users.length} usuarios`);
console.log(`   - ${db.sectors.length} sectores`);
console.log(`   - ${db.lots.length} lotes`);
console.log(`   - ${db.expenses.length} gastos`);
console.log(`   - ${db.monitoring.length} registros de monitoreo`);