// Constantes para estados de invitaciones
export const INVITATION_STATUSES = {
  pending: {
    label: 'Pendiente',
    color: 'bg-orange-100 text-orange-800',
    icon: '⏳'
  },
  accepted: {
    label: 'Aceptada',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  rejected: {
    label: 'Rechazada',
    color: 'bg-red-100 text-red-800',
    icon: '❌'
  },
  expired: {
    label: 'Expirada',
    color: 'bg-gray-100 text-gray-800',
    icon: '⏰'
  }
};

// Tiempo de expiración por defecto (días)
export const DEFAULT_EXPIRATION_DAYS = 7;

// Validaciones
export const INVITATION_VALIDATION = {
  minAmount: 1000,
  maxAmount: 1000000,
  minPercentage: 1,
  maxPercentage: 100
};