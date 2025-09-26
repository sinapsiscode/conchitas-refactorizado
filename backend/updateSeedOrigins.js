const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Actualizar seed origins con datos específicos de ubicaciones
const updatedSeedOrigins = [
  {
    id: 'origin-001',
    code: 'samanco',
    name: 'Samanco',
    description: 'Semillas de la zona de Samanco',
    quality: 'alta',
    price: 15,
    mortality: 15,
    monthlyGrowthRate: 3.5,
    monthlyMortalityRate: 1.5,
    pricePerUnit: 0.16,
    pricePerBundle: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'origin-002',
    code: 'casma',
    name: 'Casma',
    description: 'Semillas de la zona de Casma',
    quality: 'media',
    price: 12,
    mortality: 20,
    monthlyGrowthRate: 3.2,
    monthlyMortalityRate: 2.0,
    pricePerUnit: 0.13,
    pricePerBundle: 12,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'origin-003',
    code: 'huarmey',
    name: 'Huarmey',
    description: 'Semillas premium de la zona de Huarmey',
    quality: 'premium',
    price: 18,
    mortality: 10,
    monthlyGrowthRate: 4.0,
    monthlyMortalityRate: 1.0,
    pricePerUnit: 0.19,
    pricePerBundle: 18,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'origin-004',
    code: 'supe',
    name: 'Supe',
    description: 'Semillas de la zona de Supe',
    quality: 'media',
    price: 14,
    mortality: 18,
    monthlyGrowthRate: 3.3,
    monthlyMortalityRate: 1.8,
    pricePerUnit: 0.15,
    pricePerBundle: 14,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'origin-005',
    code: 'laboratory',
    name: 'Laboratorio',
    description: 'Semillas producidas en laboratorio controlado',
    quality: 'premium',
    price: 20,
    mortality: 8,
    monthlyGrowthRate: 4.2,
    monthlyMortalityRate: 0.8,
    pricePerUnit: 0.21,
    pricePerBundle: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'origin-006',
    code: 'natural',
    name: 'Natural',
    description: 'Semillas recolectadas del medio natural',
    quality: 'standard',
    price: 10,
    mortality: 25,
    monthlyGrowthRate: 3.0,
    monthlyMortalityRate: 2.5,
    pricePerUnit: 0.10,
    pricePerBundle: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Agregar configuración de constantes para calculadoras
const calculatorConstants = {
  id: 'calc-constants-001',
  shellsPerBundle: 96,
  defaultBundles: 50,
  defaultSectorSize: 1000,
  defaultAdditionalCosts: 500,
  defaultHarvestTime: 6,
  defaultExpectedMortality: 20,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Actualizar db.json
db.seedOrigins = updatedSeedOrigins;
db.calculatorConstants = [calculatorConstants];

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Seed origins actualizados en db.json:');
console.log(`   - ${updatedSeedOrigins.length} orígenes de semilla con datos completos`);
console.log('   - Samanco, Casma, Huarmey, Supe, Laboratorio, Natural');
console.log('   - Incluye precios, mortalidad, tasas de crecimiento');
console.log('✅ Constantes de calculadora agregadas:');
console.log('   - Conchas por manojo: 96');
console.log('   - Valores por defecto para calculadoras');