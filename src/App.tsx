import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { MainDashboardPage } from './pages/MainDashboardPage';
import { OverallDashboardPage } from './pages/OverallDashboardPage';
import { EventDashboardPage } from './pages/EventDashboardPage';
import { AttendanceScannerPage } from './pages/AttendanceScannerPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { authService } from './services/authService';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthed = authService.isAuthenticated();
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Main Overview Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Attendance Scanners */}
        <Route
          path="/attendance/overall"
          element={
            <ProtectedRoute>
              <AttendanceScannerPage forcedType="OVERALL" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance/event/:eventSlug"
          element={
            <ProtectedRoute>
              <AttendanceScannerPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboards */}
        <Route
          path="/dashboard/overall"
          element={
            <ProtectedRoute>
              <OverallDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/events/:eventSlug"
          element={
            <ProtectedRoute>
              <EventDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Participants Directory */}
        <Route
          path="/participants"
          element={
            <ProtectedRoute>
              <ParticipantsPage />
            </ProtectedRoute>
          }
        />

        {/* Global Reports & Exports */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Backward Compatibility Redirects */}
        <Route path="/scan" element={<Navigate to="/attendance/overall" replace />} />
        <Route path="/dashboard" element={<Navigate to="/dashboard/overall" replace />} />

        {/* Fallback */}
        <Route
          path="*"
          element={
            authService.isAuthenticated() ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
