const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Constantes de conversión
const conversionRates = {
  id: 'conversion-rates-001',
  conchitasPorKg: 111,
  conchitasPorManojo: 96,
  manojosPorMalla: 3,
  conchitasPorMalla: 288,
  kgPorMalla: 2.6,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Presentaciones de producto
const presentations = [
  {
    id: 'presentation-001',
    code: 'fresh',
    name: 'Fresco',
    editable: true,
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'presentation-002',
    code: 'frozen',
    name: 'Congelado',
    editable: true,
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'presentation-003',
    code: 'halfShell',
    name: 'Media Valva',
    editable: true,
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'presentation-004',
    code: 'processed',
    name: 'Procesado',
    editable: true,
    order: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Medidas por presentación
const presentationMeasures = [
  // Fresh
  {
    id: 'measure-001',
    presentationCode: 'fresh',
    code: 'small',
    name: 'Pequeña (60-70mm)',
    pricePerKg: 18,
    minSize: 60,
    maxSize: 70,
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'measure-002',
    presentationCode: 'fresh',
    code: 'medium',
    name: 'Mediana (70-80mm)',
    pricePerKg: 22,
    minSize: 70,
    maxSize: 80,
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'measure-003',
    presentationCode: 'fresh',
    code: 'large',
    name: 'Grande (80-90mm)',
    pricePerKg: 25,
    minSize: 80,
    maxSize: 90,
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Frozen
  {
    id: 'measure-004',
    presentationCode: 'frozen',
    code: 'pack10-20',
    name: '10-20 piezas/kg',
    pricePerKg: 25,
    piecesPerKg: '10-20',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'measure-005',
    presentationCode: 'frozen',
    code: 'pack20-30',
    name: '20-30 piezas/kg',
    pricePerKg: 30,
    piecesPerKg: '20-30',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Half Shell
  {
    id: 'measure-006',
    presentationCode: 'halfShell',
    code: 'tray12',
    name: 'Bandeja 12 unid',
    pricePerKg: 35,
    unitsPerTray: 12,
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'measure-007',
    presentationCode: 'halfShell',
    code: 'bulk',
    name: 'Granel/kg',
    pricePerKg: 45,
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Processed
  {
    id: 'measure-008',
    presentationCode: 'processed',
    code: 'pulp500',
    name: 'Pulpa 500g',
    pricePerKg: 56,
    weight: 500,
    unit: 'g',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'measure-009',
    presentationCode: 'processed',
    code: 'pulp1000',
    name: 'Pulpa 1kg',
    pricePerKg: 52,
    weight: 1000,
    unit: 'g',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Agregar a db.json
db.conversionRates = [conversionRates];
db.presentations = presentations;
db.presentationMeasures = presentationMeasures;

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Datos de conversiones agregados a db.json:');
console.log(`   - 1 tabla de conversión`);
console.log(`   - ${presentations.length} presentaciones`);
console.log(`   - ${presentationMeasures.length} medidas por presentación`);