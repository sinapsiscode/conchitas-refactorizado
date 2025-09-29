import BaseService from './baseService';
import authService from './authService';

// Crear instancias de servicios para cada entidad
const sectorsService = new BaseService('sectors');
const batteriesService = new BaseService('batteries');
const cultivationLinesService = new BaseService('cultivationLines');
const lotsService = new BaseService('lots');
const monitoringService = new BaseService('monitoring');
const expensesService = new BaseService('expenses');
const harvestsService = new BaseService('harvests');
const incomeService = new BaseService('income');
const inventoryService = new BaseService('inventory');
const investmentsService = new BaseService('investments');
const investmentInvitationsService = new BaseService('investmentInvitations');
const notificationsService = new BaseService('notifications');
const seedOriginsService = new BaseService('seedOrigins');
const projectionsService = new BaseService('projections');
const incomeStatementClosuresService = new BaseService('incomeStatementClosures');
const categoriesService = new BaseService('categories');

// Exportar todos los servicios
export {
  authService,
  sectorsService,
  batteriesService,
  cultivationLinesService,
  lotsService,
  monitoringService,
  expensesService,
  harvestsService,
  incomeService,
  inventoryService,
  investmentsService,
  investmentInvitationsService,
  notificationsService,
  seedOriginsService,
  projectionsService,
  incomeStatementClosuresService,
  categoriesService,
};

// Export default para importación más fácil
export default {
  auth: authService,
  sectors: sectorsService,
  batteries: batteriesService,
  cultivationLines: cultivationLinesService,
  lots: lotsService,
  monitoring: monitoringService,
  expenses: expensesService,
  harvests: harvestsService,
  income: incomeService,
  inventory: inventoryService,
  investments: investmentsService,
  investmentInvitations: investmentInvitationsService,
  notifications: notificationsService,
  seedOrigins: seedOriginsService,
  projections: projectionsService,
  incomeStatementClosures: incomeStatementClosuresService,
  categories: categoriesService,
};