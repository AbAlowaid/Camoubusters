'use client'

export default function AboutPage() {
  const teamMembers = [
    {
      id: 1,
      name: 'Saif Alotaibi',
      role: 'Team Leader',
      description: 'Leading the project development and team coordination',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com'
    },
    {
      id: 2,
      name: 'Fatimah Alsubaie',
      role: 'Data Scientist',
      description: 'Specialized in machine learning and model development',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com'
    },
    {
      id: 3,
      name: 'Abdulrahman Attar',
      role: 'Data Analyst',
      description: 'Focused on data analysis and insights extraction',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com'
    },
    {
      id: 4,
      name: 'Mousa Alotowi',
      role: 'Data Scientist',
      description: 'Specialized in data science and machine learning',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com'
    },
    {
      id: 5,
      name: 'Abdulelah Alowaid',
      role: 'Data Scientist',
      description: 'Expert in deep learning and computer vision',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center mb-4">
          About Us
        </h1>
        <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
          Meet the team behind Mirqab - a dedicated group of engineers and researchers 
          passionate about leveraging AI for advanced detection systems
        </p>

        {/* Project Overview */}
        <section className="max-w-4xl mx-auto mb-16">
          <div className="professional-card rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Project Overview</h2>
            <p className="text-lg text-gray-700 mb-4">
              Mirqab is an advanced AI-powered detection and monitoring system developed as 
              a capstone project representing the culmination of advanced studies in machine 
              learning, computer vision, and web development.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Our system combines state-of-the-art deep learning models with modern 
              web technologies to create a practical, real-world application for automated 
              detection and intelligent analysis.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
                <svg className="w-12 h-12 mx-auto mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                <h3 className="font-bold text-lg mb-2 text-gray-800">Academic Excellence</h3>
                <p className="text-sm text-gray-600">
                  Built on cutting-edge research in deep learning
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                <svg className="w-12 h-12 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="font-bold text-lg mb-2 text-gray-800">Modern Tech Stack</h3>
                <p className="text-sm text-gray-600">
                  Leveraging React, FastAPI, and PyTorch
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
                <svg className="w-12 h-12 mx-auto mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="font-bold text-lg mb-2 text-gray-800">Real-World Impact</h3>
                <p className="text-sm text-gray-600">
                  Practical applications in security and defense
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center mb-12">
            Meet the Team
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 justify-items-center">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="professional-card rounded-lg p-6 hover:shadow-xl transition transform hover:-translate-y-2 w-full max-w-xs"
              >
                {/* Profile Picture Placeholder */}
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                  {member.name.charAt(0)}
                </div>

                {/* Member Info */}
                <h3 className="text-xl font-bold text-center mb-2 text-gray-800">{member.name}</h3>
                <p className="text-blue-600 font-semibold text-center mb-3">{member.role}</p>
                <p className="text-gray-600 text-center text-sm mb-4">{member.description}</p>

                {/* Social Links */}
                <div className="flex justify-center gap-4">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-600 transition"
                    title="GitHub"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-600 transition"
                    title="LinkedIn"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a
                    href={member.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-600 transition"
                    title="Twitter"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Beneficiaries Section */}
        <section className="max-w-4xl mx-auto mb-16">
          <div className="professional-card rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 text-center">
              Project Beneficiaries
            </h2>
            <p className="text-lg text-gray-700 text-center mb-8">
              This system is designed to benefit key defense and security organizations in Saudi Arabia
            </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition">
              <div className="flex items-center justify-center h-24 mb-4">
                <img 
                  src="/SAMI.webp" 
                  alt="SAMI Logo" 
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
              <h3 className="font-bold text-lg mb-2">SAMI</h3>
              <p className="text-sm text-gray-600">
                Saudi Arabian Military Industries - Advancing defense manufacturing capabilities
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition">
              <div className="flex items-center justify-center h-24 mb-4">
                <img 
                  src="/GAMI.webp" 
                  alt="GAMI Logo" 
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
              <h3 className="font-bold text-lg mb-2">GAMI</h3>
              <p className="text-sm text-gray-600">
                General Authority for Military Industries - Supporting defense sector development
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition">
              <div className="flex items-center justify-center h-24 mb-4">
                <img 
                  src="/SAFCSP.png" 
                  alt="SAFCSP Logo" 
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
              <h3 className="font-bold text-lg mb-2">SAFCSP</h3>
              <p className="text-sm text-gray-600">
                Saudi Federation for Cybersecurity, Programming and Drones
              </p>
            </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
