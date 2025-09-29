const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Agregar estados de invitación
const invitationStatuses = [
  {
    id: 'status-inv-001',
    code: 'pending',
    label: 'Pendiente',
    description: 'Esperando respuesta del inversor',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-inv-002',
    code: 'accepted',
    label: 'Aceptada',
    description: 'El inversor aceptó la invitación',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-inv-003',
    code: 'rejected',
    label: 'Rechazada',
    description: 'El inversor rechazó la invitación',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-inv-004',
    code: 'expired',
    label: 'Expirada',
    description: 'La invitación ha expirado',
    color: 'bg-gray-100 text-gray-800',
    icon: '⌛',
    order: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-inv-005',
    code: 'cancelled',
    label: 'Cancelada',
    description: 'El maricultor canceló la invitación',
    color: 'bg-gray-100 text-gray-800',
    icon: '🚫',
    order: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Agregar estados de lotes
const lotStatuses = [
  {
    id: 'status-lot-001',
    code: 'planned',
    label: 'Planificado',
    description: 'Lote planificado pero no iniciado',
    color: 'bg-gray-100 text-gray-800',
    icon: '📝',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-lot-002',
    code: 'growing',
    label: 'En Crecimiento',
    description: 'Lote en proceso de crecimiento',
    color: 'bg-blue-100 text-blue-800',
    icon: '🌱',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'status-lot-003',
    code: 'ready',
    label: 'Listo para Cosecha',
    description: 'Lote listo para ser cosechado',
    color: 'bg-green-100 text-green-800',
    icon: '🎯',
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
    color: 'bg-purple-100 text-purple-800',
    icon: '✅',
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
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    order: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Agregar unidades de medida
const measurementUnits = [
  {
    id: 'unit-001',
    code: 'kg',
    name: 'Kilogramos',
    symbol: 'kg',
    type: 'weight',
    conversionFactor: 1,
    isBase: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'unit-002',
    code: 'ton',
    name: 'Toneladas',
    symbol: 't',
    type: 'weight',
    conversionFactor: 1000,
    isBase: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'unit-003',
    code: 'units',
    name: 'Unidades',
    symbol: 'u',
    type: 'count',
    conversionFactor: 1,
    isBase: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'unit-004',
    code: 'millares',
    name: 'Millares',
    symbol: 'mil',
    type: 'count',
    conversionFactor: 1000,
    isBase: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'unit-005',
    code: 'hectares',
    name: 'Hectáreas',
    symbol: 'ha',
    type: 'area',
    conversionFactor: 1,
    isBase: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Agregar tipos de monitoreo
const monitoringTypes = [
  {
    id: 'monitoring-001',
    code: 'water_quality',
    name: 'Calidad del Agua',
    description: 'Parámetros de calidad del agua',
    icon: '💧',
    parameters: ['temperature', 'ph', 'oxygen', 'salinity'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'monitoring-002',
    code: 'growth',
    name: 'Crecimiento',
    description: 'Mediciones de crecimiento',
    icon: '📏',
    parameters: ['averageSize', 'sizeDistribution'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'monitoring-003',
    code: 'mortality',
    name: 'Mortalidad',
    description: 'Registro de mortalidad',
    icon: '⚠️',
    parameters: ['mortalityCount', 'mortalityRate'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'monitoring-004',
    code: 'feeding',
    name: 'Alimentación',
    description: 'Control de alimentación',
    icon: '🍽️',
    parameters: ['feedAmount', 'feedFrequency'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Agregar tipos de notificaciones
const notificationTypes = [
  {
    id: 'notif-type-001',
    code: 'harvest_reminder',
    name: 'Recordatorio de Cosecha',
    description: 'Notificaciones sobre cosechas próximas',
    icon: '🎯',
    priority: 'high',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'notif-type-002',
    code: 'monitoring_alert',
    name: 'Alerta de Monitoreo',
    description: 'Alertas sobre parámetros fuera de rango',
    icon: '⚠️',
    priority: 'critical',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'notif-type-003',
    code: 'investment_update',
    name: 'Actualización de Inversión',
    description: 'Notificaciones sobre inversiones',
    icon: '💰',
    priority: 'medium',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'notif-type-004',
    code: 'system_info',
    name: 'Información del Sistema',
    description: 'Información general del sistema',
    icon: 'ℹ️',
    priority: 'low',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Agregar orígenes de semilla
const seedOrigins = [
  {
    id: 'origin-001',
    code: 'laboratory',
    name: 'Laboratorio',
    description: 'Semillas producidas en laboratorio',
    quality: 'premium',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'origin-002',
    code: 'natural',
    name: 'Natural',
    description: 'Semillas recolectadas del medio natural',
    quality: 'standard',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'origin-003',
    code: 'imported',
    name: 'Importado',
    description: 'Semillas importadas de otros países',
    quality: 'variable',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Agregar a db.json
db.invitationStatuses = invitationStatuses;
db.lotStatuses = lotStatuses;
db.measurementUnits = measurementUnits;
db.monitoringTypes = monitoringTypes;
db.notificationTypes = notificationTypes;
db.seedOrigins = seedOrigins;

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Configuraciones adicionales agregadas a db.json:');
console.log(`   - ${invitationStatuses.length} estados de invitación`);
console.log(`   - ${lotStatuses.length} estados de lotes`);
console.log(`   - ${measurementUnits.length} unidades de medida`);
console.log(`   - ${monitoringTypes.length} tipos de monitoreo`);
console.log(`   - ${notificationTypes.length} tipos de notificación`);
console.log(`   - ${seedOrigins.length} orígenes de semilla`);
console.log('Total de nuevas entradas:',
  invitationStatuses.length +
  lotStatuses.length +
  measurementUnits.length +
  monitoringTypes.length +
  notificationTypes.length +
  seedOrigins.length
);