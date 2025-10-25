'use client'

import Link from 'next/link'

export default function HomePage() {
  const metrics = {
    train: {
      iou: 0.9248,
      precision: 0.9572,
      recall: 0.9625,
      f1: 0.9598,
      map: 0.9598
    },
    validation: {
      iou: 0.9245,
      precision: 0.9574,
      recall: 0.9610,
      f1: 0.9592,
      map: 0.9592
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white py-20 fade-in">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Mirqab
            </h1>
            <p className="text-2xl text-blue-100 mb-8 font-light">
              Advanced AI-powered detection system using state-of-the-art deep learning technology for intelligent monitoring and automated analysis
            </p>
            
            {/* Ready to Test CTA Box */}
            <div className="mt-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl max-w-xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Ready to Test the System?</h2>
              <p className="text-blue-100 mb-6">
                Experience the power of AI-driven detection technology
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/upload">
                  <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-glow-blue w-full sm:w-auto">
                    Upload Analysis
                  </button>
                </Link>
                <Link href="/moraqib">
                  <button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-glow-purple w-full sm:w-auto">
                    Try Moraqib AI
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* System Overview Section */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h3 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            System Overview
          </h3>
          <div className="professional-card p-8">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Mirqab is an advanced AI-powered detection and monitoring system designed to provide 
              intelligent analysis and automated reporting capabilities for security and monitoring applications. 
              The system leverages cutting-edge deep learning technology to automatically analyze images, 
              generate detailed reports, and provide actionable intelligence.
            </p>
          </div>
        </section>

        {/* System Capabilities Section */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h3 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            System Capabilities
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="professional-card p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3">Accurate Detection</h4>
              <p className="text-gray-700">
                High precision detection using DeepLabV3 ResNet-101 semantic segmentation model
              </p>
            </div>

            <div className="professional-card p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3">Intelligent Reporting</h4>
              <p className="text-gray-700">
                AI-powered reports with detailed analysis using Google Gemini 2.5 Flash vision API
              </p>
            </div>

            <div className="professional-card p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3">User-Friendly Interface</h4>
              <p className="text-gray-700">
                Intuitive web platform for image upload and real-time analysis
              </p>
            </div>

            <div className="professional-card p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3">Automated Documentation</h4>
              <p className="text-gray-700">
                Exportable PDF reports with detection metadata and location tracking
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
