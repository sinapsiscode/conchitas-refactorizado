/**
 * Script para verificar qué funcionalidades CRUD están implementadas en cada store
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stores = [
  'authStoreNew.js',
  'sectorStoreNew.js',
  'monitoringStoreNew.js',
  'expenseStoreNew.js',
  'harvestStoreNew.js',
  'incomeStoreNew.js',
  'inventoryStoreNew.js',
  'investmentStoreNew.js',
  'notificationStoreNew.js',
  'seedOriginStoreNew.js',
  'projectionStoreNew.js',
  'incomeStatementClosureStoreNew.js'
];

const requiredMethods = [
  'fetch',   // GET - Obtener lista
  'create',  // POST - Crear nuevo
  'update',  // PUT/PATCH - Actualizar
  'delete',  // DELETE - Eliminar
];

console.log('🔍 ANÁLISIS DE COMPLETITUD DE STORES\n');
console.log('=' .repeat(60));

const results = {};

stores.forEach(storeName => {
  const storePath = path.join(__dirname, '..', 'stores', storeName);

  if (!fs.existsSync(storePath)) {
    console.log(`❌ No encontrado: ${storeName}`);
    return;
  }

  const content = fs.readFileSync(storePath, 'utf8');
  const storeDisplayName = storeName.replace('StoreNew.js', '');

  results[storeDisplayName] = {
    methods: [],
    missing: []
  };

  // Buscar métodos implementados
  requiredMethods.forEach(method => {
    // Buscar patrones como: fetchSomething:, createSomething:, etc.
    const regex = new RegExp(`${method}[A-Z]\\w*:\\s*(async\\s*)?\\(`, 'g');
    if (content.match(regex)) {
      results[storeDisplayName].methods.push(method);
    } else {
      results[storeDisplayName].missing.push(method);
    }
  });
});

// Mostrar resultados
console.log('\n📊 RESUMEN POR STORE:\n');

let fullyComplete = 0;
let partiallyComplete = 0;
let incomplete = 0;

Object.entries(results).forEach(([store, data]) => {
  const completeness = data.methods.length / requiredMethods.length * 100;
  let status = '';
  let emoji = '';

  if (completeness === 100) {
    status = '✅ COMPLETO';
    emoji = '🟢';
    fullyComplete++;
  } else if (completeness >= 50) {
    status = '⚠️  PARCIAL';
    emoji = '🟡';
    partiallyComplete++;
  } else {
    status = '❌ INCOMPLETO';
    emoji = '🔴';
    incomplete++;
  }

  console.log(`${emoji} ${store.padEnd(25)} ${status.padEnd(15)} (${completeness.toFixed(0)}%)`);

  if (data.methods.length > 0) {
    console.log(`   ✓ Implementado: ${data.methods.join(', ')}`);
  }

  if (data.missing.length > 0) {
    console.log(`   ✗ Falta: ${data.missing.join(', ')}`);
  }

  console.log();
});

// Resumen general
console.log('=' .repeat(60));
console.log('\n📈 RESUMEN GENERAL:\n');
console.log(`🟢 Completos: ${fullyComplete} stores`);
console.log(`🟡 Parciales: ${partiallyComplete} stores`);
console.log(`🔴 Incompletos: ${incomplete} stores`);

const totalCompleteness = (fullyComplete * 100 + partiallyComplete * 50) / stores.length;
console.log(`\n📊 Completitud total: ${totalCompleteness.toFixed(1)}%`);

// Listar stores que necesitan trabajo
const needWork = Object.entries(results)
  .filter(([_, data]) => data.missing.length > 0)
  .map(([store, _]) => store);

if (needWork.length > 0) {
  console.log('\n⚠️  STORES QUE NECESITAN COMPLETAR FUNCIONALIDADES:');
  needWork.forEach(store => {
    const missing = results[store].missing;
    console.log(`   - ${store}: Faltan ${missing.join(', ')}`);
  });
}

console.log('\n✨ Análisis completado');