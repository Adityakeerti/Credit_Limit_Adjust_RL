import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * Protected Route wrapper component
 * Redirects to login if not authenticated
 * Optionally requires admin role
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, isLoading, isAdmin } = useApp();
    const location = useLocation();

    // Show nothing while checking auth status
    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/main" replace />;
    }

    return children;
};

export default ProtectedRoute;
