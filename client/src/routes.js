import Home from './pages/Home';
import Students from './pages/Students';
import Course from './pages/Course';
import Attendance from './pages/Attendance';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AttendanceMark from './pages/AttendanceMark';
import AttendanceView from './pages/AttendanceView';
import AdminRegister from './pages/AdminRegister';
import Profile from './pages/Profile';
import UpdateProfile from './pages/UpdateProfile';
// import Register from './pages/Register';

// Define routes with their configuration
const routes = [
  // Public routes that don't require the sidebar layout
  {
    path: '/login',
    component: Login,
    layout: false,
    exact: true,
    public: true,
  },
  {
    path: '/register',
    component: AdminRegister,
    public: true,
    // layout: true,
    exact: true,
    // protected: true,
    // allowedRoles: ['admin'],
  },
  {
    path: '/unauthorized',
    component: Unauthorized,
    layout: false,
    exact: true,
    public: true,
  },

  // Protected routes that use the sidebar layout
  {
    path: '/',
    component: Home,
    layout: true,
    exact: true,
    protected: true,
  },
  {
    path: '/students',
    component: Students,
    layout: true,
    exact: true,
    protected: true,
  },
  {
    path: '/courses',
    component: Course,
    layout: true,
    exact: true,
    protected: true,
    allowedRoles: ['maintenance_office', "admin"],
  },
  {
    path: '/attendance/mark',
    component: AttendanceMark,
    layout: true,
    exact: true,
    protected: true,
    allowedRoles: ['maintenance_office', 'teacher', 'admin'],
  },
  {
    path: '/attendance/view',
    component: AttendanceView,
    layout: true,
    exact: true,
    protected: true,
    allowedRoles: ['maintenance_office', 'teacher'],
  },
  {
    path: '/reports',
    component: Reports,
    layout: true,
    exact: true,
    protected: true,
  },
  {
    path: '/settings',
    component: Settings,
    layout: true,
    exact: true,
    protected: true,
  },
  {
    path: '/profile',
    component: Profile,
    layout: true,
    exact: true,
    protected: true,
  },
  {
    path: '/profile/update',
    component: UpdateProfile,
    layout: true,
    exact: true,
    protected: true,
  },

  // Add additional routes as needed
];

export default routes; 