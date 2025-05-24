import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import logo from "../assets/logo.png"

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [expandedItems, setExpandedItems] = useState({});

    // Get user data from Redux store
    const user = useSelector(state => state.auth?.user || {});
    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Admin User';
    const userEmail = user?.email || 'admin@example.com';
    const userInitial = userName?.charAt(0) || 'A';

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const toggleExpand = (itemName) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemName]: !prev[itemName]
        }));
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: 'Students', path: '/students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        {
            name: 'Courses',
            path: '/courses',
            icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
        },
        {
            name: 'Attendance',
            path: '/attendance/mark',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
            children: [
                { name: 'Mark Attendance', path: '/attendance/mark' },
                { name: 'View Records', path: '/attendance/view' }
            ]
        },
        { name: 'Reports', path: '/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
    ];

    // Add Register link for admin users
    if (user?.role === 'admin') {
        navItems.splice(2, 0, {
            name: 'Register Staff',
            path: '/admin/register',
            icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
        });
    }

    return (
        <>
            {/* Mobile menu button - visible on small screens */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 lg:hidden bg-blue-500 text-white p-2 rounded-md"
                aria-label="Toggle menu"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar with both transform and width transitions */}
            <div className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out 
                ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}>
                <div className="flex flex-col h-full">
                    {/* Move Toggle button inside sidebar, at the top */}
                    <div className="flex items-center justify-between h-16 border-b px-4">
                        <img src={logo} style={isOpen ? { display: "block" } : { display: "none" }} width={isOpen ? 120 : 0} alt="" />
                        <button
                            onClick={toggleSidebar}
                            className="p-1 rounded-md hover:bg-gray-200"
                            aria-label="Toggle sidebar"
                        >
                            {isOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* User Profile Card - at the top after toggle */}
                    {isOpen && (
                        <div className="p-4 border-b bg-gray-50 transition-opacity duration-300">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                    {userInitial}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700">{userName}</p>
                                    <p className="text-xs text-gray-500">{userEmail}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation links */}
                    <nav className="flex-1 pt-2 pb-4 overflow-y-auto">
                        <ul className="space-y-1 px-2">
                            {navItems.map((item) => (
                                <li key={item.name}>
                                    {item.children ? (
                                        <div className="space-y-1">
                                            <div className={`w-full transition-colors duration-150 rounded-md flex items-center ${isOpen ? "px-4 justify-between" : "justify-center"} ${location.pathname === item.path
                                                ? 'text-blue-600 bg-blue-50 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}>
                                                <Link
                                                    to={item.path}
                                                    className={`flex items-center  py-3 text-sm font-medium  `}
                                                    onClick={() => {
                                                        toggleExpand(item.name)
                                                        if (window.innerWidth < 1024) {
                                                            toggleSidebar();
                                                        }
                                                    }}
                                                >
                                                    <svg
                                                        className={`h-5 w-5 ${location.pathname.startsWith(item.path) ? 'text-blue-600' : 'text-gray-500'}`} // Larger size, centered by parent flex
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                                    </svg>
                                                    <span className={`ml-4 transition-all duration-300 ${!isOpen ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden hidden' : ''}`}>
                                                        {item.name}
                                                    </span>
                                                </Link>
                                                <button

                                                    className={`${isOpen ? '' : "hidden"} p-2 transition-transform duration-200 ${expandedItems[item.name] ? 'rotate-180' : ''}`}
                                                    onClick={() => xtoggleExpand(item.name)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`${location.pathname.startsWith(item.path) ? 'text-blue-600' : 'text-gray-500'} h-4 w-4`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            {isOpen && expandedItems[item.name] && (
                                                <div className="pl-4 space-y-1">
                                                    {item.children.map((child) => (
                                                        <Link
                                                            key={child.name}
                                                            to={child.path}
                                                            className={`block px-4 py-2 text-sm font-medium transition-colors duration-150 rounded-md ${location.pathname === child.path
                                                                ? 'text-blue-600 bg-blue-50 font-semibold'
                                                                : 'text-gray-700 hover:bg-gray-100'
                                                                }`}
                                                            onClick={() => {
                                                                if (window.innerWidth < 1024) {
                                                                    toggleSidebar();
                                                                }
                                                            }}
                                                        >
                                                            {child.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            className={`flex items-center  py-3  ${isOpen ? "px-4" : "justify-center"} text-sm font-medium transition-colors duration-150 rounded-md ${location.pathname === item.path
                                                ? 'text-blue-600 bg-blue-50 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            onClick={() => {
                                                if (window.innerWidth < 1024) {
                                                    toggleSidebar();
                                                }
                                            }}
                                        >
                                            <svg
                                                className={`h-5 w-5 ${location.pathname.startsWith(item.path) ? 'text-blue-600' : 'text-gray-500'}`} // Larger size, centered by parent flex
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                            </svg>
                                            <span className={`ml-4 transition-all duration-300 ${!isOpen ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden hidden' : ''}`}>
                                                {item.name}
                                            </span>
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Footer with logout button - only show when sidebar is open */}
                    {isOpen && (
                        <div className="border-t p-4">
                            <button
                                className={`w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors duration-150 ${!isOpen && 'lg:justify-center'}`}
                                onClick={handleLogout}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className={`ml-3 transition-opacity duration-300 ${!isOpen && 'lg:opacity-0 lg:invisible'}`}>
                                    Logout
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar; 