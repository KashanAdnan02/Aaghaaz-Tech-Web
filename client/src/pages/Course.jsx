import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaFilter, FaTimes } from 'react-icons/fa';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Course = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterMode, setFilterMode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    days: [],
    timing: { startTime: '', endTime: '' },
    duration: '',
    price: '',
    modeOfDelivery: '',
    startingDate: '',
    outline: '',
    requirements: '',
    poster: ''
  });

  useEffect(() => {
    fetchCourses();
  }, [currentPage]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/courses', {
        params: {
          page: currentPage,
          search: searchTerm,
          mode: filterMode
        }
      });
      setCourses(response.data.courses || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch courses', { className: 'font-inter' });
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'poster' && files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, poster: reader.result });
      };
      reader.readAsDataURL(files[0]);
    } else if (name.startsWith('timing.')) {
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
    try {
      const submitData = { ...formData };
      if (editingCourse) {
        await api.put(`/api/courses/${editingCourse._id}`, submitData);
        toast.success('Course updated successfully', { className: 'font-inter' });
      } else {
        await api.post('/api/courses', submitData);
        toast.success('Course created successfully', { className: 'font-inter' });
      }
      setShowForm(false);
      resetForm();
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save course', { className: 'font-inter' });
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await api.delete(`/api/courses/${courseId}`);
        toast.success('Course deleted successfully', { className: 'font-inter' });
        fetchCourses();
      } catch (error) {
        toast.error('Failed to delete course', { className: 'font-inter' });
      }
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      days: course.days,
      timing: course.timing,
      duration: course.duration,
      price: course.price,
      modeOfDelivery: course.modeOfDelivery,
      startingDate: course.startingDate,
      outline: course.outline || '',
      requirements: course.requirements || '',
      poster: course.poster || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      days: [],
      timing: { startTime: '', endTime: '' },
      duration: '',
      price: '',
      modeOfDelivery: '',
      startingDate: '',
      outline: '',
      requirements: '',
      poster: ''
    });
    setEditingCourse(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCourses();
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchCourses();
    setShowFilterPopover(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMode('');
    setCurrentPage(1);
    fetchCourses();
    setShowFilterPopover(false);
  };

  // Table row click handler
  const handleRowClick = (course, e) => {
    // Prevent modal on edit/delete button click
    if (e.target.closest('button')) return;
    setSelectedCourse(course);
    setShowDetails(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Add Course button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          Courses
          {(searchTerm || filterMode) && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Filtered
            </span>
          )}
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Course
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-3">Search & Filter</h2>
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
          <div className="w-full">
            <input
              type="text"
              placeholder="Search by course name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
            />
          </div>
          <div>
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className="px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow flex items-center gap-2"
            >
              <FaFilter className="inline-block" />
              Filter
            </button>
            {showFilterPopover && (
              <div
                className="absolute right-0 mt-2 mr-4 z-40 bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-80"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">Filter Options</span>
                  <button onClick={() => setShowFilterPopover(false)} className="text-gray-400 hover:text-gray-700">
                    <FaTimes />
                  </button>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode of Delivery</label>
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-2"
                  >
                    <option value="">All Modes</option>
                    <option value="Online">Online</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Apply
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course List Table */}

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto max-w-full mx-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {console.log(courses)}
              {!courses || courses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                    No courses found matching your criteria
                  </td>
                </tr>

              ) : (
                courses.map((course) => (
                  <tr key={course._id} className="cursor-pointer hover:bg-blue-50" onClick={(e) => handleRowClick(course, e)}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{course.name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{course.days.join(', ')}</div>
                        <div className="text-xs text-gray-500">
                          {course.timing.startTime} - {course.timing.endTime}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{course.duration} weeks</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${course.price}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {course.modeOfDelivery}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(course)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <FaEdit className="inline-block mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash className="inline-block mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Sliding sidebar for course form */}
      <div className={`fixed top-0 right-0 bottom-0 w-full md:w-3/4 bg-white shadow-xl z-20 transition-transform duration-300 ease-in-out overflow-auto ${showForm ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-semibold">
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </h2>
          <button
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
            className="text-gray-500 hover:text-gray-800"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Course Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mode of Delivery</label>
                <select
                  name="modeOfDelivery"
                  value={formData.modeOfDelivery}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Mode</option>
                  <option value="Online">Online</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Poster Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Poster</label>
              <input
                type="file"
                name="poster"
                accept="image/*"
                onChange={handleChange}
                className="mt-1 block w-full"
              />
              {formData.poster && (
                <img src={formData.poster} alt="Course Poster Preview" className="mt-2 h-32 object-contain rounded border" />
              )}
            </div>

            {/* Outline */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Outline</label>
              <textarea
                name="outline"
                value={formData.outline}
                onChange={handleChange}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Requirements</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows="2"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => (
                  <label key={day} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="days"
                      value={day}
                      checked={formData.days.includes(day)}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="time"
                  name="timing.startTime"
                  value={formData.timing.startTime}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="time"
                  name="timing.endTime"
                  value={formData.timing.endTime}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (weeks)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Starting Date</label>
              <input
                type="date"
                name="startingDate"
                value={formData.startingDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingCourse ? 'Update Course' : 'Add Course'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Course Details Modal */}
      {showDetails && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-0 relative overflow-hidden animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-2 focus:outline-none"
              onClick={() => setShowDetails(false)}
              aria-label="Close"
            >
              <FaTimes size={22} />
            </button>
            <div className="flex flex-col md:flex-row">
              {/* Poster */}
              <div className="md:w-1/3 flex flex-col items-center justify-center bg-gray-50 p-6 border-b md:border-b-0 md:border-r">
                {selectedCourse.poster ? (
                  <img src={selectedCourse.poster} alt="Poster" className="h-48 w-auto object-contain rounded-lg shadow mb-4" />
                ) : (
                  <div className="h-48 w-full flex items-center justify-center bg-gray-200 rounded-lg mb-4 text-gray-400">No Poster</div>
                )}
                <div className="text-center mt-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold">
                    {selectedCourse.modeOfDelivery}
                  </span>
                </div>
              </div>
              {/* Details */}
              <div className="md:w-2/3 p-6 overflow-y-auto max-h-[80vh]">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">{selectedCourse.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                  <div>
                    <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Days</div>
                    <div className="text-sm text-gray-800">{selectedCourse.days.join(', ')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Time</div>
                    <div className="text-sm text-gray-800">{selectedCourse.timing.startTime} - {selectedCourse.timing.endTime}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Duration</div>
                    <div className="text-sm text-gray-800">{selectedCourse.duration} weeks</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Price</div>
                    <div className="text-sm text-gray-800">${selectedCourse.price}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Starting Date</div>
                    <div className="text-sm text-gray-800">{selectedCourse.startingDate ? new Date(selectedCourse.startingDate).toLocaleDateString() : ''}</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Outline</div>
                  <div className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded p-3 border border-gray-100">
                    {selectedCourse.outline}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Requirements</div>
                  <div className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded p-3 border border-gray-100">
                    {selectedCourse.requirements}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Course; 

// import React from 'react'

// const Course = () => {
//   return (
//     <div>Course</div>
//   )
// }

// export default Course