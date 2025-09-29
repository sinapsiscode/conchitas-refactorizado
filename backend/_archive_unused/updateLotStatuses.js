const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Actualizar lot statuses para que coincidan con el código
const updatedLotStatuses = [
  {
    id: 'status-lot-001',
    code: 'seeded',
    label: 'Sembrado',
    description: 'Lote sembrado recientemente',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-lot-002',
    code: 'growing',
    label: 'Crecimiento',
    description: 'Lote en proceso de crecimiento',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-lot-003',
    code: 'ready',
    label: 'Listo',
    description: 'Lote listo para ser cosechado',
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-lot-004',
    code: 'harvested',
    label: 'Cosechado',
    description: 'Lote ya cosechado',
    order: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-lot-005',
    code: 'cancelled',
    label: 'Cancelado',
    description: 'Lote cancelado por algún problema',
    order: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-lot-006',
    code: 'planned',
    label: 'Planificado',
    description: 'Lote planificado pero no iniciado',
    order: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Actualizar db.json
db.lotStatuses = updatedLotStatuses;

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Estados de lotes actualizados en db.json:');
console.log(`   - ${updatedLotStatuses.length} estados de lote`);
console.log('   - Códigos: seeded, growing, ready, harvested, cancelled, planned');
console.log('   - Labels en español sin hardcodeo');