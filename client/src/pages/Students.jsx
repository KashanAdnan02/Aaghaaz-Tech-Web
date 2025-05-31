import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaDownload, FaFilter, FaTimes, FaCheckCircle } from 'react-icons/fa';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const coursesCache = useRef(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditSuccess, setShowEditSuccess] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCourseId, setFilterCourseId] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [showFilterPopover, setShowFilterPopover] = useState(false);
    const filterButtonRef = useRef(null);
    console.log(students);


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
    const filtersActive = searchTerm || filterCourseId || filterCity;

    const navigate = useNavigate();

    const [showSuccess, setShowSuccess] = useState(false);

    // Optimized course fetching with caching
    const fetchCourses = async (forceRefresh = false) => {
        // Return cached courses if available and not forcing refresh
        if (coursesCache.current && !forceRefresh) {
            setCourses(coursesCache.current);
            return;
        }

        try {
            setCoursesLoading(true);
            const response = await api.get('/api/courses', {
                params: {
                    fields: 'name,days,timing,modeOfDelivery,duration,_id', // Only fetch required fields
                    limit: 100 // Adjust based on your needs
                }
            });
            const coursesData = response.data.courses || [];
            setCourses(coursesData);
            coursesCache.current = coursesData; // Cache the courses
            response.headers.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
        } catch (error) {
            console.error('Error fetching courses:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch available courses';
            toast.error(errorMessage);
        } finally {
            setCoursesLoading(false);
        }
    };

    // Optimized student fetching with debouncing
    const fetchStudents = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                search: searchTerm || undefined,
                courseId: filterCourseId || undefined,
                city: filterCity || undefined,
                limit: 10 // Adjust based on your needs
            };

            // Remove undefined parameters
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            // Log the params for debugging
            console.log('Fetching students with params:', params);

            const response = await api.get('/api/students', { params });

            // Log the response for debugging
            console.log('Students response:', response.data);

            setStudents(response.data.students);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch students';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Load courses on component mount
    useEffect(() => {
        fetchCourses();
    }, []);

    // Load students when page or filters change
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchStudents();
        }, 300); // Debounce for 300ms

        return () => clearTimeout(debounceTimer);
    }, [currentPage, searchTerm, filterCourseId, filterCity]);

    // Optimized course selection handler
    const handleCourseChange = useCallback((courseId) => {
        setFormData(prev => ({
            ...prev,
            enrolledCourses: [{ courseId, status: 'Pending' }]
        }));
    }, []);

    // Optimized filter application
    const applyFilters = useCallback(() => {
        setCurrentPage(1); // Reset to first page when applying filters
        fetchStudents();
        setShowFilterPopover(false);
        toast.success('Filters applied successfully');
    }, [filterCourseId, filterCity, searchTerm]); // Add dependencies

    // Optimized filter clearing
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setFilterCourseId('');
        setFilterCity('');
        setCurrentPage(1);
        fetchStudents();
        setShowFilterPopover(false);
        toast.success('Filters cleared successfully');
    }, []); // Empty dependency array since we're clearing all filters

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

    // Add separate effect for filter changes that will be triggered by the Apply Filters button
    useEffect(() => {
        // Show filter status in page title for visual feedback
        document.title = filtersActive ? 'Students (Filtered)' : 'Students';
    }, [filtersActive]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            // console.log("WOrk");

            const addressField = name.split('.')[1];
            // console.log(addressField);

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

        // Require course selection when creating a student
        if (!editingStudent && (!formData.enrolledCourses || formData.enrolledCourses.length === 0)) {
            toast.error('Please select a course for the student.');
            return;
        }

        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'profilePicture' && formData[key]) {
                    formDataToSend.append(key, formData[key]);
                } else if (key === 'address') {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else if (key === 'enrolledCourses') {
                    formDataToSend.append(key, JSON.stringify(formData.enrolledCourses.map(ec => ec.courseId)));
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
                setShowEditSuccess(true);
                setTimeout(() => setShowEditSuccess(false), 2000);
                toast.success('Student updated successfully');
            } else {
                const response = await api.post('/api/students/register', formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 120000
                });
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
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
            enrolledCourses: courseIds.map(id => ({ courseId: id, status: 'Enrolled' })),
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
                const errorMessage = error.response?.data?.message || error.message || 'Failed to delete student';
                toast.error(errorMessage);
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
            const errorMessage = error.response?.data?.message || error.message || 'Error exporting students data';
            console.error('Error exporting CSV:', error);
            toast.error(errorMessage);
        }
    };

    const handleStudentClick = (student) => {
        setSelectedStudent(student);
        setShowDetailsModal(true);
    };

    return (
        <div className="relative">
            {/* Student Details Modal */}
            {showDetailsModal && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">Student Details</h2>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FaTimes size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                                        <p className="mt-1">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                                        <p className="mt-1">{selectedStudent.email}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">CNIC</h3>
                                        <p className="mt-1">{selectedStudent.cnic}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                                        <p className="mt-1">{selectedStudent.phoneNumber}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                                        <p className="mt-1">{new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                                        <p className="mt-1">{selectedStudent.gender}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Address</h3>
                                        <p className="mt-1">
                                            {selectedStudent.address.street}<br />
                                            {selectedStudent.address.city}, {selectedStudent.address.state}<br />
                                            {selectedStudent.address.zipCode}<br />
                                            {selectedStudent.address.country}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Guardian Information</h3>
                                        <p className="mt-1">
                                            Name: {selectedStudent.guardianName}<br />
                                            Phone: {selectedStudent.guardianPhone}<br />
                                            Relation: {selectedStudent.guardianRelation}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${selectedStudent.status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                                                selectedStudent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    selectedStudent.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                            {selectedStudent.status}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Enrolled Courses</h3>
                                        <div className="mt-1 space-y-2">
                                            {selectedStudent.enrolledCourses && selectedStudent.enrolledCourses.length > 0 ? (
                                                selectedStudent.enrolledCourses.map((course, index) => (
                                                    <div key={index} className="bg-gray-50 p-2 rounded">
                                                        <p className="font-medium">{course.courseId?.name || 'Unknown Course'}</p>
                                                        {course.courseId?.timing && (
                                                            <p className="text-sm text-gray-500">
                                                                {course.courseId.timing.startTime} - {course.courseId.timing.endTime}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-500">No courses enrolled</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Success Animation */}
            {showEditSuccess && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl animate-fade-in">
                        <FaCheckCircle className="text-green-500 text-5xl mb-2 animate-bounce" />
                        <div className="text-lg font-semibold text-green-700">Student Updated Successfully!</div>
                    </div>
                </div>
            )}

            {/* Existing Success Animation */}
            {showSuccess && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl animate-fade-in">
                        <FaCheckCircle className="text-green-500 text-5xl mb-2 animate-bounce" />
                        <div className="text-lg font-semibold text-green-700">Student Registered!</div>
                    </div>
                </div>
            )}

            {/* Overlay for when sidebar is open */}
            {showForm && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-30 z-10 transition-opacity duration-300"
                    onClick={() => setShowForm(false)}
                ></div>
            )}

            {/* Sliding sidebar for student form */}
            <div className={`fixed top-0 right-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-xl z-20 transition-transform duration-300 ease-in-out overflow-auto pr-6 ${showForm ? 'translate-x-0' : 'translate-x-full'}`}>
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
                                {/* Personal Info */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                </div>
                                {!editingStudent && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Password</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CNIC</label>
                                    <input type="text" name="cnic" value={formData.cnic} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth.slice(0, 10)} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            {/* Address */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <input type="text" name="address.street" placeholder="Street" value={formData?.address?.street} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                <input type="text" name="address.city" placeholder="City" value={formData?.address?.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                <input type="text" name="address.state" placeholder="State" value={formData?.address?.state} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                <input type="text" name="address.zipCode" placeholder="ZIP Code" value={formData?.address?.zipCode} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                <input type="text" name="address.country" placeholder="Country" value={formData?.address?.country} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                            </div>
                            {/* Guardian */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                                    <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Guardian Phone</label>
                                    <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Guardian Relation</label>
                                    <input type="text" name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                </div>
                            </div>
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                >
                                    {formData.status === 'Pending' && (
                                        <>
                                            <option value="Pending">Pending</option>
                                            <option value="Enrolled">Enrolled</option>
                                        </>
                                    )}
                                    {formData.status === 'Enrolled' && (
                                        <>
                                            <option value="Enrolled">Enrolled</option>
                                            <option value="Suspended">Suspended</option>
                                            <option value="Eliminated">Eliminated</option>
                                        </>
                                    )}
                                    {formData.status === 'Suspended' && (
                                        <>
                                            <option value="Suspended">Suspended</option>
                                            <option value="Enrolled">Enrolled</option>
                                        </>
                                    )}
                                    {formData.status === 'Eliminated' && (
                                        <option value="Eliminated">Eliminated</option>
                                    )}
                                </select>
                            </div>
                            {/* Course Enrollment */}
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Course Enrollment <span className="text-red-500">*</span></h3>
                                {coursesLoading ? (
                                    <div className="flex items-center justify-center p-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        <span className="ml-2 text-gray-600">Loading courses...</span>
                                    </div>
                                ) : courses.length === 0 ? (
                                    <div className="text-gray-500 text-sm">No courses available</div>
                                ) : (
                                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                        {courses.map(course => (
                                            <div key={course._id} className="border border-gray-200 rounded-md p-3 bg-white hover:bg-gray-50 transition-colors duration-150">
                                                <div className="flex items-start">
                                                    <input
                                                        type="radio"
                                                        id={`course-${course._id}`}
                                                        name="enrolledCourseRadio"
                                                        checked={formData.enrolledCourses.some(enrollment => enrollment.courseId === course._id)}
                                                        onChange={() => handleCourseChange(course._id)}
                                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full"
                                                        required={!editingStudent}
                                                    />
                                                    <label htmlFor={`course-${course._id}`} className="ml-3 block flex-1 cursor-pointer">
                                                        <span className="text-sm font-medium text-gray-700">{course.name}</span>
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            <div className="flex items-center"><span className="font-semibold mr-1">Days:</span>{course.days.join(', ')}</div>
                                                            <div className="flex items-center mt-1"><span className="font-semibold mr-1">Time:</span>{course.timing.startTime} - {course.timing.endTime}</div>
                                                            <div className="flex items-center mt-1"><span className="font-semibold mr-1">Mode:</span>{course.modeOfDelivery}</div>
                                                            <div className="flex items-center mt-1"><span className="font-semibold mr-1">Duration:</span>{course.duration} weeks</div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Profile Picture */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                                <input type="file" name="profilePicture" onChange={handleFileChange} className="mt-1 block w-full" accept="image/*" />
                                {/* Preview */}
                                {formData.profilePicture && typeof formData.profilePicture === 'object' && formData.profilePicture instanceof File && (
                                    <img src={URL.createObjectURL(formData.profilePicture)} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-full border" />
                                )}
                            </div>
                            {/* Submit/Cancel Buttons */}
                            <div className="flex justify-end space-x-4 mt-6">
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50" disabled={submitting}>Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300" disabled={submitting}>
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
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Add Student
                    </button>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-3">Search & Filter</h2>
                <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
                    {/* Search bar */}
                    <div className="w-full">
                        <input
                            type="text"
                            placeholder="Search by name, email, CNIC, roll no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                        />
                    </div>
                    <div className=''>
                        <button
                            ref={filterButtonRef}
                            onClick={() => setShowFilterPopover((prev) => !prev)}
                            className="px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow flex items-center gap-2"
                            type="button"
                        >
                            <FaFilter className="inline-block" />
                            Filter
                        </button>
                        {/* Popover/modal for filter options */}
                        {showFilterPopover && (
                            <>
                                {/* Backdrop for mobile */}
                                <div className="fixed inset-0 z-30 md:hidden" onClick={() => setShowFilterPopover(false)}></div>
                                <div
                                    className="absolute right-0 mt-2 z-40 bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-[90vw] max-w-xs md:w-80 md:max-w-sm md:left-auto md:right-0"
                                    style={{ minWidth: 250 }}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-gray-700 text-base flex items-center gap-1"><FaFilter /> Filter Options</span>
                                        <button onClick={() => setShowFilterPopover(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full focus:outline-none">
                                            <FaTimes size={18} />
                                        </button>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                        <select
                                            value={filterCourseId}
                                            onChange={(e) => {
                                                setFilterCourseId(e.target.value);
                                                setCurrentPage(1); // Reset to first page when changing course filter
                                            }}
                                            className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-2"
                                        >
                                            <option value="">All Courses</option>
                                            {courses.map(course => (
                                                <option key={course._id} value={course._id}>
                                                    {course.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={filterCity}
                                            onChange={(e) => setFilterCity(e.target.value)}
                                            placeholder="Enter city name"
                                            className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-2"
                                        />
                                    </div>
                                    <div className="flex flex-col md:flex-row justify-end gap-2 mt-2">
                                        <button
                                            onClick={applyFilters}
                                            className="w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                            type="button"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            onClick={clearFilters}
                                            className="w-full md:w-auto px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                            type="button"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {/* Active filters summary */}
                {(filterCourseId || filterCity) && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="flex items-center text-blue-600 text-sm font-medium mr-2"><FaFilter className="mr-1" />Filtered by:</span>
                        {filterCourseId && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center text-xs font-medium mr-2">
                                Course: {courses.find(c => c._id === filterCourseId)?.name || 'Unknown'}
                                <button
                                    className="ml-1 text-blue-600 hover:text-blue-900 focus:outline-none"
                                    onClick={() => { setFilterCourseId(''); setCurrentPage(1); fetchStudents(); }}
                                    title="Remove course filter"
                                >
                                    <FaTimes />
                                </button>
                            </span>
                        )}
                        {filterCity && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center text-xs font-medium mr-2">
                                City: {filterCity}
                                <button
                                    className="ml-1 text-blue-600 hover:text-blue-900 focus:outline-none"
                                    onClick={() => { setFilterCity(''); setCurrentPage(1); fetchStudents(); }}
                                    title="Remove city filter"
                                >
                                    <FaTimes />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow overflow-hidden w-full">
                        <div className="overflow-x-auto w-full p-4">
                            <table className="w-full min-w-[600px] divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Profile
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Roll No
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            CNIC
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Courses
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                            <tr
                                                key={student._id}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleStudentClick(student)}
                                            >
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
                                                        {student.firstName}
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
                                                    <div className="text-sm text-gray-900 max-w-xs overflow-hidden">
                                                        {student.enrolledCourses && student.enrolledCourses.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {student.enrolledCourses.map((course, index) => (
                                                                    <div key={index} className="truncate">
                                                                        <span className="font-medium">{course.courseId?.name || 'Unknown Course'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">No courses</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(student);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(student._id);
                                                            }}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
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