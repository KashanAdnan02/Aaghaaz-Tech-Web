import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { toast } from 'react-toastify';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Course = () => {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    days: [],
    timing: { startTime: '', endTime: '' },
    duration: '',
    price: '',
    modeOfDelivery: '',
    startingDate: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/courses');
      setCourses(response.data);
    } catch (error) {
      toast.error('Failed to fetch courses', { className: 'font-inter' });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('timing.')) {
      setFormData({
        ...formData,
        timing: {
          ...formData.timing,
          [name.split('.')[1]]: value,
        },
      });
    } else if (name === 'days') {
      if (checked) {
        setFormData({ ...formData, days: [...formData.days, value] });
      } else {
        setFormData({ ...formData, days: formData.days.filter(day => day !== value) });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/courses', formData);
      toast.success('Course created successfully', { className: 'font-inter' });
      setFormData({
        name: '',
        description: '',
        days: [],
        timing: { startTime: '', endTime: '' },
        duration: '',
        price: '',
        modeOfDelivery: '',
        startingDate: '',
      });
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course', { className: 'font-inter' });
    }
  };

  const handleDelete = async (courseId) => {
    try {
      await api.delete(`/api/courses/${courseId}`);
      toast.success('Course deleted successfully', { className: 'font-inter' });
      fetchCourses();
    } catch (error) {
      toast.error('Failed to delete course', { className: 'font-inter' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Course Management</h1>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Course</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Course Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Days</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(day => (
                <label key={day} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    name="days"
                    value={day}
                    checked={formData.days.includes(day)}
                    onChange={handleChange}
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timing.startTime">
                Start Time (HH:MM)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="timing.startTime"
                name="timing.startTime"
                type="time"
                required
                value={formData.timing.startTime}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timing.endTime">
                End Time (HH:MM)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="timing.endTime"
                name="timing.endTime"
                type="time"
                required
                value={formData.timing.endTime}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
                Duration (in weeks)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="duration"
                name="duration"
                type="number"
                min="1"
                required
                value={formData.duration}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                Price
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="price"
                name="price"
                type="number"
                min="0"
                required
                value={formData.price}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="modeOfDelivery">
              Mode of Delivery
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="modeOfDelivery"
              name="modeOfDelivery"
              required
              value={formData.modeOfDelivery}
              onChange={handleChange}
            >
              <option value="">Select Mode</option>
              <option value="Online">Online</option>
              <option value="Onsite">Onsite</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startingDate">
              Starting Date
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="startingDate"
              name="startingDate"
              type="date"
              required
              value={formData.startingDate}
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add Course
          </button>
        </form>
      </div>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-xl font-bold mb-4">Course List</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course._id} className="border rounded p-4">
              <h3 className="font-bold text-lg mb-2">{course.name}</h3>
              <p className="text-gray-600 mb-2">{course.description}</p>
              <p className="text-gray-500">Days: {course.days?.join(', ')}</p>
              <p className="text-gray-500">Time: {course.timing?.startTime} - {course.timing?.endTime}</p>
              <p className="text-gray-500">Duration: {course.duration} weeks</p>
              <p className="text-gray-500">Price: ${course.price}</p>
              <p className="text-gray-500">Mode: {course.modeOfDelivery}</p>
              <button
                onClick={() => handleDelete(course._id)}
                className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Course; 