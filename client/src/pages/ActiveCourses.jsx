import { useState, useEffect } from 'react';
import api from '../utils/axios';

const ActiveCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActiveCourses();
  }, []);

  const fetchActiveCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/courses');
      setCourses(response.data.filter(course => course.isActive));
    } catch (err) {
      setError('Failed to fetch active courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Active Courses</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <div key={course._id} className="border rounded p-4 bg-white shadow">
              <h3 className="font-bold text-lg mb-2">{course.name}</h3>
              <p className="text-gray-600 mb-2">{course.description}</p>
              <p className="text-gray-500">Days: {course.days?.join(', ')}</p>
              <p className="text-gray-500">Time: {course.timing?.startTime} - {course.timing?.endTime}</p>
              <p className="text-gray-500">Duration: {course.duration} weeks</p>
              <p className="text-gray-500">Mode: {course.modeOfDelivery}</p>
              <p className="text-gray-500">Price: ${course.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveCourses; 