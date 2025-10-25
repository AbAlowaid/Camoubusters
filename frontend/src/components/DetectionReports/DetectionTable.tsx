'use client'

import { useState, useMemo } from 'react'

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

interface DetectionTableProps {
  detections: DetectionEvent[]
  onDetectionClick: (detection: DetectionEvent) => void
  timeRange: '24h' | '7d' | '30d'
}

type SortField = 'timestamp' | 'report_id' | 'soldier_count' | 'source_device_id' | 'status'
type SortDirection = 'asc' | 'desc'

export default function DetectionTable({ detections, onDetectionClick, timeRange }: DetectionTableProps) {
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const sortedAndFilteredDetections = useMemo(() => {
    let filtered = detections.filter(detection => {
      const matchesStatus = statusFilter === 'all' || detection.status === statusFilter
      const matchesSearch = searchTerm === '' || 
        detection.report_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detection.source_device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detection.environment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detection.attire_and_camouflage.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesStatus && matchesSearch
    })

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Special handling for timestamp sorting
      if (sortField === 'timestamp') {
        aValue = new Date(a.timestamp).getTime()
        bValue = new Date(b.timestamp).getTime()
      }

      // Special handling for soldier_count sorting
      if (sortField === 'soldier_count') {
        aValue = a.soldier_count
        bValue = b.soldier_count
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [detections, sortField, sortDirection, statusFilter, searchTerm])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Closed - False Positive': return 'bg-gray-100 text-gray-800'
      case 'Closed - Remediated': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    )
  }

  return (
    <div className="professional-card p-6">
      {/* Table Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Detection Events</h3>
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search detections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filters */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed - False Positive">Closed - False Positive</option>
            <option value="Closed - Remediated">Closed - Remediated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th 
                className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center">
                  Timestamp
                  <SortIcon field="timestamp" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('report_id')}
              >
                <div className="flex items-center">
                  Report ID
                  <SortIcon field="report_id" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('soldier_count')}
              >
                <div className="flex items-center">
                  Soldier Count
                  <SortIcon field="soldier_count" />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Environment</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Attire & Camouflage</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Equipment</th>
              <th 
                className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('source_device_id')}
              >
                <div className="flex items-center">
                  Source Device
                  <SortIcon field="source_device_id" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredDetections.map((detection) => (
              <tr
                key={detection.report_id}
                className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => onDetectionClick(detection)}
              >
                <td className="py-3 px-4 text-sm text-gray-600">
                  {detection.timestamp}
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900 font-mono text-sm">{detection.report_id}</div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  <div className="text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      {detection.soldier_count}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                  {detection.environment}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                  {detection.attire_and_camouflage}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                  {detection.equipment}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                  {detection.source_device_id}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(detection.status || 'New')}`}>
                    {detection.status || 'New'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2">
                      {(detection.assignee || 'U').charAt(0)}
                    </div>
                    {detection.assignee || 'Unassigned'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedAndFilteredDetections.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No detections found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      {/* Table Footer */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {sortedAndFilteredDetections.length} of {detections.length} detections
        </div>
        <div className="flex items-center space-x-2">
          <span>Click on any row to view details</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
