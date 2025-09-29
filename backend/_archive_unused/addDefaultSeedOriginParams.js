const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Parámetros por defecto para origen de semilla
// Estos valores se usan cuando no se encuentra el origen de semilla específico
const defaultSeedOriginParameters = {
  id: 'default-seed-params-001',
  monthlyGrowthRate: 3.5,
  monthlyMortalityRate: 5.0,
  pricePerUnit: 0.12,
  pricePerBundle: 11.52,
  initialSize: 12,
  description: 'Parámetros por defecto para orígenes de semilla no definidos',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Agregar a db.json
db.defaultSeedOriginParameters = [defaultSeedOriginParameters];

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Parámetros por defecto de origen de semilla agregados a db.json');
console.log('   - Tasa de crecimiento mensual: 3.5');
console.log('   - Tasa de mortalidad mensual: 5.0%');
console.log('   - Precio por unidad: 0.12');
console.log('   - Precio por manojo: 11.52');
console.log('   - Tamaño inicial: 12mm');