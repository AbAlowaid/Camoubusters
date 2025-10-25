'use client'

import { useState, useEffect } from 'react'

interface ChartData {
  detectionsOverTime: Array<{
    timestamp: string
    count: number
  }>
  topEquipment: Array<{
    equipment: string
    count: number
  }>
}

interface DetectionChartsProps {
  data: ChartData
  onChartClick: (filter: { type: string; value: string }) => void
}

export default function DetectionCharts({ data, onChartClick }: DetectionChartsProps) {
  const handleEquipmentClick = (equipment: string) => {
    onChartClick({ type: 'equipment', value: equipment })
  }

  const handleTimePointClick = (timestamp: string) => {
    onChartClick({ type: 'timestamp', value: timestamp })
  }

  // Calculate max value for scaling
  const maxDetections = Math.max(...data.detectionsOverTime.map(d => d.count))
  const maxEquipmentCount = Math.max(...data.topEquipment.map(e => e.count))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Detections Over Time Chart */}
      <div className="professional-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Detections Over Time</h3>
          <div className="text-sm text-gray-500">Last 24 Hours</div>
        </div>

        {/* Chart Area */}
        <div className="relative h-64 mb-4">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="40"
                y1={y * 2}
                x2="380"
                y2={y * 2}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}

            {/* Y-axis labels */}
            {[0, 25, 50, 75, 100].map((y, i) => (
              <text
                key={y}
                x="35"
                y={y * 2 + 5}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {Math.round((maxDetections * (100 - y)) / 100)}
              </text>
            ))}

            {/* Chart lines */}
            <polyline
              points={data.detectionsOverTime.map((d, i) => 
                `${40 + (i * 340) / (data.detectionsOverTime.length - 1)},${200 - (d.count * 200) / maxDetections}`
              ).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              className="cursor-pointer hover:stroke-blue-400"
              onClick={() => handleTimePointClick(data.detectionsOverTime[0].timestamp)}
            />

            {/* X-axis labels */}
            {data.detectionsOverTime.filter((_, i) => i % 4 === 0).map((d, i) => (
              <text
                key={i}
                x={40 + (i * 4 * 340) / (data.detectionsOverTime.length - 1)}
                y="220"
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {new Date(d.timestamp).getHours()}:00
              </text>
            ))}
          </svg>
        </div>

        {/* Chart Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              Click on the line to filter detections by time
            </p>
          </div>
        </div>
      </div>

      {/* Top Equipment Chart */}
      <div className="professional-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Top Equipment</h3>
          <div className="text-sm text-gray-500">Detection Count</div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-4">
          {data.topEquipment.map((equipment, index) => (
            <div key={equipment.equipment} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  {equipment.equipment}
                </span>
                <span className="text-sm font-bold text-gray-900">{equipment.count}</span>
              </div>
              <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 hover:from-blue-400 hover:to-blue-500 cursor-pointer"
                  style={{ width: `${(equipment.count / maxEquipmentCount) * 100}%` }}
                  onClick={() => handleEquipmentClick(equipment.equipment)}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white mix-blend-difference">
                    {equipment.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              Click on bars to filter detections by equipment
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
