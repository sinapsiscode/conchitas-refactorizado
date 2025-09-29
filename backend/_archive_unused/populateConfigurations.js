/**
 * Script para poblar db.json con todas las configuraciones
 * Elimina completamente el hardcodeo moviendo todo a la base de datos
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo db.json
const dbPath = path.join(__dirname, 'db.json');

// Leer db.json actual
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// ==============================================
// CATEGORÍAS DE GASTOS (antes hardcodeadas en expenseStore)
// ==============================================
const expenseCategories = [
  {
    id: "cat-expense-001",
    type: "expense",
    code: "feed",
    name: "Alimentación",
    icon: "🍽️",
    color: "#10B981",
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-expense-002",
    type: "expense",
    code: "maintenance",
    name: "Mantenimiento",
    icon: "🔧",
    color: "#3B82F6",
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-expense-003",
    type: "expense",
    code: "labor",
    name: "Mano de obra",
    icon: "👷",
    color: "#F59E0B",
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-expense-004",
    type: "expense",
    code: "fuel",
    name: "Combustible",
    icon: "⛽",
    color: "#EF4444",
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-expense-005",
    type: "expense",
    code: "equipment",
    name: "Equipamiento",
    icon: "🛠️",
    color: "#8B5CF6",
    isActive: true,
    order: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-expense-006",
    type: "expense",
    code: "transport",
    name: "Transporte",
    icon: "🚚",
    color: "#EC4899",
    isActive: true,
    order: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-expense-007",
    type: "expense",
    code: "materials",
    name: "Materiales",
    icon: "📦",
    color: "#14B8A6",
    isActive: true,
    order: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-expense-008",
    type: "expense",
    code: "services",
    name: "Servicios",
    icon: "💼",
    color: "#F97316",
    isActive: true,
    order: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-expense-009",
    type: "expense",
    code: "taxes",
    name: "Impuestos",
    icon: "📋",
    color: "#64748B",
    isActive: true,
    order: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-expense-010",
    type: "expense",
    code: "insurance",
    name: "Seguros",
    icon: "🛡️",
    color: "#0EA5E9",
    isActive: true,
    order: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-expense-011",
    type: "expense",
    code: "other",
    name: "Otros",
    icon: "📌",
    color: "#6B7280",
    isActive: true,
    order: 11,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ==============================================
// CATEGORÍAS DE INVENTARIO (antes hardcodeadas en inventoryStore)
// ==============================================
const inventoryCategories = [
  {
    id: "cat-inventory-001",
    type: "inventory",
    code: "materials",
    name: "Materiales",
    description: "Materiales de construcción y mantenimiento",
    icon: "🏗️",
    color: "#3B82F6",
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-inventory-002",
    type: "inventory",
    code: "equipment",
    name: "Equipos",
    description: "Equipos y herramientas",
    icon: "🛠️",
    color: "#10B981",
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-inventory-003",
    type: "inventory",
    code: "supplies",
    name: "Insumos",
    description: "Insumos y consumibles",
    icon: "📦",
    color: "#F59E0B",
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-inventory-004",
    type: "inventory",
    code: "other",
    name: "Otros",
    description: "Otros elementos",
    icon: "📌",
    color: "#6B7280",
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ==============================================
// CATEGORÍAS DE TALLAS (antes hardcodeadas en harvestStore)
// ==============================================
const sizeCategories = [
  {
    id: "cat-size-001",
    type: "size",
    code: "tiny",
    name: "Muy Pequeña",
    shortName: "XS",
    minSize: 0,
    maxSize: 30,
    icon: "🦐",
    color: "#EF4444",
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-size-002",
    type: "size",
    code: "small",
    name: "Pequeña",
    shortName: "S",
    minSize: 30,
    maxSize: 40,
    icon: "🦐",
    color: "#F59E0B",
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-size-003",
    type: "size",
    code: "medium",
    name: "Mediana",
    shortName: "M",
    minSize: 40,
    maxSize: 50,
    icon: "🦐",
    color: "#10B981",
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-size-004",
    type: "size",
    code: "large",
    name: "Grande",
    shortName: "L",
    minSize: 50,
    maxSize: 60,
    icon: "🦐",
    color: "#3B82F6",
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-size-005",
    type: "size",
    code: "xlarge",
    name: "Extra Grande",
    shortName: "XL",
    minSize: 60,
    maxSize: 70,
    icon: "🦐",
    color: "#8B5CF6",
    isActive: true,
    order: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-size-006",
    type: "size",
    code: "jumbo",
    name: "Jumbo",
    shortName: "XXL",
    minSize: 70,
    maxSize: 80,
    icon: "🦐",
    color: "#EC4899",
    isActive: true,
    order: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-size-007",
    type: "size",
    code: "colossal",
    name: "Colosal",
    shortName: "XXXL",
    minSize: 80,
    maxSize: null,
    icon: "🦐",
    color: "#14B8A6",
    isActive: true,
    order: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ==============================================
// CATEGORÍAS DE COSTOS DE COSECHA (antes hardcodeadas en harvestStore)
// ==============================================
const harvestCostCategories = [
  {
    id: "cat-harvest-001",
    type: "harvest_cost",
    code: "harvest_labor",
    name: "Mano de obra cosecha",
    icon: "👷",
    color: "#10B981",
    defaultCost: 50,
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-harvest-002",
    type: "harvest_cost",
    code: "selection",
    name: "Selección",
    icon: "🔍",
    color: "#3B82F6",
    defaultCost: 30,
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-harvest-003",
    type: "harvest_cost",
    code: "packaging",
    name: "Embalaje",
    icon: "📦",
    color: "#F59E0B",
    defaultCost: 15,
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-harvest-004",
    type: "harvest_cost",
    code: "ice",
    name: "Hielo",
    icon: "🧊",
    color: "#06B6D4",
    defaultCost: 20,
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-harvest-005",
    type: "harvest_cost",
    code: "harvest_transport",
    name: "Transporte cosecha",
    icon: "🚚",
    color: "#8B5CF6",
    defaultCost: 25,
    isActive: true,
    order: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-harvest-006",
    type: "harvest_cost",
    code: "storage",
    name: "Almacenamiento",
    icon: "🏭",
    color: "#EC4899",
    defaultCost: 10,
    isActive: true,
    order: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-harvest-007",
    type: "harvest_cost",
    code: "certifications",
    name: "Certificaciones",
    icon: "📋",
    color: "#14B8A6",
    defaultCost: 15,
    isActive: true,
    order: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cat-harvest-008",
    type: "harvest_cost",
    code: "harvest_other",
    name: "Otros costos",
    icon: "💰",
    color: "#6B7280",
    defaultCost: 10,
    isActive: true,
    order: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ==============================================
// TABLA DE PRECIOS (antes hardcodeada en harvestStore)
// ==============================================
const pricingTable = [
  {
    id: "price-001",
    sizeCategory: "tiny",
    sizeName: "Muy Pequeña",
    sizeCode: "XS",
    pricePerKg: 8,
    pricePerUnit: 0.08,
    currency: "PEN",
    isActive: true,
    validFrom: new Date().toISOString(),
    validUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "price-002",
    sizeCategory: "small",
    sizeName: "Pequeña",
    sizeCode: "S",
    pricePerKg: 12,
    pricePerUnit: 0.12,
    currency: "PEN",
    isActive: true,
    validFrom: new Date().toISOString(),
    validUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "price-003",
    sizeCategory: "medium",
    sizeName: "Mediana",
    sizeCode: "M",
    pricePerKg: 18,
    pricePerUnit: 0.18,
    currency: "PEN",
    isActive: true,
    validFrom: new Date().toISOString(),
    validUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "price-004",
    sizeCategory: "large",
    sizeName: "Grande",
    sizeCode: "L",
    pricePerKg: 25,
    pricePerUnit: 0.25,
    currency: "PEN",
    isActive: true,
    validFrom: new Date().toISOString(),
    validUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "price-005",
    sizeCategory: "xlarge",
    sizeName: "Extra Grande",
    sizeCode: "XL",
    pricePerKg: 35,
    pricePerUnit: 0.35,
    currency: "PEN",
    isActive: true,
    validFrom: new Date().toISOString(),
    validUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "price-006",
    sizeCategory: "jumbo",
    sizeName: "Jumbo",
    sizeCode: "XXL",
    pricePerKg: 45,
    pricePerUnit: 0.45,
    currency: "PEN",
    isActive: true,
    validFrom: new Date().toISOString(),
    validUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "price-007",
    sizeCategory: "colossal",
    sizeName: "Colosal",
    sizeCode: "XXXL",
    pricePerKg: 60,
    pricePerUnit: 0.60,
    currency: "PEN",
    isActive: true,
    validFrom: new Date().toISOString(),
    validUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ==============================================
// CONFIGURACIONES DEL SISTEMA (antes hardcodeadas en settings.config.js)
// ==============================================
const systemSettings = {
  id: "settings-001",
  // Información del negocio
  businessName: "Cultivo de Conchas de Abanico",
  businessType: "Maricultura",
  location: "Piura - Sechura",
  country: "Perú",
  currency: "PEN",
  currencySymbol: "S/",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  timeZone: "America/Lima",
  language: "es",

  // Límites del sistema
  maxSectorsPerUser: 10,
  maxHectaresPerSector: 10,
  maxBatteriesPerSector: 26, // A-Z
  maxLinesPerBattery: 100,
  maxSystemsPerLine: 100,
  maxFloorsPerSystem: 10,

  // Parámetros de cultivo por defecto
  defaultMortalityRate: 15, // porcentaje
  defaultGrowthRate: 5, // mm por mes
  harvestMinSize: 50, // mm
  harvestOptimalSize: 65, // mm
  seedingDensityMin: 50, // por sistema
  seedingDensityMax: 200, // por sistema
  seedingDensityDefault: 100, // por sistema

  // Rangos de calidad de agua
  waterQuality: {
    temperature: {
      min: 18,
      max: 28,
      optimalMin: 22,
      optimalMax: 25,
      unit: "°C",
      criticalLow: 16,
      criticalHigh: 30
    },
    ph: {
      min: 7.5,
      max: 8.5,
      optimalMin: 7.8,
      optimalMax: 8.2,
      unit: "",
      criticalLow: 7.0,
      criticalHigh: 9.0
    },
    salinity: {
      min: 34,
      max: 36,
      optimalMin: 34.5,
      optimalMax: 35.5,
      unit: "ppt",
      criticalLow: 32,
      criticalHigh: 38
    },
    oxygen: {
      min: 5,
      max: 8,
      optimalMin: 6,
      optimalMax: 7,
      unit: "mg/L",
      criticalLow: 4,
      criticalHigh: 9
    }
  },

  // Configuraciones de notificaciones
  notificationSettings: {
    pollingInterval: 30000, // 30 segundos
    maxNotifications: 100,
    autoMarkAsReadAfter: 7, // días
    enableEmailNotifications: false,
    enablePushNotifications: false,
    notificationTypes: [
      "harvest_reminder",
      "monitoring_alert",
      "low_stock",
      "investment_update",
      "system_maintenance",
      "quality_alert",
      "mortality_alert"
    ]
  },

  // Configuraciones de reportes
  reportSettings: {
    defaultPeriod: "monthly",
    availablePeriods: ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"],
    exportFormats: ["pdf", "excel", "csv"],
    maxExportRows: 10000,
    includeCharts: true,
    includeSummary: true
  },

  // Configuraciones de seguridad
  securitySettings: {
    sessionTimeout: 3600000, // 1 hora en ms
    maxLoginAttempts: 5,
    passwordMinLength: 6,
    requirePasswordChange: false,
    twoFactorEnabled: false
  },

  // Metadata
  version: "1.0.0",
  lastUpdated: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// ==============================================
// COMBINAR TODAS LAS CATEGORÍAS
// ==============================================
const allCategories = [
  ...expenseCategories,
  ...inventoryCategories,
  ...sizeCategories,
  ...harvestCostCategories
];

// ==============================================
// ACTUALIZAR db.json
// ==============================================

// Agregar o actualizar las colecciones
db.categories = allCategories;
db.pricing = pricingTable;
db.systemSettings = [systemSettings]; // Array con un solo objeto

// Guardar el archivo actualizado
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

// ==============================================
// MOSTRAR RESUMEN
// ==============================================
console.log('');
console.log('✅ ¡CONFIGURACIONES POBLADAS EN db.json!');
console.log('=====================================');
console.log('');
console.log('📊 RESUMEN DE DATOS AGREGADOS:');
console.log(`  • ${expenseCategories.length} categorías de gastos`);
console.log(`  • ${inventoryCategories.length} categorías de inventario`);
console.log(`  • ${sizeCategories.length} categorías de tallas`);
console.log(`  • ${harvestCostCategories.length} categorías de costos de cosecha`);
console.log(`  • ${pricingTable.length} niveles de precios`);
console.log(`  • 1 configuración del sistema completa`);
console.log('');
console.log(`📁 TOTAL: ${allCategories.length} categorías + ${pricingTable.length} precios + 1 configuración`);
console.log('');
console.log('🎯 NUEVAS COLECCIONES EN db.json:');
console.log('  • categories (30 items)');
console.log('  • pricing (7 items)');
console.log('  • systemSettings (1 item)');
console.log('');
console.log('✨ El hardcodeo ahora está 100% en la base de datos');
console.log('📌 Puedes activar el modo API en ConfigManager para usar estos datos');
console.log('');