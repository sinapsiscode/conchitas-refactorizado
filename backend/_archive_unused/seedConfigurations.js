/**
 * Script para poblar configuraciones en JSON Server
 * Elimina todo el hardcodeo del frontend
 */

const axios = require('axios');

const API_URL = 'http://localhost:4077';

// Categorías de gastos (antes en expenseStore)
const expenseCategories = [
  { id: 'feed', type: 'expense', name: 'Alimentación', icon: '🍽️', color: '#10B981', isActive: true },
  { id: 'maintenance', type: 'expense', name: 'Mantenimiento', icon: '🔧', color: '#3B82F6', isActive: true },
  { id: 'labor', type: 'expense', name: 'Mano de obra', icon: '👷', color: '#F59E0B', isActive: true },
  { id: 'fuel', type: 'expense', name: 'Combustible', icon: '⛽', color: '#EF4444', isActive: true },
  { id: 'equipment', type: 'expense', name: 'Equipamiento', icon: '🛠️', color: '#8B5CF6', isActive: true },
  { id: 'transport', type: 'expense', name: 'Transporte', icon: '🚚', color: '#EC4899', isActive: true },
  { id: 'materials', type: 'expense', name: 'Materiales', icon: '📦', color: '#14B8A6', isActive: true },
  { id: 'services', type: 'expense', name: 'Servicios', icon: '💼', color: '#F97316', isActive: true },
  { id: 'taxes', type: 'expense', name: 'Impuestos', icon: '📋', color: '#64748B', isActive: true },
  { id: 'insurance', type: 'expense', name: 'Seguros', icon: '🛡️', color: '#0EA5E9', isActive: true },
  { id: 'other', type: 'expense', name: 'Otros', icon: '📌', color: '#6B7280', isActive: true }
];

// Categorías de inventario (antes en inventoryStore)
const inventoryCategories = [
  { id: 'materials', type: 'inventory', name: 'Materiales', description: 'Materiales de construcción y mantenimiento', icon: '🏗️', color: '#3B82F6', isActive: true },
  { id: 'equipment', type: 'inventory', name: 'Equipos', description: 'Equipos y herramientas', icon: '🛠️', color: '#10B981', isActive: true },
  { id: 'supplies', type: 'inventory', name: 'Insumos', description: 'Insumos y consumibles', icon: '📦', color: '#F59E0B', isActive: true },
  { id: 'other', type: 'inventory', name: 'Otros', description: 'Otros elementos', icon: '📌', color: '#6B7280', isActive: true }
];

// Categorías de tallas (antes en harvestStore)
const sizeCategories = [
  { id: 'tiny', type: 'size', name: 'Muy Pequeña', code: 'XS', minSize: 0, maxSize: 30, icon: '🦐', color: '#EF4444', sortOrder: 1 },
  { id: 'small', type: 'size', name: 'Pequeña', code: 'S', minSize: 30, maxSize: 40, icon: '🦐', color: '#F59E0B', sortOrder: 2 },
  { id: 'medium', type: 'size', name: 'Mediana', code: 'M', minSize: 40, maxSize: 50, icon: '🦐', color: '#10B981', sortOrder: 3 },
  { id: 'large', type: 'size', name: 'Grande', code: 'L', minSize: 50, maxSize: 60, icon: '🦐', color: '#3B82F6', sortOrder: 4 },
  { id: 'xlarge', type: 'size', name: 'Extra Grande', code: 'XL', minSize: 60, maxSize: 70, icon: '🦐', color: '#8B5CF6', sortOrder: 5 },
  { id: 'jumbo', type: 'size', name: 'Jumbo', code: 'XXL', minSize: 70, maxSize: 80, icon: '🦐', color: '#EC4899', sortOrder: 6 },
  { id: 'colossal', type: 'size', name: 'Colosal', code: 'XXXL', minSize: 80, maxSize: null, icon: '🦐', color: '#14B8A6', sortOrder: 7 }
];

// Categorías de costos de cosecha (antes en harvestStore)
const harvestCostCategories = [
  { id: 'harvest_labor', type: 'harvest_cost', name: 'Mano de obra cosecha', icon: '👷', color: '#10B981', isActive: true },
  { id: 'selection', type: 'harvest_cost', name: 'Selección', icon: '🔍', color: '#3B82F6', isActive: true },
  { id: 'packaging', type: 'harvest_cost', name: 'Embalaje', icon: '📦', color: '#F59E0B', isActive: true },
  { id: 'ice', type: 'harvest_cost', name: 'Hielo', icon: '🧊', color: '#06B6D4', isActive: true },
  { id: 'harvest_transport', type: 'harvest_cost', name: 'Transporte cosecha', icon: '🚚', color: '#8B5CF6', isActive: true },
  { id: 'storage', type: 'harvest_cost', name: 'Almacenamiento', icon: '🏭', color: '#EC4899', isActive: true },
  { id: 'certifications', type: 'harvest_cost', name: 'Certificaciones', icon: '📋', color: '#14B8A6', isActive: true },
  { id: 'harvest_other', type: 'harvest_cost', name: 'Otros costos', icon: '💰', color: '#6B7280', isActive: true }
];

// Tabla de precios (antes en harvestStore)
const pricingData = [
  {
    id: 'price_tiny',
    sizeCategory: 'tiny',
    sizeName: 'Muy Pequeña',
    pricePerKg: 8,
    pricePerUnit: 0.08,
    currency: 'PEN',
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'price_small',
    sizeCategory: 'small',
    sizeName: 'Pequeña',
    pricePerKg: 12,
    pricePerUnit: 0.12,
    currency: 'PEN',
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'price_medium',
    sizeCategory: 'medium',
    sizeName: 'Mediana',
    pricePerKg: 18,
    pricePerUnit: 0.18,
    currency: 'PEN',
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'price_large',
    sizeCategory: 'large',
    sizeName: 'Grande',
    pricePerKg: 25,
    pricePerUnit: 0.25,
    currency: 'PEN',
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'price_xlarge',
    sizeCategory: 'xlarge',
    sizeName: 'Extra Grande',
    pricePerKg: 35,
    pricePerUnit: 0.35,
    currency: 'PEN',
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'price_jumbo',
    sizeCategory: 'jumbo',
    sizeName: 'Jumbo',
    pricePerKg: 45,
    pricePerUnit: 0.45,
    currency: 'PEN',
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'price_colossal',
    sizeCategory: 'colossal',
    sizeName: 'Colosal',
    pricePerKg: 60,
    pricePerUnit: 0.60,
    currency: 'PEN',
    updatedAt: new Date().toISOString(),
    isActive: true
  }
];

// Configuraciones del sistema
const systemSettings = {
  id: 'default',
  businessName: 'Cultivo de Conchas de Abanico',
  location: 'Piura - Sechura',
  currency: 'PEN',
  currencySymbol: 'S/',
  dateFormat: 'DD/MM/YYYY',
  timeZone: 'America/Lima',
  maxSectorsPerUser: 10,
  maxHectaresPerSector: 10,
  maxBatteriesPerSector: 26, // A-Z
  maxLinesPerBattery: 100,
  maxSystemsPerLine: 100,
  maxFloorsPerSystem: 10,
  defaultMortalityRate: 15, // porcentaje
  defaultGrowthRate: 5, // mm por mes
  harvestMinSize: 50, // mm
  waterQualityRanges: {
    temperature: { min: 18, max: 28, unit: '°C' },
    ph: { min: 7.5, max: 8.5, unit: '' },
    salinity: { min: 34, max: 36, unit: 'ppt' },
    oxygen: { min: 5, max: 8, unit: 'mg/L' }
  },
  updatedAt: new Date().toISOString()
};

// Función para crear las configuraciones
async function seedConfigurations() {
  console.log('🌱 Iniciando población de configuraciones...\n');

  try {
    // 1. Crear categorías
    console.log('📁 Creando categorías...');

    const allCategories = [
      ...expenseCategories,
      ...inventoryCategories,
      ...sizeCategories,
      ...harvestCostCategories
    ];

    for (const category of allCategories) {
      try {
        const response = await axios.post(`${API_URL}/categories`, {
          ...category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`  ✅ Categoría creada: ${category.name} (${category.type})`);
      } catch (error) {
        if (error.response?.status === 500) {
          console.log(`  ⚠️  Categoría ya existe: ${category.name}`);
        } else {
          console.error(`  ❌ Error creando categoría ${category.name}:`, error.message);
        }
      }
    }

    // 2. Crear tabla de precios
    console.log('\n💰 Creando tabla de precios...');

    for (const pricing of pricingData) {
      try {
        const response = await axios.post(`${API_URL}/pricing`, pricing);
        console.log(`  ✅ Precio creado: ${pricing.sizeName} - S/${pricing.pricePerKg}/kg`);
      } catch (error) {
        if (error.response?.status === 500) {
          console.log(`  ⚠️  Precio ya existe: ${pricing.sizeName}`);
        } else {
          console.error(`  ❌ Error creando precio ${pricing.sizeName}:`, error.message);
        }
      }
    }

    // 3. Crear configuraciones del sistema
    console.log('\n⚙️  Creando configuraciones del sistema...');

    try {
      const response = await axios.post(`${API_URL}/systemSettings`, systemSettings);
      console.log('  ✅ Configuraciones del sistema creadas');
    } catch (error) {
      if (error.response?.status === 500) {
        console.log('  ⚠️  Configuraciones ya existen');
      } else {
        console.error('  ❌ Error creando configuraciones:', error.message);
      }
    }

    console.log('\n✨ Población de configuraciones completada!\n');
    console.log('📌 Resumen:');
    console.log(`  - ${expenseCategories.length} categorías de gastos`);
    console.log(`  - ${inventoryCategories.length} categorías de inventario`);
    console.log(`  - ${sizeCategories.length} categorías de tallas`);
    console.log(`  - ${harvestCostCategories.length} categorías de costos de cosecha`);
    console.log(`  - ${pricingData.length} niveles de precios`);
    console.log(`  - 1 configuración del sistema\n`);

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar el script
seedConfigurations();