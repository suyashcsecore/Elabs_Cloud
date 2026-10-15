import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, RoleRoute } from './components/RouteGuards';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import ExploreEvents from './pages/ExploreEvents';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import MyRegistrations from './pages/MyRegistrations';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<ExploreEvents />} />
                  <Route path="/events/:eventId" element={<EventDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Student route */}
                  <Route
                    path="/my-registrations"
                    element={
                      <RoleRoute allowedRoles={['STUDENT']}>
                        <MyRegistrations />
                      </RoleRoute>
                    }
                  />

                  {/* Organizer route */}
                  <Route
                    path="/organizer"
                    element={
                      <RoleRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                        <OrganizerDashboard />
                      </RoleRoute>
                    }
                  />

                  {/* Admin route */}
                  <Route
                    path="/admin"
                    element={
                      <RoleRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                      </RoleRoute>
                    }
                  />

                  {/* 404 Route */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
