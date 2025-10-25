'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import map to avoid SSR issues
const LocationMap = dynamic(() => import('../LocationMap'), { ssr: false })

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

interface DetectionModalProps {
  detection: DetectionEvent
  isOpen: boolean
  onClose: () => void
}

export default function DetectionModal({ detection, isOpen, onClose }: DetectionModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'remediation'>('overview')
  const [newStatus, setNewStatus] = useState(detection.status)
  const [newAssignee, setNewAssignee] = useState(detection.assignee)

  if (!isOpen) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Closed - False Positive': return 'bg-gray-100 text-gray-800'
      case 'Closed - Remediated': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusUpdate = () => {
    // Here you would typically make an API call to update the status
    console.log('Updating status to:', newStatus)
    // For now, just close the modal
    onClose()
  }

  const handleAssigneeUpdate = () => {
    // Here you would typically make an API call to update the assignee
    console.log('Updating assignee to:', newAssignee)
    // For now, just close the modal
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden relative"
           onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Detection Report</h2>
              <div className="flex items-center space-x-4 text-blue-100">
                <span>ID: {detection.report_id}</span>
                <span>•</span>
                <span>{detection.timestamp}</span>
                <span>•</span>
                <span>{detection.soldier_count} Soldier{detection.soldier_count > 1 ? 's' : ''} Detected</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Overview */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Detection Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Detection Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Current Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(detection.status || 'New')}`}>
                        {detection.status || 'New'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Soldier Count</label>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        {detection.soldier_count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Device Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Source Device</label>
                    <div className="mt-1 text-sm font-mono text-gray-900">{detection.source_device_id}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Environment</label>
                    <div className="mt-1 text-sm text-gray-900">{detection.environment}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Attire & Camouflage</label>
                    <div className="mt-1 text-sm text-gray-900">{detection.attire_and_camouflage}</div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Equipment</label>
                    <div className="mt-1 text-sm text-gray-900">{detection.equipment}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Update Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed - False Positive">Closed - False Positive</option>
                      <option value="Closed - Remediated">Closed - Remediated</option>
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Update Status
                    </button>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Assign To</label>
                    <select
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="John Doe">John Doe</option>
                      <option value="Jane Smith">Jane Smith</option>
                      <option value="Mike Johnson">Mike Johnson</option>
                      <option value="Sarah Wilson">Sarah Wilson</option>
                      <option value="Unassigned">Unassigned</option>
                    </select>
                    <button
                      onClick={handleAssigneeUpdate}
                      className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Tabs */}
          <div className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'location', label: 'Location', icon: '📍' },
                  { id: 'images', label: 'Images', icon: '📷' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{detection.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Detection Created</div>
                          <div className="text-xs text-gray-500">{new Date(detection.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Status: {detection.status}</div>
                          <div className="text-xs text-gray-500">Current status</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Assigned to: {detection.assignee}</div>
                          <div className="text-xs text-gray-500">Current assignee</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Detection Summary</h3>
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
                      <p className="text-gray-800">
                        Detected {detection.soldier_count} soldier{detection.soldier_count > 1 ? 's' : ''} in {detection.environment.toLowerCase()}. 
                        The personnel were wearing {detection.attire_and_camouflage.toLowerCase()} and carrying {detection.equipment.toLowerCase()}.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Detection Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Detection Created</div>
                          <div className="text-xs text-gray-500">{detection.timestamp}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Status: {detection.status || 'New'}</div>
                          <div className="text-xs text-gray-500">Current status</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Assigned to: {detection.assignee || 'Unassigned'}</div>
                          <div className="text-xs text-gray-500">Current assignee</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'location' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Location</h3>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Latitude:</span>
                        <span className="ml-2 font-mono">{detection.location.latitude.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Longitude:</span>
                        <span className="ml-2 font-mono">{detection.location.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <LocationMap 
                      latitude={detection.location.latitude} 
                      longitude={detection.location.longitude}
                      timestamp={detection.timestamp}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-2">Original Image</h4>
                      {detection.image_snapshot_url ? (
                        <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow relative">
                          <img
                            src={detection.image_snapshot_url}
                            alt="Original detection image"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onClick={() => window.open(detection.image_snapshot_url, '_blank')}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center">
                                    <div class="text-center">
                                      <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                      </svg>
                                      <p class="text-gray-500">Image not available</p>
                                      <p class="text-xs text-gray-400 mt-1">Failed to load from storage</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center pointer-events-none">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-500">Original image not stored</p>
                            <p className="text-xs text-gray-400 mt-1">Images are processed in real-time</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-2">Segmented Detection</h4>
                      {detection.segmented_image_url ? (
                        <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow relative">
                          <img
                            src={detection.segmented_image_url}
                            alt="Segmented detection result"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onClick={() => window.open(detection.segmented_image_url, '_blank')}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center">
                                    <div class="text-center">
                                      <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                      <p class="text-gray-500">Image not available</p>
                                      <p class="text-xs text-gray-400 mt-1">Failed to load from storage</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center pointer-events-none">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500">Segmented image not stored</p>
                            <p className="text-xs text-gray-400 mt-1">Images are processed in real-time</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-blue-800 font-medium">Image Storage</p>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      Images are automatically stored in Firebase Storage when detections are processed. 
                      If images are not available, they may still be processing or the detection was created before storage was enabled.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Report ID: {detection.report_id} • Last Updated: {new Date().toLocaleString()}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Export functionality would go here
                  console.log('Exporting detection:', detection.report_id)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
