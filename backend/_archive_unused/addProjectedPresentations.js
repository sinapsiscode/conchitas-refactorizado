const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Agregar nuevas presentaciones para ProjectedPage
const newPresentations = [
  {
    id: 'presentation-005',
    code: 'malla15kg',
    name: 'Malla 15 Kg',
    editable: true,
    order: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'presentation-006',
    code: 'balde10kg',
    name: 'Balde 10 Kg',
    editable: true,
    order: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'presentation-007',
    code: 'saco50kg',
    name: 'Saco 50 Kg',
    editable: true,
    order: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'presentation-008',
    code: 'tina200kg',
    name: 'Tina 200 Kg',
    editable: true,
    order: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Medidas adicionales para las nuevas presentaciones
const newMeasures = [
  // Malla 15 Kg
  { id: 'measure-010', presentationCode: 'malla15kg', code: '10-20', name: '10-20', pricePerKg: 0, order: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-011', presentationCode: 'malla15kg', code: '20-30', name: '20-30', pricePerKg: 0, order: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-012', presentationCode: 'malla15kg', code: '30-40', name: '30-40', pricePerKg: 0, order: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-013', presentationCode: 'malla15kg', code: '40-50', name: '40-50', pricePerKg: 0, order: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-014', presentationCode: 'malla15kg', code: '50-60', name: '50-60', pricePerKg: 0, order: 5, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-015', presentationCode: 'malla15kg', code: '60-70', name: '60-70', pricePerKg: 0, order: 6, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-016', presentationCode: 'malla15kg', code: '70-80', name: '70-80', pricePerKg: 0, order: 7, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-017', presentationCode: 'malla15kg', code: '80-90', name: '80-90', pricePerKg: 0, order: 8, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-018', presentationCode: 'malla15kg', code: '90-100', name: '90-100', pricePerKg: 0, order: 9, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-019', presentationCode: 'malla15kg', code: '100-110', name: '100-110', pricePerKg: 0, order: 10, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-020', presentationCode: 'malla15kg', code: '110-120', name: '110-120', pricePerKg: 0, order: 11, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-021', presentationCode: 'malla15kg', code: '120+', name: '120+', pricePerKg: 0, order: 12, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Balde 10 Kg
  { id: 'measure-022', presentationCode: 'balde10kg', code: '10-20', name: '10-20', pricePerKg: 0, order: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-023', presentationCode: 'balde10kg', code: '20-30', name: '20-30', pricePerKg: 0, order: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-024', presentationCode: 'balde10kg', code: '30-40', name: '30-40', pricePerKg: 0, order: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Saco 50 Kg
  { id: 'measure-025', presentationCode: 'saco50kg', code: '10-20', name: '10-20', pricePerKg: 0, order: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-026', presentationCode: 'saco50kg', code: '20-30', name: '20-30', pricePerKg: 0, order: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Tina 200 Kg
  { id: 'measure-027', presentationCode: 'tina200kg', code: '10-20', name: '10-20', pricePerKg: 0, order: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'measure-028', presentationCode: 'tina200kg', code: '20-30', name: '20-30', pricePerKg: 0, order: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

// Agregar las nuevas presentaciones
db.presentations = [...(db.presentations || []), ...newPresentations];
db.presentationMeasures = [...(db.presentationMeasures || []), ...newMeasures];

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Presentaciones para ProjectedPage agregadas a db.json:');
console.log(`   - ${newPresentations.length} presentaciones nuevas`);
console.log(`   - ${newMeasures.length} medidas adicionales`);
console.log('   - Malla 15 Kg, Balde 10 Kg, Saco 50 Kg, Tina 200 Kg');