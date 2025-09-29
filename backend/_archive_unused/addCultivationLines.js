const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Crear baterías si no existen o están incompletas
const batteries = [
  { id: 'bat-A', name: 'Batería A', sectorId: 'sector-001', capacity: 100 },
  { id: 'bat-B', name: 'Batería B', sectorId: 'sector-001', capacity: 100 },
  { id: 'bat-C', name: 'Batería C', sectorId: 'sector-001', capacity: 100 },
  { id: 'bat-D', name: 'Batería D', sectorId: 'sector-002', capacity: 100 },
  { id: 'bat-E', name: 'Batería E', sectorId: 'sector-002', capacity: 100 }
];

// Actualizar o agregar baterías
db.batteries = batteries.map(bat => ({
  ...bat,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// Crear líneas de cultivo para cada batería (10 líneas por batería)
const cultivationLines = [];
let lineId = 1;

batteries.forEach(battery => {
  for (let i = 1; i <= 10; i++) {
    cultivationLines.push({
      id: `line-${lineId}`,
      name: `Línea ${battery.name.split(' ')[1]}-${i}`,
      code: `${battery.name.split(' ')[1]}-${i}`,
      batteryId: battery.id,
      sectorId: battery.sectorId,
      capacity: 100, // Cada línea tiene capacidad para 100 sistemas
      systems: 100,
      floorsPerSystem: 10,
      totalCapacity: 1000, // 100 sistemas x 10 pisos
      currentOccupancy: 0,
      status: 'active',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    lineId++;
  }
});

// Actualizar db.json
db.cultivationLines = cultivationLines;

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Líneas de cultivo agregadas a db.json:');
console.log(`   - ${batteries.length} baterías creadas/actualizadas`);
console.log(`   - ${cultivationLines.length} líneas de cultivo agregadas`);
console.log('   - Baterías: A, B, C, D, E');
console.log('   - 10 líneas por batería (A-1 hasta A-10, B-1 hasta B-10, etc.)');
console.log('   - Total: 50 líneas de cultivo disponibles');