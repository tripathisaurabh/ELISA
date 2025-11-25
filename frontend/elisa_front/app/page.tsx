import React from 'react';

// Using a functional component named App for single-file React convention
export default function Home() {
  // SVG for the 'Launch Dashboard' button (Lightning Bolt)
  const LightningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2l-7 10h5l-1 10 7-10h-5l1-10z"></path>
    </svg>
  );

  // SVG for the 'View Patients' button (User/Person)
  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  return (
    // Updated styling for better visual match, keeping the light blue gradient
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-10 pb-20 px-4 sm:px-10">
      
      {/* Main Content Area: Reduced mt-8/mt-12 to mt-4/mt-6 */}
      <div className="text-center max-w-4xl mx-auto mt-4 sm:mt-6">
        
        {/* Top Tag */}
        <p className="text-xs sm:text-sm text-blue-700 mb-3 font-semibold tracking-wide uppercase">
          Built for ABDM — India's National Health Stack
        </p>

        {/* Title: Increased size to 6xl for greater impact */}
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-snug tracking-tight text-gray-900">
          Intelligent Clinical Co-Pilot <br />
          {/* Blue text for emphasis */}
          <span className="text-blue-600">for Modern Healthcare</span>
        </h1>

        {/* Description: Increased text size and updated content */}
        <p className="text-lg sm:text-xl text-gray-700 mt-6 max-w-3xl mx-auto">
          Agentic AI that transforms fragmented patient records into unified 
          clinical intelligence — highlighting drug interactions, risks, and trends <span className='font-semibold'>in seconds.</span>
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10">
          
          {/* Primary Button: Launch Dashboard */}
          <a
            href="/dashboard"
            className="flex items-center justify-center bg-blue-600 text-white px-7 py-3 font-semibold rounded-xl shadow-lg shadow-blue-500/50 hover:bg-blue-700 transition duration-300 transform hover:scale-[1.02] w-full sm:w-auto"
          >
            <LightningIcon />
            Launch Dashboard →
          </a>

          {/* Secondary Button: View Patients */}
          <a
            href="/patients"
            className="flex items-center justify-center bg-white text-gray-700 border border-gray-200 px-7 py-3 font-medium rounded-xl shadow-md hover:bg-gray-50 transition duration-300 w-full sm:w-auto"
          >
            <UserIcon />
            View Patients
          </a>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-24 max-w-4xl mx-auto">
        
        {/* Card 1: Updated description text */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center transition duration-300 hover:shadow-2xl">
          <h2 className="text-blue-600 text-3xl font-bold">&lt; 10s</h2>
          <p className="text-gray-500 text-sm mt-1">Clinical Summary Generation</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center transition duration-300 hover:shadow-2xl">
          <h2 className="text-blue-600 text-3xl font-bold">100%</h2>
          <p className="text-gray-500 text-sm mt-1">ABDM Compliant</p>
        </div>

        {/* Card 3: Updated description text */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center transition duration-300 hover:shadow-2xl">
          <h2 className="text-blue-600 text-3xl font-bold">0</h2>
          <p className="text-gray-500 text-sm mt-1">Data Storage</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center transition duration-300 hover:shadow-2xl">
          <h2 className="text-blue-600 text-3xl font-bold">24/7</h2>
          <p className="text-gray-500 text-sm mt-1">Decision Support</p>
        </div>
      </div>
    </div>
  );
}