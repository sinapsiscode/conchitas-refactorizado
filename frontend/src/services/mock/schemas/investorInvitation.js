export const InvestorInvitationSchema = {
  id: { type: 'string', required: true },
  seedingId: { type: 'string', required: true }, // ID del lote/siembra
  maricultorId: { type: 'string', required: true }, // ID del maricultor
  investorId: { type: 'string', required: true }, // ID del inversor
  investorEmail: { type: 'string', required: true }, // Email para búsqueda
  investorName: { type: 'string', required: true }, // Nombre para búsqueda
  invitedAmount: { type: 'number', required: false, min: 0 }, // Monto sugerido
  invitedPercentage: { type: 'number', required: false, min: 0, max: 100 }, // Porcentaje sugerido
  message: { type: 'string', required: false }, // Mensaje personalizado del maricultor
  status: { 
    type: 'string', 
    required: true,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'cancelled']
  },
  invitationDate: { type: 'date', required: true },
  responseDate: { type: 'date', required: false },
  expirationDate: { type: 'date', required: true }, // Expire después de 7 días
  responseMessage: { type: 'string', required: false }, // Mensaje del inversor al responder
  createdAt: { type: 'date', required: true },
  updatedAt: { type: 'date', required: true }
}

// Función helper para crear nuevas invitaciones
export const createInvestorInvitation = (data) => {
  const now = new Date().toISOString()
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + 7) // Expira en 7 días
  
  return {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    invitationDate: now,
    expirationDate: expirationDate.toISOString(),
    createdAt: now,
    updatedAt: now,
    ...data
  }
}

// Estados de la invitación con descripciones
export const INVITATION_STATUSES = {
  pending: {
    label: 'Pendiente',
    description: 'Esperando respuesta del inversor',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳'
  },
  accepted: {
    label: 'Aceptada',
    description: 'El inversor aceptó la invitación',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  rejected: {
    label: 'Rechazada',
    description: 'El inversor rechazó la invitación',
    color: 'bg-red-100 text-red-800',
    icon: '❌'
  },
  expired: {
    label: 'Expirada',
    description: 'La invitación expiró sin respuesta',
    color: 'bg-gray-100 text-gray-800',
    icon: '⌛'
  },
  cancelled: {
    label: 'Cancelada',
    description: 'El maricultor canceló la invitación',
    color: 'bg-gray-100 text-gray-800',
    icon: '🚫'
  }
}