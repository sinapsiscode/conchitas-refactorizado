/**
 * Script para eliminar o comentar todos los imports de MockAPI
 * Ya que ahora estamos usando JSON Server
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Archivos a procesar
const filesToProcess = [
  '../pages/maricultor/ExpensesPage.jsx',
  '../pages/maricultor/SeedingPage.jsx',
  '../pages/maricultor/ReportsPage.jsx',
  '../pages/maricultor/InvestorsPage.jsx',
  '../components/investments/MyInvestments.jsx',
  '../components/invitations/InvestorInvitationsList.jsx',
  '../components/invitations/InvestmentInvitationCard.jsx',
  // Los stores viejos ya no se usan, pero los comentamos por si acaso
  '../stores/seedOriginStore.js',
  '../stores/sectorStore.js',
  '../stores/projectionStore.js',
  '../stores/notificationStore.js',
  '../stores/monitoringStore.js',
  '../stores/investmentStore.js',
  '../stores/inventoryStore.js',
  '../stores/incomeStore.js',
  '../stores/incomeStatementClosureStore.js',
  '../stores/harvestStore.js',
  '../stores/expenseStore.js',
  '../stores/authStore.js',
];

let totalProcessed = 0;
let totalModified = 0;

function processFile(filePath) {
  const fullPath = path.resolve(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Comentar imports de MockAPI
  content = content.replace(
    /^import\s+.*?from\s+['"].*?\/mock\/.*?['"];?$/gm,
    (match) => `// ${match} // DESACTIVADO - Migrado a JSON Server`
  );

  // Comentar imports de mockAPI o MockAPI
  content = content.replace(
    /^import\s+\{?\s*(mockAPI|MockAPI|MockDB)\s*\}?\s+from/gm,
    (match) => `// ${match}`
  );

  // Comentar usos de mockAPI en el código
  content = content.replace(
    /^(\s*)(const.*?=\s*await\s+(mockAPI|MockAPI)\.(.*?)$)/gm,
    (match, indent, code) => `${indent}// ${code} // TODO: Migrar a nuevo store con JSON Server`
  );

  // Comentar llamadas directas a mockAPI
  content = content.replace(
    /^(\s*)(await\s+(mockAPI|MockAPI)\.(.*?)$)/gm,
    (match, indent, code) => `${indent}// ${code} // TODO: Migrar a nuevo store con JSON Server`
  );

  // Comentar referencias a mockAPI en objetos
  content = content.replace(
    /^(\s*)(mockAPI|MockAPI)\./gm,
    (match, indent, api) => `${indent}// ${api}.`
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Modificado: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  Sin cambios: ${filePath}`);
    return false;
  }
}

console.log('🚀 Iniciando eliminación de imports de MockAPI');
console.log('=' .repeat(50));

for (const file of filesToProcess) {
  totalProcessed++;
  if (processFile(file)) {
    totalModified++;
  }
}

console.log('=' .repeat(50));
console.log(`📊 Resumen:`);
console.log(`   Archivos procesados: ${totalProcessed}`);
console.log(`   Archivos modificados: ${totalModified}`);
console.log(`   Sin cambios: ${totalProcessed - totalModified}`);

if (totalModified > 0) {
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   - Los imports de MockAPI han sido comentados');
  console.log('   - Los componentes deben usar los nuevos stores desde src/stores/index.js');
  console.log('   - Revisa los comentarios "TODO" para completar la migración');
}

console.log('\n✨ Proceso completado');