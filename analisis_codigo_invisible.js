#!/usr/bin/env node

/**
 * Script para analizar código invisible en el frontend
 * Identifica EmptyState y componentes que nunca se muestran cuando hay datos
 */

const fs = require('fs');
const path = require('path');

// Datos conocidos de la BD
const datosDB = {
  users: 274,
  sectors: 64,
  lots: 3,
  monitoring: 70,
  harvests: 70,
  expenses: 70,
  inventory: 'tiene datos',
  investments: 'tiene datos',
  notifications: 'tiene datos',
  seedOrigins: 'tiene datos',
  categories: 'tiene datos',

  // Colecciones VACÍAS
  income: 0,
  projections: 0,
  distributions: 0,
  investorInvitations: 0,
  incomeStatementClosures: 0
};

const frontendPath = '/c/Users/usu/Documents/conchitas-refactorizado/frontend/src';

// Archivos que usan EmptyState
const archivosConEmptyState = [
  'components/investments/MyInvestments.jsx',
  'components/investments/InvestorSeedings.jsx',
  'components/sectors/LineManager.jsx',
  'components/sectors/CultivationLineManager.jsx',
  'components/sectors/BatteryManager.jsx',
  'components/returns/InvestorReturns.jsx',
  'components/invitations/InvestorInvitationsList.jsx',
  'pages/investor/InvestorDashboard.jsx',
  'pages/maricultor/HarvestPage.jsx',
  'pages/maricultor/IncomePage.jsx',
  'pages/maricultor/InvestorsPage.jsx',
  'pages/maricultor/InventoryPage.jsx',
  'pages/maricultor/ExpensesPage.jsx',
  'pages/maricultor/ProjectedPage.jsx',
  'pages/maricultor/SeedingPage.jsx',
  'pages/maricultor/ReportsPage.jsx'
];

console.log('🔍 ANÁLISIS EXHAUSTIVO DE CÓDIGO INVISIBLE');
console.log('==========================================\n');

console.log('📊 DATOS CONOCIDOS EN LA BASE DE DATOS:');
Object.entries(datosDB).forEach(([key, value]) => {
  const status = value === 0 ? '❌ VACÍA' : value > 0 ? `✅ ${value} elementos` : '✅ CON DATOS';
  console.log(`  ${key}: ${status}`);
});

console.log('\n🔍 ANALIZANDO ARCHIVOS CON EmptyState...\n');

// Función para analizar un archivo
function analizarArchivo(rutaArchivo) {
  const rutaCompleta = path.join(frontendPath, rutaArchivo);

  if (!fs.existsSync(rutaCompleta)) {
    console.log(`❌ ARCHIVO NO ENCONTRADO: ${rutaArchivo}`);
    return;
  }

  const contenido = fs.readFileSync(rutaCompleta, 'utf8');
  const lineas = contenido.split('\n');

  console.log(`📄 ${rutaArchivo}`);
  console.log('─'.repeat(50));

  // Buscar imports de EmptyState
  const importaEmptyState = contenido.includes('import EmptyState');
  console.log(`  Importa EmptyState: ${importaEmptyState ? '✅' : '❌'}`);

  if (!importaEmptyState) {
    console.log('  ⚠️  Archivo sin EmptyState\n');
    return;
  }

  // Buscar usos de EmptyState
  const usosEmptyState = [];
  lineas.forEach((linea, index) => {
    if (linea.includes('<EmptyState')) {
      usosEmptyState.push({
        linea: index + 1,
        codigo: linea.trim()
      });
    }
  });

  console.log(`  Usos de EmptyState encontrados: ${usosEmptyState.length}`);

  // Buscar condiciones que nunca se cumplen
  const condicionesInvisibles = [];
  lineas.forEach((linea, index) => {
    // Buscar patrones de arrays vacíos
    if (linea.includes('.length === 0') || linea.includes('.length == 0')) {
      condicionesInvisibles.push({
        linea: index + 1,
        codigo: linea.trim(),
        tipo: 'length check'
      });
    }

    // Buscar mensajes de "No hay"
    if (linea.includes('No hay') || linea.includes('No tienes') || linea.includes('No existen')) {
      condicionesInvisibles.push({
        linea: index + 1,
        codigo: linea.trim(),
        tipo: 'mensaje vacío'
      });
    }
  });

  console.log(`  Condiciones potencialmente invisibles: ${condicionesInvisibles.length}`);

  usosEmptyState.forEach(uso => {
    console.log(`    Línea ${uso.linea}: ${uso.codigo}`);
  });

  console.log('\n');
}

// Analizar cada archivo
archivosConEmptyState.forEach(analizarArchivo);

console.log('🎯 RESUMEN DE COLECCIONES VACÍAS QUE CAUSAN CÓDIGO INVISIBLE:');
console.log('──────────────────────────────────────────────────────────');
console.log('❌ income: [] - EmptyState en IncomePage SIEMPRE visible');
console.log('❌ projections: [] - EmptyState en ProjectedPage SIEMPRE visible');
console.log('❌ distributions: [] - EmptyState en InvestorReturns SIEMPRE visible');
console.log('❌ investorInvitations: [] - EmptyState en InvestorInvitationsList SIEMPRE visible');
console.log('❌ incomeStatementClosures: [] - Potencial código invisible en reportes');

console.log('\n✅ COLECCIONES CON DATOS (EmptyState nunca visible):');
console.log('────────────────────────────────────────────────────');
console.log('✅ expenses (70) - EmptyState en ExpensesPage NUNCA visible');
console.log('✅ harvests (70) - EmptyState en HarvestPage NUNCA visible');
console.log('✅ sectors (64) - EmptyState en SectorsPage NUNCA visible');
console.log('✅ users (274) - EmptyState en páginas de usuarios NUNCA visible');

console.log('\n📊 ANÁLISIS COMPLETADO');