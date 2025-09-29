const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Agregar "Semillero Local" a los seed origins
const newSeedOrigin = {
  id: 'origin-007',
  code: 'semillero_local',
  name: 'Semillero Local',
  description: 'Semillas producidas localmente',
  quality: 'media',
  price: 12,
  mortality: 15,
  monthlyGrowthRate: 3.5,
  monthlyMortalityRate: 1.5,
  pricePerUnit: 0.13,
  pricePerBundle: 12,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Verificar si ya existe
const existingIndex = db.seedOrigins.findIndex(o => o.name === 'Semillero Local');
if (existingIndex === -1) {
  db.seedOrigins.push(newSeedOrigin);
  console.log('✅ Agregado "Semillero Local" a seed origins');
} else {
  db.seedOrigins[existingIndex] = { ...db.seedOrigins[existingIndex], ...newSeedOrigin };
  console.log('✅ Actualizado "Semillero Local" en seed origins');
}

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('   - Total de orígenes de semilla:', db.seedOrigins.length);