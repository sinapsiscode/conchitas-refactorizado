import { create } from 'zustand';
import { investmentInvitationsService } from '../services/api';

export const useInvestmentInvitationStore = create((set, get) => ({
  // Estado
  invitations: [],
  loading: false,
  error: null,

  // Obtener invitaciones de un inversor
  fetchInvestorInvitations: async (investorId) => {
    set({ loading: true, error: null });
    try {
      const invitations = await investmentInvitationsService.getAll({
        investorId
      });
      set({ invitations, loading: false });
      return { success: true, data: invitations };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Obtener invitaciones de un maricultor
  fetchMaricultorInvitations: async (maricultorId) => {
    set({ loading: true, error: null });
    try {
      const invitations = await investmentInvitationsService.getAll({
        maricultorId
      });
      set({ invitations, loading: false });
      return { success: true, data: invitations };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Crear nueva invitación
  createInvitation: async (invitationData) => {
    set({ loading: true, error: null });
    try {
      const newInvitation = await investmentInvitationsService.create({
        ...invitationData,
        status: 'pending',
        invitationDate: new Date().toISOString(),
        // Expiración por defecto: 7 días
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        responseDate: null,
        responseMessage: null,
        acceptedAmount: null,
        acceptedPercentage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        invitations: [...state.invitations, newInvitation],
        loading: false
      }));

      return { success: true, data: newInvitation };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Responder a una invitación
  respondToInvitation: async (invitationId, response) => {
    set({ loading: true, error: null });
    try {
      const { status, amount, percentage, message } = response;

      const updatedInvitation = await investmentInvitationsService.update(invitationId, {
        status,
        responseDate: new Date().toISOString(),
        responseMessage: message || '',
        acceptedAmount: status === 'accepted' ? amount : null,
        acceptedPercentage: status === 'accepted' ? percentage : null,
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        invitations: state.invitations.map(inv =>
          inv.id === invitationId ? updatedInvitation : inv
        ),
        loading: false
      }));

      return { success: true, data: updatedInvitation };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar invitación
  updateInvitation: async (invitationId, invitationData) => {
    set({ loading: true, error: null });
    try {
      const updatedInvitation = await investmentInvitationsService.update(invitationId, {
        ...invitationData,
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        invitations: state.invitations.map(inv =>
          inv.id === invitationId ? updatedInvitation : inv
        ),
        loading: false
      }));

      return { success: true, data: updatedInvitation };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar invitación
  deleteInvitation: async (invitationId) => {
    set({ loading: true, error: null });
    try {
      await investmentInvitationsService.delete(invitationId);

      set((state) => ({
        invitations: state.invitations.filter(inv => inv.id !== invitationId),
        loading: false
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Marcar invitaciones expiradas
  markExpiredInvitations: async () => {
    const now = new Date();
    const { invitations } = get();

    const expiredInvitations = invitations.filter(
      inv => inv.status === 'pending' && new Date(inv.expirationDate) < now
    );

    for (const invitation of expiredInvitations) {
      await get().updateInvitation(invitation.id, { status: 'expired' });
    }

    return { success: true, count: expiredInvitations.length };
  },

  // Limpiar estado
  clearInvitations: () => set({ invitations: [], error: null })
}));