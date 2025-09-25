import { create } from 'zustand'
import { MockAPI } from '../services/mock/server.js'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  initializeAuth: () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user)
        set({
          user: parsedUser,
          token,
          isAuthenticated: true
        })
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  },
  
  login: async (email, password) => {
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.authenticate(email, password)
      const { user, token } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null
      })
      
      return { success: true, user }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  register: async (userData) => {
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.register(userData)
      
      set({
        loading: false,
        error: null
      })
      
      return { success: true, message: response.message }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null
    })
  },
  
  clearError: () => {
    set({ error: null })
  }
}))