#!/usr/bin/env node

/**
 * Script para migrar automáticamente todos los imports de stores viejos
 * De: import { useAuthStore } from '../../stores'
 * A:  import { useAuthStore } from '../../stores'
 */

const fs = require('fs');
const path = require('path');

// Stores que necesitan migración
const STORES_TO_MIGRATE = [
  'authStore',
  'sectorStore',
  'monitoringStore',
  'expenseStore',
  'harvestStore',
  'incomeStore',
  'inventoryStore',
  'investmentStore',
  'notificationStore',
  'seedOriginStore',
  'projectionStore',
  'incomeStatementClosureStore'
];

// Función para obtener todos los archivos .jsx y .js recursivamente
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      // Ignorar node_modules y .git
      if (!file.includes('node_modules') && !file.startsWith('.')) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

// Función para migrar imports en un archivo
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];

  STORES_TO_MIGRATE.forEach(storeName => {
    // Patrón para encontrar imports del store viejo
    const oldPattern = new RegExp(
      `from ['"](\\.\\.\\/)+stores\\/${storeName}['"]`,
      'g'
    );

    // Verificar si hay coincidencias
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, `from '$1stores'`);
      modified = true;
      changes.push(storeName);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrado: ${path.relative(process.cwd(), filePath)}`);
    console.log(`   Stores actualizados: ${changes.join(', ')}`);
    return true;
  }

  return false;
}

// Función principal
function main() {
  console.log('🚀 Iniciando migración de imports de stores...\n');

  const srcPath = path.join(__dirname, '..');
  const files = getAllFiles(srcPath);

  let migratedCount = 0;
  let skippedCount = 0;

  files.forEach(file => {
    // Ignorar archivos de stores y este script
    if (file.includes('stores/') || file.includes('migrateStoreImports.js')) {
      return;
    }

    if (migrateFile(file)) {
      migratedCount++;
    } else {
      skippedCount++;
    }
  });

  console.log('\n📊 Resumen de migración:');
  console.log(`✅ Archivos migrados: ${migratedCount}`);
  console.log(`⏭️  Archivos sin cambios: ${skippedCount}`);
  console.log(`📁 Total archivos procesados: ${migratedCount + skippedCount}`);

  if (migratedCount > 0) {
    console.log('\n⚠️  IMPORTANTE: Por favor verifica que el proyecto siga funcionando correctamente.');
    console.log('💡 Recomendación: Haz commit de estos cambios antes de continuar.');
  }
}

// Ejecutar el script
try {
  main();
} catch (error) {
  console.error('❌ Error durante la migración:', error);
  process.exit(1);
}