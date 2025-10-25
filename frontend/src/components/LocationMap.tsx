'use client'

import { useEffect, useRef, useState } from 'react'

interface LocationMapProps {
  latitude: number
  longitude: number
  timestamp?: string
}

export default function LocationMap({ latitude, longitude, timestamp }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mapRef.current) return

    // Load Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    link.crossOrigin = ''
    document.head.appendChild(link)

    // Load Leaflet JS and create map
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    script.crossOrigin = ''
    script.async = true
    
    script.onload = () => {
      if (!mapRef.current) return
      
      // @ts-ignore - Leaflet is loaded via CDN
      const L = window.L
      
      // Create map
      const map = L.map(mapRef.current).setView([latitude, longitude], 15)
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)
      
      // Create custom red marker icon
      const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
      
      // Add marker with popup
      const marker = L.marker([latitude, longitude], { icon: redIcon }).addTo(map)
      
      const popupContent = `
        <div style="text-align: center; min-width: 200px;">
          <p style="font-weight: bold; color: #dc2626; margin-bottom: 8px;">⚠️ Detection Location</p>
          <p style="font-size: 14px; margin-bottom: 4px;">
            📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
          </p>
          ${timestamp ? `
            <p style="font-size: 12px; color: #666; margin-top: 4px;">
              🕐 ${new Date(timestamp).toLocaleString()}
            </p>
          ` : ''}
        </div>
      `
      
      marker.bindPopup(popupContent)
    }
    
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link)
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [isClient, latitude, longitude, timestamp])

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-96 rounded-lg overflow-hidden shadow-lg border-2 border-primary"
      style={{ zIndex: 0 }}
    />
  )
}
