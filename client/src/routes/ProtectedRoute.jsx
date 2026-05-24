import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
