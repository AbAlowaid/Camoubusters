'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-2xl">
      {/* Top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-lg border-2 border-blue-400/30">
                <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-wider text-white group-hover:text-blue-300 transition-colors">
                Mirqab
              </div>
              <div className="text-xs text-gray-300 uppercase tracking-widest">
                Detection System
              </div>
            </div>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex space-x-2">
            <NavLink href="/" isActive={isActive('/')}>
              Home
            </NavLink>
            <NavLink href="/detection-reports" isActive={isActive('/detection-reports')}>
              Detection Reports
            </NavLink>
            <NavLink href="/upload" isActive={isActive('/upload')}>
              Upload
            </NavLink>
            <NavLink href="/moraqib" isActive={isActive('/moraqib')}>
              Moraqib AI
            </NavLink>
            <NavLink href="/about" isActive={isActive('/about')}>
              About
            </NavLink>
          </div>
        </div>
      </div>
      
      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
    </nav>
  )
}

// Navigation Link Component
function NavLink({ href, isActive, children }: { href: string; isActive: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`
        relative px-6 py-2 font-semibold text-sm uppercase tracking-wider
        transition-all duration-300 rounded-md
        ${isActive 
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glow-blue scale-105' 
          : 'text-gray-200 hover:text-white hover:bg-blue-700/50'
        }
      `}
    >
      <span>{children}</span>
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
      )}
    </Link>
  )
}
