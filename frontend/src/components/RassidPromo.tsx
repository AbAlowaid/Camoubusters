'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MoraqibPromo() {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Don't show on Moraqib page
    if (pathname === '/moraqib') {
      return
    }

    // Show after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 10000)

    return () => clearTimeout(timer)
  }, [pathname])

  if (!isVisible || isClosed || pathname === '/moraqib') {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 slide-in-up">
      <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg shadow-2xl p-6 max-w-sm">
        {/* Close button */}
        <button
          onClick={() => setIsClosed(true)}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center float">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg">Try Moraqib AI</h3>
            <p className="text-sm text-white/90">Natural language queries</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-white/90 mb-4">
          Want to query detection reports using AI? Chat with Moraqib for instant insights!
        </p>

        {/* CTA Button */}
        <Link href="/moraqib">
          <button className="w-full bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl">
            Chat with Moraqib →
          </button>
        </Link>

        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-lg blur-xl -z-10"></div>
      </div>
    </div>
  )
}
