const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('🔧 Actualizando lotes para habilitar sistema de cosecha...');

// Actualizar lotes para que sean elegibles para cosecha
db.lots = db.lots.map(lot => {
  // Agregar cultivationSystem para que sean elegibles
  lot.cultivationSystem = 'Cultivo suspendido';

  // Aumentar las tallas para que superen el umbral de 75mm
  if (lot.averageSize && lot.averageSize < 75) {
    const increase = Math.random() * 20 + 10; // Entre 10-30mm de aumento
    lot.averageSize = Math.round(lot.averageSize + increase);
    lot.maxSize = Math.round((lot.maxSize || lot.averageSize) + increase + 5);
    lot.minSize = Math.round((lot.minSize || lot.averageSize) - increase + 5);
  }

  // Agregar estructura de líneas si no existe
  if (!lot.lineName && !lot.lines) {
    // Obtener líneas del sector correspondiente
    const sector = db.sectors.find(s => s.id === lot.sectorId);
    if (sector && sector.batteries && sector.batteries.length > 0) {
      const battery = sector.batteries[0]; // Usar primera batería
      if (battery.lines && battery.lines.length > 0) {
        const line = battery.lines[0]; // Usar primera línea
        lot.lineName = line.name;
        lot.lineId = line.id;

        // Agregar sistemas simulados
        lot.systems = [];
        for (let i = 1; i <= 10; i++) {
          lot.systems.push({
            systemNumber: i,
            floors: Array.from({length: 10}, (_, j) => ({
              floorNumber: j + 1,
              isOccupied: Math.random() > 0.3 // 70% ocupado
            }))
          });
        }
      }
    }
  }

  return lot;
});

console.log('📊 Resultados de la actualización:');
console.log(`   - ${db.lots.length} lotes actualizados`);
console.log(`   - Lotes con talla ≥75mm: ${db.lots.filter(l => l.averageSize >= 75).length}`);
console.log(`   - Lotes con cultivo suspendido: ${db.lots.filter(l => l.cultivationSystem === 'Cultivo suspendido').length}`);
console.log(`   - Lotes con líneas: ${db.lots.filter(l => l.lineName || l.lines).length}`);

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Lotes actualizados exitosamente. El botón "Nueva Planificación" debería estar habilitado ahora.');