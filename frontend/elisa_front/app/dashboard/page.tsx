export default function DashboardPage() {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>
  
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Total Patients</h2>
            <p className="text-3xl font-bold text-blue-600 mt-3">120</p>
          </div>
  
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Reports Today</h2>
            <p className="text-3xl font-bold text-green-600 mt-3">18</p>
          </div>
  
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">AI Tasks</h2>
            <p className="text-3xl font-bold text-purple-600 mt-3">45</p>
          </div>
  
        </div>
      </div>
    );
  }
  