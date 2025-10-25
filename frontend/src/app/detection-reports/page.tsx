'use client'

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
import KPICards from '@/components/DetectionReports/KPICards'
import DetectionCharts from '@/components/DetectionReports/DetectionCharts'
import DetectionTable from '@/components/DetectionReports/DetectionTable'
import DetectionModal from '@/components/DetectionReports/DetectionModal'
import TimeRangeFilter from '@/components/DetectionReports/TimeRangeFilter'

// Detection report data structure matching your actual Firebase reports
interface DetectionEvent {
  report_id: string
  timestamp: string
  location: {
    latitude: number
    longitude: number
  }
  soldier_count: number
  attire_and_camouflage: string
  environment: string
  equipment: string
  image_snapshot_url: string
  source_device_id: string
  // Additional fields for SOC dashboard functionality
  severity?: 'Critical' | 'High' | 'Medium' | 'Low'
  status?: 'New' | 'In Progress' | 'Closed - False Positive' | 'Closed - Remediated'
  assignee?: string
  segmented_image_url?: string
}

interface KPIData {
  totalReports: number
  totalSoldiersDetected: number
  alertsByStatus: {
    new: number
    inProgress: number
    closed: number
  }
}

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

export default function DetectionReportsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [selectedDetection, setSelectedDetection] = useState<DetectionEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detections, setDetections] = useState<DetectionEvent[]>([])
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch real data from API
  useEffect(() => {
    const fetchDetectionData = async () => {
      setLoading(true)
      try {
        // Fetch detection reports from backend API
        const reportsResponse = await fetch(`${API_URL}/api/detection-reports?time_range=${timeRange}&limit=100`)
        const reportsData = await reportsResponse.json()

        if (reportsData.success) {
          setDetections(reportsData.detections)

          // Calculate real KPI data from actual reports
          const totalReports = reportsData.detections.length
          const totalSoldiersDetected = reportsData.detections.reduce((sum, d) => sum + d.soldier_count, 0)

          setKpiData({
            totalReports: totalReports,
            totalSoldiersDetected: totalSoldiersDetected,
            alertsByStatus: {
              new: totalReports, // All detections are new in your system
              inProgress: 0,
              closed: 0
            }
          })

          // Generate real chart data from actual detections
          const detectionsByHour = Array.from({ length: 24 }, (_, i) => {
            const hourStart = new Date(Date.now() - (23 - i) * 60 * 60 * 1000)
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)

            const hourDetections = reportsData.detections.filter(detection => {
              const detectionTime = new Date(detection.timestamp)
              return detectionTime >= hourStart && detectionTime < hourEnd
            })

            return {
              timestamp: hourStart.toISOString(),
              count: hourDetections.length
            }
          })

          // Generate real equipment data
          const equipmentCounts = reportsData.detections.reduce((acc, detection) => {
            const equipment = detection.equipment || 'Unknown'
            acc[equipment] = (acc[equipment] || 0) + 1
            return acc
          }, {} as Record<string, number>)

          const topEquipment = Object.entries(equipmentCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([equipment, count]) => ({ equipment, count }))

          setChartData({
            detectionsOverTime: detectionsByHour,
            topEquipment: topEquipment
          })

        } else {
          console.error('Failed to fetch detection reports:', reportsData.error)
          // If no data available, show empty state
          setDetections([])
          setKpiData({
            totalReports: 0,
            totalSoldiersDetected: 0,
            alertsByStatus: {
              new: 0,
              inProgress: 0,
              closed: 0
            }
          })
          setChartData({
            detectionsOverTime: [],
            topEquipment: []
          })
        }

      } catch (error) {
        console.error('Error fetching detection data:', error)
        // If API fails, show empty state
        setDetections([])
        setKpiData({
          totalDetections: 0,
          criticalAlerts: 0,
          mttd: 'N/A',
          mttr: 'N/A',
          alertsByStatus: {
            new: 0,
            inProgress: 0,
            closed: 0
          }
        })
        setChartData({
          detectionsOverTime: [],
          topEnvironments: []
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDetectionData()
  }, [timeRange])

  const handleDetectionClick = (detection: DetectionEvent) => {
    setSelectedDetection(detection)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDetection(null)
  }

  const handleTimeRangeChange = (newRange: '24h' | '7d' | '30d') => {
    setTimeRange(newRange)
    setLoading(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Detection Reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Detection Reports
              </h1>
              <p className="text-gray-600 text-lg">
                Security Operations Center - Real-time Security Monitoring Dashboard
              </p>
            </div>
            <TimeRangeFilter 
              currentRange={timeRange} 
              onRangeChange={handleTimeRangeChange} 
            />
          </div>
        </div>

        {/* Row 1: Key Performance Indicators */}
        <div className="mb-8">
          <KPICards data={kpiData!} />
        </div>

        {/* Row 2: Key Visualizations */}
        <div className="mb-8">
          <DetectionCharts 
            data={chartData!} 
            onChartClick={(filter) => {
              // Handle chart click filtering
              console.log('Chart filter applied:', filter)
            }}
          />
        </div>

        {/* Row 3: Main Detection Report Table */}
        <div className="mb-8">
          <DetectionTable 
            detections={detections}
            onDetectionClick={handleDetectionClick}
            timeRange={timeRange}
          />
        </div>
      </div>

      {/* Detection Detail Modal */}
      {selectedDetection && (
        <DetectionModal
          detection={selectedDetection}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
