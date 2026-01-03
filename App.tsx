import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AddClientPage } from './pages/admin/AddClientPage';
import { AdminClientDetailPage } from './pages/admin/AdminClientDetailPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminGuidePage } from './pages/admin/AdminGuidePage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AdminThemeProvider } from './contexts/AdminThemeContext';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <AdminAuthProvider>
        <AdminThemeProvider>
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients" element={
              <ProtectedRoute>
                <AdminClientsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/new" element={
              <ProtectedRoute>
                <AddClientPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/:clientId" element={
              <ProtectedRoute>
                <AdminClientDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute>
                <AdminSettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/guide" element={
              <ProtectedRoute>
                <AdminGuidePage />
              </ProtectedRoute>
            } />
            <Route path="/admin/support" element={
              <ProtectedRoute>
                <AdminSupportPage />
              </ProtectedRoute>
            } />

            {/* Client Routes */}
            <Route path="/:tenantId/dashboard" element={<DashboardPage />} />
            <Route path="/:tenantId" element={<ChatPage />} />

            {/* Fallback / Root Redirect */}
            <Route path="/" element={<Navigate to="/sky-habitat" replace />} />

            {/* 404 Route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
                <h1 className="text-4xl font-bold text-gray-800">404</h1>
                <p className="text-gray-500">Page not found</p>
              </div>
            } />
          </Routes>
        </AdminThemeProvider>
      </AdminAuthProvider>
    </Router>
  );
}