import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaDownload } from 'react-icons/fa';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterField, setFilterField] = useState('');
    const [filterValue, setFilterValue] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        cnic: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        },
        guardianName: '',
        guardianPhone: '',
        guardianRelation: '',
        enrolledCourses: [],
        status: 'Pending',
        profilePicture: null
    });

    // Track if filters are active
    const filtersActive = searchTerm || filterField || filterValue || sortField !== 'createdAt' || sortOrder !== 'desc';

    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
        fetchCourses();
    }, [currentPage, sortField, sortOrder]);

    // Add separate effect for filter changes that will be triggered by the Apply Filters button
    useEffect(() => {
        // Show filter status in page title for visual feedback
        document.title = filtersActive ? 'Students (Filtered)' : 'Students';
    }, [filtersActive]);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/api/courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('Failed to fetch available courses');
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/students', {
                params: {
                    page: currentPage,
                    search: searchTerm,
                    sortField,
                    sortOrder,
                    filterField,
                    filterValue
                }
            });
            setStudents(response.data.students);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            setError('Failed to fetch students');
            toast.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    // Sort handler function
    const handleSort = (field) => {
        // If clicking the same field, toggle sort order
        if (field === sortField) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // If clicking a new field, set it as sort field and default to ascending
            setSortField(field);
            setSortOrder('asc');
        }
        setCurrentPage(1); // Reset to first page when sorting changes
    };

    // Return sort icon based on current sort state
    const getSortIcon = (field) => {
        if (sortField !== field) {
            return (
                <span className="text-gray-300 ml-1">
                    <span className="inline-block">⇵</span>
                </span>
            );
        }
        return sortOrder === 'asc'
            ? <span className="text-blue-500 ml-1">↑</span>
            : <span className="text-blue-500 ml-1">↓</span>;
    };

    // Apply filters
    const applyFilters = () => {
        setCurrentPage(1);
        fetchStudents();
    };

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setFilterField('');
        setFilterValue('');
        setSortField('createdAt');
        setSortOrder('desc');
        setCurrentPage(1);
        fetchStudents();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            console.log("WOrk");

            const addressField = name.split('.')[1];
            console.log(addressField);

            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData);

        if (submitting) return;

        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'profilePicture' && formData[key]) {
                    formDataToSend.append(key, formData[key]);
                } else if (key === 'address') {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else if (key === 'enrolledCourses') {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else if (key !== 'profilePicture') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            if (editingStudent) {
                await api.put(`/api/students/${editingStudent._id}`, formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 120000
                });
                toast.success('Student updated successfully');
            } else {
                const response = await api.post('/api/students/register', formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 120000
                });
                toast.success('Student registered successfully. An ID card has been sent to their email.');
            }
            fetchStudents();
            setShowForm(false);
            resetForm();
        } catch (error) {
            console.error('Error saving student:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error saving student';

            if (errorMessage.includes('timeout') || error.code === 'ECONNABORTED') {
                toast.error('The upload timed out. Please try with a smaller image or check your network connection.');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file && file.size > 2 * 1024 * 1024) {
            toast.error('Image size must be less than 2MB to prevent timeout errors');
            e.target.value = '';
            return;
        }

        setFormData({
            ...formData,
            profilePicture: file
        });
    };

    const handleEdit = (student) => {
        // Extract course IDs from student.enrolledCourses
        const courseIds = student.enrolledCourses?.map(course => course.courseId?._id || course.courseId) || [];

        setEditingStudent(student);
        setFormData({
            ...student,
            enrolledCourses: courseIds,
            password: '' // Clear password when editing
        });
        setShowForm(true);
    };

    const handleDelete = async (studentId) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await api.delete(`/api/students/${studentId}`);
                toast.success('Student deleted successfully');
                fetchStudents();
            } catch (error) {
                toast.error('Failed to delete student');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            cnic: '',
            phoneNumber: '',
            dateOfBirth: '',
            gender: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            guardianName: '',
            guardianPhone: '',
            guardianRelation: '',
            enrolledCourses: [],
            status: 'Pending',
            profilePicture: null
        });
        setEditingStudent(null);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchStudents();
    };

    // Handle course selection
    const handleCourseChange = (courseId) => {
        setFormData(prev => {
            // Check if the course is already selected
            const isSelected = prev.enrolledCourses.includes(courseId);

            if (isSelected) {
                // If selected, remove it
                return {
                    ...prev,
                    enrolledCourses: prev.enrolledCourses.filter(id => id !== courseId)
                };
            } else {
                // If not selected, add it
                return {
                    ...prev,
                    enrolledCourses: [...prev.enrolledCourses, courseId]
                };
            }
        });
    };

    const handleExportCSV = async () => {
        try {
            const response = await api.get('/api/students/export/csv', {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Create a download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'students.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting CSV:', error);
            toast.error('Error exporting students data');
        }
    };

    return (
        <div className="relative">
            {/* Overlay for when sidebar is open */}
            {showForm && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-30 z-10"
                    onClick={() => setShowForm(false)}
                ></div>
            )}

            {/* Sliding sidebar for student form */}
            <div className={`fixed top-0 right-0 bottom-0 w-4/8 bg-white shadow-xl z-20 transition-transform duration-300 ease-in-out overflow-auto ${showForm ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl font-semibold">
                        {editingStudent ? 'Edit Student' : 'Add New Student'}
                    </h2>
                    <button
                        onClick={() => setShowForm(false)}
                        className="text-gray-500 hover:text-gray-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-[calc(100%-4rem)] overflow-auto">
                    {/* Main Form Content - Left Side */}
                    <div className="p-6 flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                {!editingStudent && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CNIC</label>
                                    <input
                                        type="text"
                                        name="cnic"
                                        value={formData.cnic}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth.slice(0, 10)}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            name="address.street"
                                            placeholder="Street"
                                            value={formData?.address?.street}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            name="address.city"
                                            placeholder="City"
                                            value={formData?.address?.city}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            name="address.state"
                                            placeholder="State"
                                            value={formData?.address?.state}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            name="address.zipCode"
                                            placeholder="ZIP Code"
                                            value={formData?.address?.zipCode}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            name="address.country"
                                            placeholder="Country"
                                            value={formData?.address?.country}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                                    <input
                                        type="text"
                                        name="guardianName"
                                        value={formData.guardianName}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Guardian Phone</label>
                                    <input
                                        type="tel"
                                        name="guardianPhone"
                                        value={formData.guardianPhone}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Guardian Relation</label>
                                    <input
                                        type="text"
                                        name="guardianRelation"
                                        value={formData.guardianRelation}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Enrolled">Enrolled</option>
                                        <option value="Eliminated">Eliminated</option>
                                        <option value="Suspended">Suspended</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                                    <input
                                        type="file"
                                        name="profilePicture"
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full"
                                        accept="image/*"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {editingStudent ? 'Updating...' : 'Registering...'}
                                        </span>
                                    ) : (
                                        editingStudent ? 'Update' : 'Register'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar for Courses - Right Side */}
                    <div className="p-6 border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50 w-full md:w-80">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Enrollment</h3>

                        {courses.length === 0 ? (
                            <div className="text-gray-500 text-sm">
                                No courses available
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {courses.map(course => (
                                    <div key={course._id} className="border border-gray-200 rounded-md p-3 bg-white">
                                        <div className="flex items-start">
                                            <input
                                                type="checkbox"
                                                id={`course-${course._id}`}
                                                checked={formData.enrolledCourses.includes(course._id)}
                                                onChange={() => handleCourseChange(course._id)}
                                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={`course-${course._id}`} className="ml-3 block">
                                                <span className="text-sm font-medium text-gray-700">{course.name}</span>
                                                <div className="mt-1 text-xs text-gray-500">
                                                    <div className="flex items-center">
                                                        <span className="font-semibold mr-1">Days:</span>
                                                        {course.days.join(', ')}
                                                    </div>
                                                    <div className="flex items-center mt-1">
                                                        <span className="font-semibold mr-1">Time:</span>
                                                        {course.timing.startTime} - {course.timing.endTime}
                                                    </div>
                                                    <div className="flex items-center mt-1">
                                                        <span className="font-semibold mr-1">Mode:</span>
                                                        {course.modeOfDelivery}
                                                    </div>
                                                    <div className="flex items-center mt-1">
                                                        <span className="font-semibold mr-1">Duration:</span>
                                                        {course.duration} weeks
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center">
                    Students
                    {filtersActive && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Filtered
                        </span>
                    )}
                </h1>
                <div className="flex gap-4">
                    <button
                        onClick={handleExportCSV}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                    >
                        <FaDownload /> Export CSV
                    </button>
                    <button
                        onClick={() => navigate('/students/add')}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Add Student
                    </button>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-3">Search & Filter</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Search bar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search by name, email, CNIC..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter by field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter Field</label>
                        <select
                            value={filterField}
                            onChange={(e) => setFilterField(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">-- Select Field --</option>
                            <option value="firstName">First Name</option>
                            <option value="lastName">Last Name</option>
                            <option value="email">Email</option>
                            <option value="cnic">CNIC</option>
                            <option value="phoneNumber">Phone Number</option>
                            <option value="status">Status</option>
                            <option value="gender">Gender</option>
                        </select>
                    </div>

                    {/* Filter value */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter Value</label>
                        <input
                            type="text"
                            placeholder="Enter filter value"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            disabled={!filterField}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>

                    {/* Sort by field - can be added later if needed */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <select
                            value={sortField}
                            onChange={(e) => {
                                setSortField(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="createdAt">Date Added</option>
                            <option value="rollId">Roll Number</option>
                            <option value="firstName">First Name</option>
                            <option value="lastName">Last Name</option>
                            <option value="email">Email</option>
                            <option value="cnic">CNIC</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <select
                        value={sortOrder}
                        onChange={(e) => {
                            setSortOrder(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>

                    <button
                        onClick={applyFilters}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Apply Filters
                    </button>

                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Profile
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('rollId')}
                                    >
                                        Roll No {getSortIcon('rollId')}
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('firstName')}
                                    >
                                        Name {getSortIcon('firstName')}
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('cnic')}
                                    >
                                        CNIC {getSortIcon('cnic')}
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('status')}
                                    >
                                        Status {getSortIcon('status')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Courses
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No students found matching your criteria
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <tr key={student._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        {student.profilePicture ? (
                                                            <img
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                src={student.profilePicture}
                                                                alt={`${student.firstName} ${student.lastName}`}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <span className="text-gray-500 text-sm">
                                                                    {student.firstName[0]}{student.lastName[0]}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{student.rollId || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.firstName} {student.lastName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{student.cnic}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${student.status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                                                        student.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            student.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.enrolledCourses && student.enrolledCourses.length > 0 ? (
                                                    <div className="text-sm text-gray-900">
                                                        {student.enrolledCourses.map((course, index) => (
                                                            <div key={index} className="mb-1">
                                                                <span className="font-medium">{course.courseId?.name || 'Unknown Course'}</span>
                                                                {course.courseId?.timing && (
                                                                    <span className="text-xs text-gray-500 ml-1">
                                                                        ({course.courseId.timing.startTime} - {course.courseId.timing.endTime})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">No courses</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        handleEdit(student);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

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
                </>
            )}
        </div>
    );
};

export default Students; 