import { useState, useEffect } from 'react';
import api from '../utils/axios';

const AllCourses = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/courses');
      setCourses(response.data);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(search.toLowerCase()) ||
    course.description.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (course) => {
    setEditingId(course._id);
    setEditData({ ...course });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      await api.put(`/courses/${editingId}`, editData);
      setSuccess('Course updated successfully');
      setEditingId(null);
      fetchCourses();
    } catch (err) {
      setError('Failed to update course');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Courses</h1>
      <input
        type="text"
        placeholder="Search courses..."
        className="mb-4 px-4 py-2 border rounded w-full max-w-md"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => (
            <div key={course._id} className="border rounded p-4 bg-white shadow">
              {editingId === course._id ? (
                <>
                  <input
                    className="mb-2 border rounded px-2 py-1 w-full"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                  />
                  <textarea
                    className="mb-2 border rounded px-2 py-1 w-full"
                    name="description"
                    value={editData.description}
                    onChange={handleEditChange}
                  />
                  <input
                    className="mb-2 border rounded px-2 py-1 w-full"
                    name="duration"
                    type="number"
                    value={editData.duration}
                    onChange={handleEditChange}
                  />
                  <input
                    className="mb-2 border rounded px-2 py-1 w-full"
                    name="price"
                    type="number"
                    value={editData.price}
                    onChange={handleEditChange}
                  />
                  <select
                    className="mb-2 border rounded px-2 py-1 w-full"
                    name="modeOfDelivery"
                    value={editData.modeOfDelivery}
                    onChange={handleEditChange}
                  >
                    <option value="">Select Mode</option>
                    <option value="Online">Online</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                  <button className="bg-green-500 text-white px-3 py-1 rounded mr-2" onClick={saveEdit}>Save</button>
                  <button className="bg-gray-300 px-3 py-1 rounded" onClick={cancelEdit}>Cancel</button>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-lg mb-2">{course.name}</h3>
                  <p className="text-gray-600 mb-2">{course.description}</p>
                  <p className="text-gray-500">Duration: {course.duration} weeks</p>
                  <p className="text-gray-500">Price: ${course.price}</p>
                  <p className="text-gray-500">Mode: {course.modeOfDelivery}</p>
                  <button className="bg-blue-500 text-white px-3 py-1 rounded mt-2" onClick={() => startEdit(course)}>Edit</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllCourses; 