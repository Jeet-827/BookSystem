import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MoonLoader from './MoonLoader';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading, sessionChecking } = useSelector((state) => state.auth);
  const location = useLocation();

  if (sessionChecking || loading) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center">
        <MoonLoader size={40} color="#000" text="Checking admin privileges..." />
      </div>
    );
  }

  const isAdminUser = user && (user.role === 'admin' || user.role === 'superadmin');
  if (!isAuthenticated || !isAdminUser) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;
