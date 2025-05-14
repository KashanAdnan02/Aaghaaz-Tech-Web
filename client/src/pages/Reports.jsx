import React from 'react';

const Reports = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Student Performance Reports</h2>
        <p className="text-gray-600 mb-4">
          Generate and view reports on student attendance, grades, and performance.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors">
            <h3 className="font-medium mb-2">Attendance Report</h3>
            <p className="text-sm text-gray-500">View student attendance trends and statistics</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors">
            <h3 className="font-medium mb-2">Course Completion</h3>
            <p className="text-sm text-gray-500">Track course completion rates by student</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors">
            <h3 className="font-medium mb-2">Performance Analytics</h3>
            <p className="text-sm text-gray-500">Analyze student performance metrics</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">System Reports</h2>
        <p className="text-gray-600 mb-4">
          View reports about system usage, enrollments, and financial information.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-green-50 cursor-pointer transition-colors">
            <h3 className="font-medium mb-2">Enrollment Statistics</h3>
            <p className="text-sm text-gray-500">View enrollment trends by course and time period</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-green-50 cursor-pointer transition-colors">
            <h3 className="font-medium mb-2">Financial Summary</h3>
            <p className="text-sm text-gray-500">Generate financial reports and statements</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-green-50 cursor-pointer transition-colors">
            <h3 className="font-medium mb-2">Usage Analytics</h3>
            <p className="text-sm text-gray-500">Analyze system usage patterns</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 