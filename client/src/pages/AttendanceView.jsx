import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { format } from 'date-fns';

const AttendanceView = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchRollId, setSearchRollId] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'single'
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/api/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to fetch courses');
      }
    };

    fetchCourses();
  }, []);

  // Fetch attendance based on view mode
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedCourse) return;

      try {
        setLoading(true);
        let response;

        if (viewMode === 'single' && searchRollId) {
          response = await api.get(`/api/attendance/roll/${searchRollId}`, {
            params: {
              courseId: selectedCourse,
              startDate: dateRange.startDate,
              endDate: dateRange.endDate
            }
          });
        } else {
          response = await api.get(`/api/attendance/course/${selectedCourse}`, {
            params: {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate
            }
          });
        }
        setAttendance(response.data);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setError('Failed to fetch attendance records');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedCourse, dateRange, viewMode, searchRollId]);

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedCourse) return;

      try {
        const response = await api.get('/api/attendance/stats', {
          params: {
            courseId: selectedCourse,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStats();
  }, [selectedCourse, dateRange]);

  const handleDateRangeChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setViewMode('single');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Attendance Records</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select a course</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateRangeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateRangeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Search by Roll Number */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Roll Number
            </label>
            <input
              type="text"
              value={searchRollId}
              onChange={(e) => setSearchRollId(e.target.value)}
              placeholder="Enter roll number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
        </div>
      ) : selectedCourse ? (
        <>
          {/* Statistics */}
          {stats && viewMode === 'all' && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Attendance Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="text-sm font-medium text-gray-500">Total Classes</h3>
                  <p className="text-2xl font-semibold">{stats.totalClasses}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="text-sm font-medium text-gray-500">Present</h3>
                  <p className="text-2xl font-semibold text-green-600">{stats.attendanceByStatus.present}</p>
                </div>
                <div className="bg-red-50 p-4 rounded">
                  <h3 className="text-sm font-medium text-gray-500">Absent</h3>
                  <p className="text-2xl font-semibold text-red-600">{stats.attendanceByStatus.absent}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <h3 className="text-sm font-medium text-gray-500">Late</h3>
                  <p className="text-2xl font-semibold text-yellow-600">{stats.attendanceByStatus.late}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Records */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map(record => (
                  record.students.map(student => (
                    <tr key={`${record._id}-${student.studentId._id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.studentId.firstName} {student.studentId.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.studentId.rollId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${student.status === 'present' ? 'bg-green-100 text-green-800' : ''}
                          ${student.status === 'absent' ? 'bg-red-100 text-red-800' : ''}
                          ${student.status === 'late' ? 'bg-yellow-100 text-yellow-800' : ''}
                        `}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.remarks || '-'}
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-4 text-gray-500">
          Please select a course to view attendance records
        </div>
      )}
    </div>
  );
};

export default AttendanceView; 