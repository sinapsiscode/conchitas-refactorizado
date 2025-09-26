/**
 * Utilidad para limpiar datos viejos de MockAPI del localStorage
 */

export const cleanupOldStorage = () => {
  console.log('🧹 Limpiando datos viejos de localStorage...');

  // Obtener todas las keys
  const allKeys = Object.keys(localStorage);
  let removedCount = 0;

  allKeys.forEach(key => {
    // Eliminar todas las keys de MockAPI
    if (key.startsWith('conchas-abanico:')) {
      localStorage.removeItem(key);
      removedCount++;
      console.log(`  ❌ Eliminado: ${key}`);
    }
  });

  // También verificar y limpiar token/user viejos
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (token && (token.includes('conchas') || token.length < 50)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('  ❌ Token y usuario viejos eliminados');
    removedCount += 2;
  }

  console.log(`✅ Limpieza completada. ${removedCount} items eliminados.`);
  return removedCount;
};

// Ejecutar automáticamente al cargar
if (typeof window !== 'undefined') {
  // Solo ejecutar una vez
  const cleanupKey = 'cleanup-done-v1';
  if (!localStorage.getItem(cleanupKey)) {
    cleanupOldStorage();
    localStorage.setItem(cleanupKey, 'true');
  }
}