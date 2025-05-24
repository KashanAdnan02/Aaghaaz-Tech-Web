import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { format } from 'date-fns';

const AttendanceMark = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchRollNo, setSearchRollNo] = useState('');

    // Fetch courses on component mount
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/api/courses');
                setCourses(response.data);
                console.log(response.data);

            } catch (error) {
                console.error('Error fetching courses:', error);
                setError('Failed to fetch courses');
            }
        };

        fetchCourses();
    }, []);

    // Fetch students when course is selected
    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedCourse) return;

            try {
                setLoading(true);
                const response = await api.get(`/api/students/course/${selectedCourse}`);
                setStudents(response.data.map(student => ({
                    ...student,
                    status: 'present', // Default status
                    remarks: ''
                })));
            } catch (error) {
                console.error('Error fetching students:', error);
                setError('Failed to fetch students');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [selectedCourse]);

    const handleStatusChange = (studentId, status) => {
        setStudents(students.map(student =>
            student._id === studentId ? { ...student, status } : student
        ));
    };

    const handleRemarksChange = (studentId, remarks) => {
        setStudents(students.map(student =>
            student._id === studentId ? { ...student, remarks } : student
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCourse) {
            setError('Please select a course');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const attendanceData = {
                courseId: selectedCourse,
                date: new Date(date),
                students: students.map(student => ({
                    studentId: student._id,
                    status: student.status,
                    remarks: student.remarks
                }))
            };

            await api.post('/api/attendance', attendanceData);
            setSuccess('Attendance marked successfully');

            // Reset form
            setStudents(students.map(student => ({
                ...student,
                status: 'present',
                remarks: ''
            })));
        } catch (error) {
            console.error('Error marking attendance:', error);
            setError(error.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };

    // Filter students based on search roll number
    const filteredStudents = students.filter(student =>
        student.rollId.toLowerCase().includes(searchRollNo.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Mark Attendance</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Course
                        </label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        >
                            <option value="">Select a course</option>
                            {courses?.map(course => (
                                <option key={course._id} value={course._id}>
                                    {course.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search by Roll No
                        </label>
                        <input
                            type="text"
                            value={searchRollNo}
                            onChange={(e) => setSearchRollNo(e.target.value)}
                            placeholder="Enter roll number..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                    </div>
                ) : filteredStudents.length > 0 ? (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
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
                                {filteredStudents.map(student => (
                                    <tr key={student._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                  {student.firstName} {student.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {student.rollId}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={student.status}
                                                onChange={(e) => handleStatusChange(student._id, e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="present">Present</option>
                                                <option value="absent">Absent</option>
                                                <option value="late">Late</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                value={student.remarks}
                                                onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                                                placeholder="Add remarks..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : selectedCourse ? (
                    <div className="text-center py-4 text-gray-500">
                        No students enrolled in this course
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-500">
                        Please select a course to mark attendance
                    </div>
                )}

                {students.length > 0 && (
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Attendance'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default AttendanceMark; 