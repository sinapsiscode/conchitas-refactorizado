const db = require('./db.json');

console.log('\n📊 COLECCIONES EN db.json:');
console.log('=' .repeat(40));

Object.keys(db).forEach(key => {
  console.log(`✓ ${key.padEnd(30)} ${db[key].length} registros`);
});

console.log('\nTotal de colecciones:', Object.keys(db).length);