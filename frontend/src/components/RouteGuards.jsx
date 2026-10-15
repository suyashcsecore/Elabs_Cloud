import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Skeleton from './Skeleton';

/**
 * Guard for authenticated users
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Guard for specific roles (e.g. ['ADMIN'] or ['ORGANIZER', 'ADMIN'])
 */
export function RoleRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    // Redirect unauthorized user back to home
    return <Navigate to="/" replace />;
  }

  return children;
}
