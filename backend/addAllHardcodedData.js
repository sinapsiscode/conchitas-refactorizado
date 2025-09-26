const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. EXPENSE TYPES - Tipos de gastos hardcodeados
const expenseTypes = {
  operational: [
    { id: 'exp-type-001', category: 'operational', code: 'vigilante_salary', name: 'Sueldo de vigilante', defaultAmount: 300, isActive: true },
    { id: 'exp-type-002', category: 'operational', code: 'vigilante_maintenance', name: 'Mantenimiento del vigilante', defaultAmount: 300, isActive: true },
    { id: 'exp-type-003', category: 'operational', code: 'waste_collection', name: 'Pago de recojo por residuos', defaultAmount: 0, isActive: true }
  ],
  harvest: [
    { id: 'exp-type-004', category: 'harvest', code: 'nets', name: 'Mallas', defaultAmount: 0, isActive: true },
    { id: 'exp-type-005', category: 'harvest', code: 'plant_processing', name: 'Planta (procesamiento)', defaultAmount: 0, isActive: true },
    { id: 'exp-type-006', category: 'harvest', code: 'divers', name: 'Buzos', defaultAmount: 0, isActive: true },
    { id: 'exp-type-007', category: 'harvest', code: 'boats', name: 'Embarcaciones', defaultAmount: 0, isActive: true },
    { id: 'exp-type-008', category: 'harvest', code: 'ice', name: 'Hielo', defaultAmount: 0, isActive: true },
    { id: 'exp-type-009', category: 'harvest', code: 'net_labels', name: 'Etiqueta para malla', defaultAmount: 0, isActive: true }
  ],
  material: [
    { id: 'exp-type-010', category: 'material', code: 'buoys_national', name: 'Boyas nacionales', defaultAmount: 120, isActive: true },
    { id: 'exp-type-011', category: 'material', code: 'buoys_imported', name: 'Boyas importadas', defaultAmount: 45, isActive: true },
    { id: 'exp-type-012', category: 'material', code: 'lines', name: 'Líneas', defaultAmount: 0, isActive: true },
    { id: 'exp-type-013', category: 'material', code: 'bottom_system', name: 'Sistema de fondo', defaultAmount: 0, isActive: true },
    { id: 'exp-type-014', category: 'material', code: 'suspended_system', name: 'Sistema suspendido', defaultAmount: 0, isActive: true }
  ]
};

// Aplanar tipos de gastos
const flatExpenseTypes = [];
Object.entries(expenseTypes).forEach(([category, types]) => {
  types.forEach(type => {
    flatExpenseTypes.push({
      ...type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
});

// 2. NOTIFICATION TYPES DETAILS - Detalles de tipos de notificación
const notificationTypeDetails = [
  { id: 'notif-detail-001', code: 'distribution_received', label: 'Retorno Distribuido', icon: '💰', color: 'bg-green-100 text-green-800' },
  { id: 'notif-detail-002', code: 'harvest_completed', label: 'Cosecha Completada', icon: '✅', color: 'bg-green-100 text-green-800' },
  { id: 'notif-detail-003', code: 'harvest_upcoming', label: 'Cosecha Próxima', icon: '📅', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'notif-detail-004', code: 'investment_accepted', label: 'Inversión Aceptada', icon: '🤝', color: 'bg-green-100 text-green-800' },
  { id: 'notif-detail-005', code: 'mortality_alert', label: 'Alerta de Mortalidad', icon: '⚠️', color: 'bg-red-100 text-red-800' },
  { id: 'notif-detail-006', code: 'new_monitoring', label: 'Nuevo Monitoreo', icon: '📊', color: 'bg-blue-100 text-blue-800' },
  { id: 'notif-detail-007', code: 'lot_status_change', label: 'Cambio de Estado', icon: '🔄', color: 'bg-blue-100 text-blue-800' },
  { id: 'notif-detail-008', code: 'payment_received', label: 'Pago Recibido', icon: '💸', color: 'bg-green-100 text-green-800' },
  { id: 'notif-detail-009', code: 'investment_invitation_received', label: 'Invitación Recibida', icon: '📩', color: 'bg-blue-100 text-blue-800' },
  { id: 'notif-detail-010', code: 'investment_invitation_accepted', label: 'Invitación Aceptada', icon: '✅', color: 'bg-green-100 text-green-800' },
  { id: 'notif-detail-011', code: 'investment_invitation_rejected', label: 'Invitación Rechazada', icon: '❌', color: 'bg-red-100 text-red-800' },
  { id: 'notif-detail-012', code: 'investment_invitation_cancelled', label: 'Invitación Cancelada', icon: '🚫', color: 'bg-gray-100 text-gray-800' },
  { id: 'notif-detail-013', code: 'system', label: 'Sistema', icon: 'ℹ️', color: 'bg-gray-100 text-gray-800' }
].map(item => ({
  ...item,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// 3. PRIORITY LEVELS - Niveles de prioridad
const priorityLevels = [
  { id: 'priority-001', code: 'low', label: 'Baja', color: 'bg-gray-100 text-gray-800', order: 1 },
  { id: 'priority-002', code: 'medium', label: 'Media', color: 'bg-blue-100 text-blue-800', order: 2 },
  { id: 'priority-003', code: 'high', label: 'Alta', color: 'bg-yellow-100 text-yellow-800', order: 3 },
  { id: 'priority-004', code: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800', order: 4 }
].map(item => ({
  ...item,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// 4. FREQUENCIES - Frecuencias para gastos recurrentes
const frequencies = [
  { id: 'freq-001', code: 'daily', label: 'Diario', days: 1 },
  { id: 'freq-002', code: 'weekly', label: 'Semanal', days: 7 },
  { id: 'freq-003', code: 'monthly', label: 'Mensual', days: 30 },
  { id: 'freq-004', code: 'yearly', label: 'Anual', days: 365 }
].map(item => ({
  ...item,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// 5. ENTITY TYPES - Tipos de entidades relacionadas
const entityTypes = [
  { id: 'entity-001', code: 'investment', label: 'Inversión', icon: '💰' },
  { id: 'entity-002', code: 'harvest', label: 'Cosecha', icon: '🎯' },
  { id: 'entity-003', code: 'lot', label: 'Lote', icon: '🌱' },
  { id: 'entity-004', code: 'distribution', label: 'Distribución', icon: '📊' },
  { id: 'entity-005', code: 'monitoring', label: 'Monitoreo', icon: '📈' }
].map(item => ({
  ...item,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// 6. EXPENSE CATEGORIES ENUM
const expenseCategoryEnum = [
  { id: 'exp-cat-enum-001', code: 'operational', label: 'Operacional', icon: '⚙️', color: '#3B82F6' },
  { id: 'exp-cat-enum-002', code: 'harvest', label: 'Cosecha', icon: '🎯', color: '#10B981' },
  { id: 'exp-cat-enum-003', code: 'material', label: 'Material', icon: '📦', color: '#F59E0B' },
  { id: 'exp-cat-enum-004', code: 'maintenance', label: 'Mantenimiento', icon: '🔧', color: '#8B5CF6' },
  { id: 'exp-cat-enum-005', code: 'other', label: 'Otro', icon: '📝', color: '#6B7280' }
].map(item => ({
  ...item,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// 7. NOTIFICATION STATUSES
const notificationStatuses = [
  { id: 'notif-status-001', code: 'unread', label: 'No leído', icon: '🔵', color: 'bg-blue-100 text-blue-800' },
  { id: 'notif-status-002', code: 'read', label: 'Leído', icon: '⚪', color: 'bg-gray-100 text-gray-800' },
  { id: 'notif-status-003', code: 'archived', label: 'Archivado', icon: '📂', color: 'bg-gray-200 text-gray-600' }
].map(item => ({
  ...item,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// Agregar todas las nuevas colecciones a db.json
db.expenseTypes = flatExpenseTypes;
db.notificationTypeDetails = notificationTypeDetails;
db.priorityLevels = priorityLevels;
db.frequencies = frequencies;
db.entityTypes = entityTypes;
db.expenseCategoryEnum = expenseCategoryEnum;
db.notificationStatuses = notificationStatuses;

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Datos hardcodeados agregados a db.json:');
console.log(`   - ${flatExpenseTypes.length} tipos de gastos`);
console.log(`   - ${notificationTypeDetails.length} detalles de tipos de notificación`);
console.log(`   - ${priorityLevels.length} niveles de prioridad`);
console.log(`   - ${frequencies.length} frecuencias`);
console.log(`   - ${entityTypes.length} tipos de entidad`);
console.log(`   - ${expenseCategoryEnum.length} categorías de gastos enum`);
console.log(`   - ${notificationStatuses.length} estados de notificación`);

const totalNew = flatExpenseTypes.length + notificationTypeDetails.length +
                 priorityLevels.length + frequencies.length + entityTypes.length +
                 expenseCategoryEnum.length + notificationStatuses.length;
console.log(`\nTotal de nuevas entradas: ${totalNew}`);