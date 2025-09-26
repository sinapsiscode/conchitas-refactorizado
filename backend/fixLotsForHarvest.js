const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('🔧 Arreglando lotes para habilitar sistema de cosecha...');

// Agregar datos de prueba más agresivos
db.lots = db.lots.map((lot, index) => {
  // Hacer que TODOS los lotes sean elegibles para cosecha
  lot.cultivationSystem = 'Cultivo suspendido';

  // Aumentar TODAS las tallas para que superen 75mm
  lot.averageSize = 80 + Math.floor(Math.random() * 20); // Entre 80-100mm
  lot.maxSize = lot.averageSize + 10;
  lot.minSize = lot.averageSize - 10;

  // Agregar línea directamente del listado de cultivationLines
  const cultivationLines = db.cultivationLines || [];
  if (cultivationLines.length > 0) {
    const line = cultivationLines[index % cultivationLines.length]; // Rotar líneas
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

  return lot;
});

console.log('📊 Resultados de la corrección:');
console.log(`   - ${db.lots.length} lotes actualizados`);
console.log(`   - Lotes con talla ≥75mm: ${db.lots.filter(l => l.averageSize >= 75).length}`);
console.log(`   - Lotes con cultivo suspendido: ${db.lots.filter(l => l.cultivationSystem === 'Cultivo suspendido').length}`);
console.log(`   - Lotes con líneas: ${db.lots.filter(l => l.lineName).length}`);

// Mostrar un ejemplo de lote
console.log('\n📋 Ejemplo de lote actualizado:');
console.log(JSON.stringify(db.lots[0], null, 2));

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('\n✅ Lotes corregidos exitosamente. Ahora TODOS deberían ser elegibles para cosecha.');