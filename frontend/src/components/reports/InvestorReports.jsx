import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores'
import { useInvestmentStore } from '../../stores'
import { reportService } from '../../services/reports/reportService'
import { UI_TEXTS } from '../../constants/ui'
import Swal from 'sweetalert2'

const InvestorReports = () => {
  const { user } = useAuthStore()
  const { 
    investments, 
    distributions, 
    investorReturns,
    fetchInvestorReturns,
    loading 
  } = useInvestmentStore()
  
  const [reportType, setReportType] = useState('complete')
  const [dateRange, setDateRange] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [generating, setGenerating] = useState(false)
  
  useEffect(() => {
    if (user?.id && user.role === 'investor') {
      fetchInvestorReturns(user.id)
    }
  }, [user, fetchInvestorReturns])
  
  const handleGeneratePDF = async () => {
    setGenerating(true)
    
    try {
      // Filter data based on date range
      const filteredData = filterDataByDateRange()
      
      // Generate PDF
      const fileName = reportService.generateInvestmentReportPDF(
        user,
        filteredData.investments,
        filteredData.distributions,
        investorReturns || calculateSummary()
      )
      
      Swal.fire({
        icon: 'success',
        title: 'Reporte Generado',
        text: `El reporte PDF "${fileName}" se ha descargado exitosamente.`,
        confirmButtonColor: '#3b82f6'
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el reporte PDF. Por favor, intente nuevamente.',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setGenerating(false)
    }
  }
  
  const handleGenerateExcel = async () => {
    setGenerating(true)
    
    try {
      // Filter data based on date range
      const filteredData = filterDataByDateRange()
      
      // Generate Excel
      const fileName = reportService.generateInvestmentReportExcel(
        user,
        filteredData.investments,
        filteredData.distributions,
        investorReturns || calculateSummary()
      )
      
      Swal.fire({
        icon: 'success',
        title: 'Reporte Generado',
        text: `El archivo Excel "${fileName}" se ha descargado exitosamente.`,
        confirmButtonColor: '#3b82f6'
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el archivo Excel. Por favor, intente nuevamente.',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setGenerating(false)
    }
  }
  
  const filterDataByDateRange = () => {
    let filteredInvestments = [...investments]
    let filteredDistributions = [...distributions]
    
    if (dateRange !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'semester':
          startDate.setMonth(now.getMonth() - 6)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
        case 'custom':
          if (customStartDate) {
            startDate = new Date(customStartDate)
          }
          break
        default:
          break
      }
      
      const endDate = dateRange === 'custom' && customEndDate 
        ? new Date(customEndDate) 
        : now
      
      filteredInvestments = investments.filter(inv => {
        const invDate = new Date(inv.investmentDate)
        return invDate >= startDate && invDate <= endDate
      })
      
      filteredDistributions = distributions.filter(dist => {
        const distDate = new Date(dist.distributionDate)
        return distDate >= startDate && distDate <= endDate
      })
    }
    
    return {
      investments: filteredInvestments,
      distributions: filteredDistributions
    }
  }
  
  const calculateSummary = () => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)
    const totalReturned = distributions.reduce((sum, dist) => sum + dist.distributedAmount, 0)
    const averageROI = distributions.length > 0
      ? distributions.reduce((sum, dist) => sum + dist.roi, 0) / distributions.length
      : 0
    
    return {
      totalInvested,
      totalReturned,
      netProfit: totalReturned - totalInvested,
      averageROI,
      activeInvestments: investments.filter(inv => inv.status === 'active').length,
      completedInvestments: investments.filter(inv => inv.status === 'completed').length
    }
  }
  
  const getReportTypeOptions = () => {
    return [
      { value: 'complete', label: 'Reporte Completo' },
      { value: 'investments', label: 'Solo Inversiones' },
      { value: 'distributions', label: 'Solo Distribuciones' },
      { value: 'summary', label: 'Resumen Ejecutivo' }
    ]
  }
  
  const getDateRangeOptions = () => {
    return [
      { value: 'all', label: 'Todo el período' },
      { value: 'month', label: 'Último mes' },
      { value: 'quarter', label: 'Último trimestre' },
      { value: 'semester', label: 'Último semestre' },
      { value: 'year', label: 'Último año' },
      { value: 'custom', label: 'Personalizado' }
    ]
  }
  
  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Generación de Reportes
        </h2>
        <p className="text-sm text-gray-600">
          Descarga reportes detallados de tus inversiones y retornos
        </p>
      </div>
      
      {/* Report Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Reporte
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getReportTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getDateRangeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
      
      {/* Preview Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Vista Previa del Reporte
        </h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Tipo: {getReportTypeOptions().find(o => o.value === reportType)?.label}</p>
          <p>• Período: {getDateRangeOptions().find(o => o.value === dateRange)?.label}</p>
          <p>• Inversiones incluidas: {filterDataByDateRange().investments.length}</p>
          <p>• Distribuciones incluidas: {filterDataByDateRange().distributions.length}</p>
        </div>
      </div>
      
      {/* Export Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleGeneratePDF}
          disabled={generating || loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {generating ? 'Generando...' : 'Descargar PDF'}
        </button>
        
        <button
          onClick={handleGenerateExcel}
          disabled={generating || loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2zM9 12h6" />
          </svg>
          {generating ? 'Generando...' : 'Descargar Excel'}
        </button>
      </div>
      
      {/* Information Note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Los reportes incluyen toda la información financiera detallada de tus inversiones, 
              distribuciones y análisis de rendimiento. Los archivos se descargan automáticamente 
              en tu carpeta de descargas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvestorReports