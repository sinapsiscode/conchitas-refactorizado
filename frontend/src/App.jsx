import React, { useState, useEffect } from 'react'
import { useAuthStore } from './stores' // Importación centralizada
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/maricultor/DashboardPage'
import SectorsPage from './pages/maricultor/SectorsPage'
import SeedingPage from './pages/maricultor/SeedingPage'
import ExpensesPage from './pages/maricultor/ExpensesPage'
import InventoryPage from './pages/maricultor/InventoryPage'
import MonitoringPage from './pages/maricultor/MonitoringPage'
import SeedingMonitoringPage from './pages/maricultor/LotMonitoringPage'
import HarvestPage from './pages/maricultor/HarvestPage'
import IncomePage from './pages/maricultor/IncomePage'
import ProjectedPage from './pages/maricultor/ProjectedPage'
import SettingsPage from './pages/maricultor/SettingsPage'
import ReportsPage from './pages/maricultor/ReportsPage'
import InvestorDashboard from './pages/investor/InvestorDashboard'
import InvestorInvestments from './pages/investor/InvestorInvestments'
import InvestorSeedingsPage from './pages/investor/InvestorSeedingsPage'
import InvestorReturnsPage from './pages/investor/InvestorReturnsPage'
import InvestorReportsPage from './pages/investor/InvestorReportsPage'
import InvestorTools from './pages/investor/InvestorTools'
import InvestorsPage from './pages/maricultor/InvestorsPage'
import EmptyState from './components/common/EmptyState'

function App() {
  const { isAuthenticated, initializeAuth, user } = useAuthStore()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showRegister, setShowRegister] = useState(false)
  const [selectedLotId, setSelectedLotId] = useState(null)
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    // seedData() // Ya no necesario con JSON Server
    initializeAuth()
  }, [initializeAuth])

  // Establecer página correcta después de la inicialización
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'investor') {
        setCurrentPage('investor-dashboard')
      } else {
        setCurrentPage('dashboard')
      }
    }
  }, [isAuthenticated, user])
  
  const handleLoginSuccess = (action, loggedInUser) => {
    if (action === 'register') {
      setShowRegister(true)
    } else {
      // Set default page based on user role
      if (loggedInUser?.role === 'investor') {
        setCurrentPage('investor-dashboard')
      } else {
        setCurrentPage('dashboard')
      }
    }
  }
  
  const handleBackToLogin = () => {
    setShowRegister(false)
  }
  
  const handleRegistrationSuccess = () => {
    setShowRegister(false)
  }
  
  const handlePageChange = (page) => {
    setCurrentPage(page)
    setSelectedLotId(null) // Reset lot selection when changing pages
    setIsMobileMenuOpen(false) // Close mobile menu when navigating
  }

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }
  
  const handleNavigateToLot = (lotId) => {
    setSelectedLotId(lotId)
    setCurrentPage('lot-monitoring')
  }
  
  const handleBackFromLotMonitoring = () => {
    setSelectedLotId(null)
    setCurrentPage('monitoring')
  }
  
  const renderPage = () => {
    // Handle investor-specific routes
    if (user?.role === 'investor') {
      switch (currentPage) {
        case 'investor-dashboard':
        case 'dashboard':
          return <InvestorDashboard onNavigate={(page, id) => {
            if (page === 'investment-details') {
              setSelectedInvestmentId(id)
              setCurrentPage(page)
            } else {
              handlePageChange(page)
            }
          }} />
        case 'investor-investments':
          return <InvestorInvestments onNavigate={(page, id) => {
            if (page === 'investment-details') {
              setSelectedInvestmentId(id)
              setCurrentPage(page)
            } else {
              handlePageChange(page)
            }
          }} />
        case 'investor-seedings':
          return <InvestorSeedingsPage />
        case 'investor-returns':
          return <InvestorReturnsPage />
        case 'investor-reports':
          return <InvestorReportsPage />
        case 'investor-tools':
          return <InvestorTools />
        default:
          return <InvestorDashboard onNavigate={handlePageChange} />
      }
    }
    
    // Maricultor routes
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handlePageChange} />
      case 'sectors':
        return <SectorsPage />
      case 'seeding':
        return <SeedingPage />
      case 'monitoring':
        return <MonitoringPage onNavigateToLot={handleNavigateToLot} />
      case 'lot-monitoring':
        return (
          <SeedingMonitoringPage 
            lotId={selectedLotId} 
            onBack={handleBackFromLotMonitoring} 
          />
        )
      case 'harvest':
        return <HarvestPage />
      case 'income':
        return <IncomePage />
      case 'projected':
        return <ProjectedPage />
      case 'expenses':
        return <ExpensesPage />
      case 'inventory':
        return <InventoryPage />
      case 'settings':
        return <SettingsPage />
      case 'reports':
        return <ReportsPage />
      case 'investments':
        return <InvestorsPage />
      default:
        return <DashboardPage onNavigate={handlePageChange} />
    }
  }
  
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <RegisterPage
          onBackToLogin={handleBackToLogin}
          onRegistrationSuccess={handleRegistrationSuccess}
        />
      )
    }
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        onToggleMobileMenu={handleToggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={handlePageChange}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />
      <main className="pt-16 sm:pt-18">
        {renderPage()}
      </main>
    </div>
  )
}

export default App