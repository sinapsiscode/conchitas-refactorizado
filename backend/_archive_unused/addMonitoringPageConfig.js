const fs = require('fs');
const path = require('path');

// Leer db.json actual
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Configuraciones del MonitoringPage
const monitoringPageConfig = {
  id: 'monitoring-page-config',
  title: 'Monitoreo de Siembras',
  subtitle: 'Supervisa y rastrea el crecimiento de todas las siembras activas',
  loadingMessage: 'Cargando monitoreo...',
  noDataTitle: 'No hay siembras para monitorear',
  noDataMessage: 'Crea siembras en la sección de Siembras para comenzar el monitoreo y seguimiento.',
  noDataIcon: '🔍',
  tableTitle: 'Tabla de Siembras por Sector',
  tableSubtitle: 'Haz clic en "Ver Detalles" para acceder al monitoreo detallado de cada lote',
  fallbackTexts: {
    sectorNotFound: 'Sector no encontrado',
    locationNotAvailable: 'Ubicación no disponible',
    noLocation: 'Sin ubicación',
    noMeasurements: 'Sin mediciones',
    initialQuantity: 'inicial',
    currentQuantity: 'actual'
  },
  currency: {
    locale: 'es-PE',
    currency: 'PEN'
  },
  dateFormat: {
    locale: 'es-PE'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Status colors para los lotes
const lotStatusColors = [
  {
    id: 'lot-status-color-1',
    statusCode: 'seeded',
    colorClass: 'bg-blue-100 text-blue-800',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lot-status-color-2',
    statusCode: 'growing',
    colorClass: 'bg-green-100 text-green-800',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lot-status-color-3',
    statusCode: 'ready',
    colorClass: 'bg-yellow-100 text-yellow-800',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lot-status-color-4',
    statusCode: 'harvested',
    colorClass: 'bg-gray-100 text-gray-800',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Headers de la tabla
const monitoringTableHeaders = [
  {
    id: 'header-1',
    key: 'lotInfo',
    label: 'Información del Lote',
    sortable: false,
    width: 'w-auto',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'header-2',
    key: 'entryDate',
    label: 'Fecha Siembra',
    sortable: true,
    width: 'w-auto',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'header-3',
    key: 'lines',
    label: 'Líneas/Sistemas',
    sortable: false,
    width: 'w-auto',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'header-4',
    key: 'quantity',
    label: 'Cantidad',
    sortable: true,
    width: 'w-auto',
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'header-5',
    key: 'measurements',
    label: 'Última Medición',
    sortable: false,
    width: 'w-auto',
    isActive: true,
    order: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'header-6',
    key: 'status',
    label: 'Estado',
    sortable: true,
    width: 'w-auto',
    isActive: true,
    order: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'header-7',
    key: 'actions',
    label: 'Acciones',
    sortable: false,
    width: 'w-auto',
    isActive: true,
    order: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// StatCards del dashboard
const monitoringStatCards = [
  {
    id: 'stat-card-1',
    key: 'activeLots',
    title: 'Siembras Activas',
    subtitle: 'En seguimiento',
    icon: '🔍',
    color: 'primary',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'stat-card-2',
    key: 'totalSpecimens',
    title: 'Total Ejemplares',
    subtitle: 'En monitoreo',
    icon: '🐚',
    color: 'secondary',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'stat-card-3',
    key: 'sectorsWithLots',
    title: 'Sectores con Siembras',
    subtitle: 'Activos',
    icon: '🏭',
    color: 'green',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Agregar o actualizar las colecciones en db.json
if (!db.monitoringPageConfig) {
  db.monitoringPageConfig = [monitoringPageConfig];
} else {
  const existingIndex = db.monitoringPageConfig.findIndex(c => c.id === 'monitoring-page-config');
  if (existingIndex >= 0) {
    db.monitoringPageConfig[existingIndex] = monitoringPageConfig;
  } else {
    db.monitoringPageConfig.push(monitoringPageConfig);
  }
}

if (!db.lotStatusColors) {
  db.lotStatusColors = lotStatusColors;
} else {
  db.lotStatusColors = [...db.lotStatusColors, ...lotStatusColors.filter(color =>
    !db.lotStatusColors.some(existing => existing.statusCode === color.statusCode)
  )];
}

if (!db.monitoringTableHeaders) {
  db.monitoringTableHeaders = monitoringTableHeaders;
} else {
  db.monitoringTableHeaders = monitoringTableHeaders;
}

if (!db.monitoringStatCards) {
  db.monitoringStatCards = monitoringStatCards;
} else {
  db.monitoringStatCards = monitoringStatCards;
}

// Guardar db.json actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Configuraciones de MonitoringPage agregadas a db.json:');
console.log(`   - Configuración general de página`);
console.log(`   - ${lotStatusColors.length} colores de estado de lotes`);
console.log(`   - ${monitoringTableHeaders.length} headers de tabla`);
console.log(`   - ${monitoringStatCards.length} tarjetas de estadísticas`);
console.log('   - Textos de fallback y configuraciones de formato');