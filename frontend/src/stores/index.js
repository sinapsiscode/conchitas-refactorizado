/**
 * Archivo central para importar stores
 * Migración gradual: activar cada store conforme se migra
 */

// ========================================
// 🔄 CONFIGURACIÓN POR STORE
// ========================================

// ✅ Migrados (usando JSON Server)
export { useAuthStore } from './authStoreNew';
export { useSectorStore } from './sectorStoreNew';
export { useMonitoringStore } from './monitoringStoreNew';
export { useExpenseStore } from './expenseStoreNew';
export { useHarvestStore } from './harvestStoreNew';
export { useIncomeStore } from './incomeStoreNew';

export { useInventoryStore } from './inventoryStoreNew';
export { useInvestmentStore } from './investmentStoreNew';
export { useInvestmentInvitationStore } from './investmentInvitationStoreNew';
export { useNotificationStore } from './notificationStoreNew';
export { useSeedOriginStore } from './seedOriginStoreNew';
export { useProjectionStore } from './projectionStoreNew';
export { useIncomeStatementClosureStore } from './incomeStatementClosureStoreNew';
export { useSeedingStore } from './seedingStoreNew';

// 🎉 MIGRACIÓN COMPLETADA - TODOS LOS STORES USAN JSON SERVER