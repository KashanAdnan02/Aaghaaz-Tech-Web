import { useState, useEffect } from 'react';
import api from '../utils/axios';

function isClassHappeningNow(course) {
  if (!course.days || !course.timing) return false;
  const now = new Date();
  const dayName = now.toLocaleString('en-US', { weekday: 'long' });
  if (!course.days.includes(dayName)) return false;
  const [nowHour, nowMinute] = [now.getHours(), now.getMinutes()];
  const [startHour, startMinute] = course.timing.startTime.split(':').map(Number);
  const [endHour, endMinute] = course.timing.endTime.split(':').map(Number);
  const nowMinutes = nowHour * 60 + nowMinute;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
}

const CourseSessions = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/courses');
      setCourses(response.data.filter(isClassHappeningNow));
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ongoing Classes</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.length === 0 ? (
            <div className="text-gray-500">No classes are happening right now.</div>
          ) : (
            courses.map(course => (
              <div key={course._id} className="border rounded p-4 bg-white shadow">
                <h3 className="font-bold text-lg mb-2">{course.name}</h3>
                <p className="text-gray-600 mb-2">{course.description}</p>
                <p className="text-gray-500">Days: {course.days?.join(', ')}</p>
                <p className="text-gray-500">Time: {course.timing?.startTime} - {course.timing?.endTime}</p>
                <p className="text-gray-500">Duration: {course.duration} weeks</p>
                <p className="text-gray-500">Mode: {course.modeOfDelivery}</p>
                <p className="text-gray-500">Price: ${course.price}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CourseSessions; 