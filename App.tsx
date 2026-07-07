import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ChatPage } from './pages/ChatPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminLeadsPage } from './pages/admin/AdminLeadsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AddClientPage } from './pages/admin/AddClientPage';
import { AdminClientDetailPage } from './pages/admin/AdminClientDetailPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminGuidePage } from './pages/admin/AdminGuidePage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AdminThemeProvider } from './contexts/AdminThemeContext';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { ClientLeadsPage } from './pages/ClientLeadsPage';
import { OutboundDashboardPage } from './pages/admin/outbound/OutboundDashboardPage';
import { CampaignCreatePage } from './pages/admin/outbound/CampaignCreatePage';
import { CampaignDetailPage } from './pages/admin/outbound/CampaignDetailPage';
import { AISettingsPage } from './pages/admin/outbound/AISettingsPage';
import { ProductsPage } from './pages/admin/outbound/ProductsPage';
import { CalendarSettingsPage } from './pages/admin/outbound/CalendarSettingsPage';
import { ConversationsPage } from './pages/admin/outbound/ConversationsPage';
import { ConversationDetailPage } from './pages/admin/outbound/ConversationDetailPage';
import { OutboundAnalyticsPage } from './pages/admin/outbound/OutboundAnalyticsPage';
export default function App() {
  return (
    <Router>
      <AdminAuthProvider>
        <AdminThemeProvider>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/leads" element={
              <ProtectedRoute>
                <AdminLeadsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <AdminUsersPage />
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
            <Route path="/admin/clients/:clientId/outbound" element={
              <ProtectedRoute>
                <OutboundDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/:clientId/outbound/campaigns/new" element={
              <ProtectedRoute>
                <CampaignCreatePage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/:clientId/outbound/campaigns/:campaignId" element={
              <ProtectedRoute>
                <CampaignDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/:clientId/outbound/ai-settings" element={
              <ProtectedRoute>
                <AISettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/:clientId/outbound/products" element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/:clientId/outbound/calendar" element={
              <ProtectedRoute>
                <CalendarSettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/:clientId/outbound/conversations" element={
              <ProtectedRoute>
                <ConversationsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/:clientId/outbound/conversations/:conversationId" element={
              <ProtectedRoute>
                <ConversationDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/:clientId/outbound/analytics" element={
              <ProtectedRoute>
                <OutboundAnalyticsPage />
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
            <Route path="/admin/audit-logs" element={
              <ProtectedRoute>
                <AdminAuditLogsPage />
              </ProtectedRoute>
            } />

            {/* Client Routes */}
            <Route path="/:tenantId/dashboard" element={<DashboardPage />} />
            <Route path="/:tenantId/leads" element={<ClientLeadsPage />} />
            <Route path="/:tenantId" element={<ChatPage />} />

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