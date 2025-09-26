const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Estados de inversión
const investmentStatuses = [
  {
    id: 'inv-status-001',
    code: 'active',
    label: 'Activa',
    color: 'bg-green-100 text-green-800',
    icon: '🟢',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-status-002',
    code: 'completed',
    label: 'Completada',
    color: 'bg-blue-100 text-blue-800',
    icon: '✅',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-status-003',
    code: 'cancelled',
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Agregar a db.json
db.investmentStatuses = investmentStatuses;

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Estados de inversión agregados a db.json:');
console.log(`   - ${investmentStatuses.length} estados de inversión`);