const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Limpiar colores y estilos de investmentStatuses
if (db.investmentStatuses) {
  db.investmentStatuses = db.investmentStatuses.map(status => {
    const { color, icon, ...cleanStatus } = status;
    return cleanStatus;
  });
}

// Limpiar colores de invitationStatuses
if (db.invitationStatuses) {
  db.invitationStatuses = db.invitationStatuses.map(status => {
    const { color, icon, ...cleanStatus } = status;
    return cleanStatus;
  });
}

// Limpiar colores de lotStatuses
if (db.lotStatuses) {
  db.lotStatuses = db.lotStatuses.map(status => {
    const { color, icon, ...cleanStatus } = status;
    return cleanStatus;
  });
}

// Limpiar colores de notificationTypeDetails
if (db.notificationTypeDetails) {
  db.notificationTypeDetails = db.notificationTypeDetails.map(type => {
    const { color, icon, ...cleanType } = type;
    return cleanType;
  });
}

// Limpiar colores de priorityLevels
if (db.priorityLevels) {
  db.priorityLevels = db.priorityLevels.map(level => {
    const { color, ...cleanLevel } = level;
    return cleanLevel;
  });
}

// Limpiar colores de notificationStatuses
if (db.notificationStatuses) {
  db.notificationStatuses = db.notificationStatuses.map(status => {
    const { color, icon, ...cleanStatus } = status;
    return cleanStatus;
  });
}

// Limpiar colores de expenseCategoryEnum
if (db.expenseCategoryEnum) {
  db.expenseCategoryEnum = db.expenseCategoryEnum.map(cat => {
    const { color, icon, ...cleanCat } = cat;
    return cleanCat;
  });
}

// Limpiar colores de categories
if (db.categories) {
  db.categories = db.categories.map(cat => {
    const { color, icon, ...cleanCat } = cat;
    return cleanCat;
  });
}

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Colores y estilos removidos de db.json');
console.log('   - Los estilos deben manejarse en el código frontend');
console.log('   - Solo los datos de negocio deben estar en la BD');