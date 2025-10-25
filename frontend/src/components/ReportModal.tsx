'use client'

import { generatePDF } from '@/utils/pdfGenerator'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import map to avoid SSR issues
const LocationMap = dynamic(() => import('./LocationMap'), { ssr: false })

interface Report {
  report_id: string
  timestamp: string
  location: { latitude: number; longitude: number } | null
  analysis: {
    summary: string
    environment: string
    soldier_count: number
    attire_and_camouflage: string
    equipment: string
  }
  images: {
    original_base64: string
    masked_base64: string
  }
}

interface ReportModalProps {
  report: Report
  isOpen: boolean
  onClose: () => void
}

export default function ReportModal({ report, isOpen, onClose }: ReportModalProps) {
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('')
  const [maskedImageUrl, setMaskedImageUrl] = useState<string>('')

  useEffect(() => {
    if (!isOpen) return

    // Convert base64 to blob URLs to avoid URL length limits
    const createBlobUrl = (base64String: string): string => {
      try {
        // Remove data URI prefix if present
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/jpeg' })
        return URL.createObjectURL(blob)
      } catch (error) {
        console.error('Error creating blob URL:', error)
        return ''
      }
    }

    const originalUrl = createBlobUrl(report.images.original_base64)
    const maskedUrl = createBlobUrl(report.images.masked_base64)
    
    setOriginalImageUrl(originalUrl)
    setMaskedImageUrl(maskedUrl)

    // Cleanup blob URLs when component unmounts
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      if (maskedUrl) URL.revokeObjectURL(maskedUrl)
    }
  }, [isOpen, report.images.original_base64, report.images.masked_base64])

  if (!isOpen) return null

  const handleDownloadPDF = () => {
    generatePDF(report)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
           onClick={(e) => e.stopPropagation()}
           style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="sticky top-0 bg-blue-700 text-white p-6 flex items-center justify-between rounded-t-lg z-10">
          <h2 className="text-2xl font-bold">Detection Report</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 relative" style={{ zIndex: 1 }}>
          {/* Report ID and Timestamp */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Report ID</p>
                <p className="font-mono text-sm">{report.report_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Timestamp</p>
                <p className="font-semibold">{new Date(report.timestamp).toLocaleString()}</p>
              </div>
            </div>
            {report.location && report.location.latitude !== 0 && (
              <div className="mt-4 relative" style={{ zIndex: 0 }}>
                <p className="text-sm text-gray-600 mb-2 font-semibold">📍 Detection Location</p>
                <p className="text-xs text-gray-600 mb-3">
                  Coordinates: {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)}
                </p>
                <div className="relative" style={{ zIndex: 0 }}>
                  <LocationMap 
                    latitude={report.location.latitude} 
                    longitude={report.location.longitude}
                    timestamp={report.timestamp}
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-primary">AI Analysis</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-gray-600 mb-1">Summary</p>
                <p className="text-gray-800">{report.analysis.summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                  <p className="text-sm text-gray-600 mb-1">Environment</p>
                  <p className="font-semibold text-gray-800">{report.analysis.environment}</p>
                </div>

                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-sm text-gray-600 mb-1">Soldier Count</p>
                  <p className="font-semibold text-gray-800 text-2xl">{report.analysis.soldier_count}</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-gray-600 mb-1">Attire & Camouflage</p>
                <p className="text-gray-800">{report.analysis.attire_and_camouflage}</p>
              </div>

              <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                <p className="text-sm text-gray-600 mb-1">Equipment</p>
                <p className="text-gray-800">{report.analysis.equipment}</p>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-primary">Visual Evidence</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2 font-semibold">Original Image</p>
                {originalImageUrl ? (
                  <img
                    src={originalImageUrl}
                    alt="Original"
                    className="w-full rounded-lg border shadow"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Loading image...</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2 font-semibold">Segmented Result</p>
                {maskedImageUrl ? (
                  <img
                    src={maskedImageUrl}
                    alt="Segmented"
                    className="w-full rounded-lg border shadow"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Loading image...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              📄 Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
