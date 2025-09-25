import React from 'react'
import MyInvestments from '../../components/investments/MyInvestments'

const InvestorInvestments = ({ onNavigate }) => {
  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <MyInvestments onNavigate={onNavigate} />
    </div>
  )
}

export default InvestorInvestments