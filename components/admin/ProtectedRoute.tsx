import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAdminAuth();
    const location = useLocation();
    const { tenantId } = useParams<{ tenantId: string }>();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Role-Based Access Control and Tenant Isolation
    const isPlatformAdmin = user.role === 'platform_admin' || user.role === 'aob_admin' || user.role === 'sales_team';
    const isSalesTeam = user.role === 'sales_team';
    const isClientUser = user.role === 'client_admin' || user.role === 'client_agent';

    // 1. If accessing a specific tenant route
    if (tenantId) {
        // If client user tries to access a different tenant's dashboard
        if (isClientUser && user.tenant_id !== tenantId) {
            // Redirect to their OWN dashboard
            return <Navigate to={`/${user.tenant_id}/dashboard`} replace />;
        }
        // Platform admin/Sales Team can access any tenant
    }

    // 2. If accessing generic admin routes (like /admin)
    if (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') {
        if (isClientUser) {
            // Client users shouldn't be in generic admin, send them home
            return <Navigate to={`/${user.tenant_id}/dashboard`} replace />;
        }

        // Block Sales Team from accessing User Management
        if (isSalesTeam && location.pathname === '/admin/users') {
            return <Navigate to="/admin" replace />;
        }
    }

    return <>{children}</>;
};
