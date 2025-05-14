import Home from './pages/Home';
import Students from './pages/Students';
import Course from './pages/Course';
import Attendance from './pages/Attendance';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ActiveCourses from './pages/ActiveCourses';
import AllCourses from './pages/AllCourses';
import CourseSessions from './pages/CourseSessions';
import AttendanceMark from './pages/AttendanceMark';
import AttendanceView from './pages/AttendanceView';

// Define routes with their configuration
const routes = [
  // Public routes that don't require the sidebar layout
  {
    path: '/login',
    component: Login,
    layout: false,
    exact: true,
  },
  {
    path: '/register',
    component: Register,
    layout: false,
    exact: true,
  },
  {
    path: '/unauthorized',
    component: Unauthorized,
    layout: false,
    exact: true,
  },
  
  // Protected routes that use the sidebar layout
  {
    path: '/',
    component: Home,
    layout: true,
    exact: true,
  },
  {
    path: '/students',
    component: Students,
    layout: true,
    exact: true,
  },
  {
    path: '/courses',
    component: Course,
    layout: true,
    exact: true,
    allowedRoles: ['maintenance_office'],
  },
  {
    path: '/courses/active',
    component: ActiveCourses,
    layout: true,
    exact: true,
  },
  {
    path: '/courses/all',
    component: AllCourses,
    layout: true,
    exact: true,
  },
  {
    path: '/courses/sessions',
    component: CourseSessions,
    layout: true,
    exact: true,
  },
  {
    path: '/attendance',
    component: Attendance,
    layout: true,
    exact: true,
    allowedRoles: ['maintenance_office'],
  },
  {
    path: '/attendance/mark',
    component: AttendanceMark,
    layout: true,
    exact: true,
    allowedRoles: ['maintenance_office', 'teacher'],
  },
  {
    path: '/attendance/view',
    component: AttendanceView,
    layout: true,
    exact: true,
    allowedRoles: ['maintenance_office', 'teacher'],
  },
  {
    path: '/reports',
    component: Reports,
    layout: true,
    exact: true,
  },
  {
    path: '/settings',
    component: Settings,
    layout: true,
    exact: true,
  },
  // Add additional routes as needed
];

export default routes; 