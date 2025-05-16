import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUserRole } from '../store/slices/authSlice';

const ProtectedRoute = ({ children, allowedRoles, isPublic }) => {
  // const state2= useSelector(state => state);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);

  // If it's a public route (like login/register) and user is authenticated,
  // redirect to dashboard
  if (isPublic && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If it's a protected route and user is not authenticated,
  // redirect to login
  if (!isPublic && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If route has role restrictions and user's role is not allowed,
  // redirect to unauthorized page
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute; 