'use client'

import { useState, useEffect } from 'react'

interface KPIData {
  totalReports: number
  totalSoldiersDetected: number
  alertsByStatus: {
    new: number
    inProgress: number
    closed: number
  }
}

interface KPICardsProps {
  data: KPIData
}

export default function KPICards({ data }: KPICardsProps) {
  const [animatedValues, setAnimatedValues] = useState({
    totalReports: 0,
    totalSoldiersDetected: 0,
    newAlerts: 0,
    inProgressAlerts: 0,
    closedAlerts: 0
  })

  // Animate numbers on mount
  useEffect(() => {
    const animateValue = (key: keyof typeof animatedValues, target: number, duration: number = 1000) => {
      const start = Date.now()
      const startValue = animatedValues[key]
      
      const animate = () => {
        const now = Date.now()
        const progress = Math.min((now - start) / duration, 1)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = Math.round(startValue + (target - startValue) * easeOutQuart)
        
        setAnimatedValues(prev => ({ ...prev, [key]: currentValue }))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
    }

    // Animate each value with slight delays
    setTimeout(() => animateValue('totalReports', data.totalReports), 100)
    setTimeout(() => animateValue('totalSoldiersDetected', data.totalSoldiersDetected), 200)
    setTimeout(() => animateValue('newAlerts', data.alertsByStatus.new), 300)
    setTimeout(() => animateValue('inProgressAlerts', data.alertsByStatus.inProgress), 400)
    setTimeout(() => animateValue('closedAlerts', data.alertsByStatus.closed), 500)
  }, [data])

  const totalAlerts = data.alertsByStatus.new + data.alertsByStatus.inProgress + data.alertsByStatus.closed

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Reports */}
      <div className="professional-card p-6 hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Real-time</div>
            <div className="text-sm font-semibold text-green-600">Live</div>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {animatedValues.totalReports.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">No. of Reports</div>
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-3/4"></div>
        </div>
      </div>

      {/* Total Soldiers Detected */}
      <div className="professional-card p-6 hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Detected</div>
            <div className="text-sm font-semibold text-red-600">Soldiers</div>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {animatedValues.totalSoldiersDetected.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">No. of Soldiers Detected</div>
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full w-1/2"></div>
        </div>
      </div>

      {/* Alerts by Status - Donut Chart */}
      <div className="professional-card p-6 hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wider">total</div>
            <div className="text-sm font-semibold text-gray-600">{totalAlerts}</div>
          </div>
        </div>
        
        {/* Simple Donut Chart */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 40 40">
            {/* Background circle */}
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* New alerts */}
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeDasharray={`${(animatedValues.newAlerts / totalAlerts) * 100} 100`}
              strokeDashoffset="0"
            />
            {/* In Progress alerts */}
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="8"
              strokeDasharray={`${(animatedValues.inProgressAlerts / totalAlerts) * 100} 100`}
              strokeDashoffset={`-${(animatedValues.newAlerts / totalAlerts) * 100}`}
            />
            {/* Closed alerts */}
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeDasharray={`${(animatedValues.closedAlerts / totalAlerts) * 100} 100`}
              strokeDashoffset={`-${((animatedValues.newAlerts + animatedValues.inProgressAlerts) / totalAlerts) * 100}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{totalAlerts}</div>
              <div className="text-xs text-gray-500">Alerts</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600">New</span>
            </div>
            <span className="font-semibold">{animatedValues.newAlerts}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-gray-600">In Progress</span>
            </div>
            <span className="font-semibold">{animatedValues.inProgressAlerts}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Closed</span>
            </div>
            <span className="font-semibold">{animatedValues.closedAlerts}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
