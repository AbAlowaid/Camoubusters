'use client'

import { useEffect, useState } from 'react'

export default function AILoadingAnimation() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Hide animation after 1 second
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 animate-fadeOut">
      <div className="relative animate-scaleIn">
        {/* Simplified AI icon */}
        <div className="relative w-32 h-32">
          {/* Center icon */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-glow-blue animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>

          {/* Simple orbiting dots */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2"
              style={{
                transform: `rotate(${i * 120}deg) translateY(-50px)`,
                animation: `spin 1.5s linear infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
          ))}
        </div>

        {/* Text */}
        <div className="mt-6 text-center">
          <p className="text-xl font-semibold text-white">Moraqib AI</p>
        </div>
      </div>
    </div>
  )
}
