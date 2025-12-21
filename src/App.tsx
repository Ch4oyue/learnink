import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load page components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Modules = lazy(() => import("./pages/Modules"));
const ModuleDetail = lazy(() => import("./pages/ModuleDetail"));
const ModuleLearn = lazy(() => import("./pages/ModuleLearn"));
const RequestDetail = lazy(() => import("./pages/RequestDetail"));
const Syllabus = lazy(() => import("./pages/Syllabus"));
const ModuleCreate = lazy(() => import("./pages/ModuleCreate"));
const ModuleEdit = lazy(() => import("./pages/ModuleEdit"));
const DashboardRequestMaterial = lazy(() => import("./pages/DashboardRequestMaterial"));
const DashboardSettings = lazy(() => import("./pages/DashboardSettings"));
const DashboardModules = lazy(() => import("./pages/DashboardModules"));
const DashboardRequests = lazy(() => import("./pages/DashboardRequests"));
const DashboardNotifications = lazy(() => import("./pages/DashboardNotifications"));
const DashboardProfile = lazy(() => import("./pages/DashboardProfile"));
const DashboardUsers = lazy(() => import("./pages/DashboardUsers"));

// Lazy load dashboard components
const UserDashboard = lazy(() => import("@/components/dashboard/UserDashboard").then(m => ({ default: m.UserDashboard })));
const TutorDashboard = lazy(() => import("@/components/dashboard/TutorDashboard").then(m => ({ default: m.TutorDashboard })));
const AdminDashboard = lazy(() => import("@/components/dashboard/AdminDashboard").then(m => ({ default: m.AdminDashboard })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal loading fallback to prevent layout shift
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/modules" element={<Modules />} />
                <Route path="/module/:id" element={<ModuleDetail />} />
                <Route path="/module/:id/learn" element={<ProtectedRoute><ModuleLearn /></ProtectedRoute>} />
                <Route path="/syllabus" element={<Syllabus />} />
                <Route
                  path="/request/:id"
                  element={
                    <ProtectedRoute>
                      <RequestDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/dashboard/user" replace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/user"
                  element={
                    <RoleProtectedRoute allowedRoles={['user', 'tutor', 'admin']}>
                      <UserDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/tutor"
                  element={
                    <RoleProtectedRoute allowedRoles={['tutor', 'admin']}>
                      <TutorDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/admin"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/modules"
                  element={
                    <ProtectedRoute>
                      <DashboardModules />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/modules/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['tutor', 'admin']}>
                      <ModuleCreate />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/modules/edit/:id"
                  element={
                    <RoleProtectedRoute allowedRoles={['tutor', 'admin']}>
                      <ModuleEdit />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/requests"
                  element={
                    <RoleProtectedRoute allowedRoles={['tutor', 'admin']}>
                      <DashboardRequests />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/notifications"
                  element={
                    <ProtectedRoute>
                      <DashboardNotifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/profile"
                  element={
                    <ProtectedRoute>
                      <DashboardProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/users"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <DashboardUsers />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/request-material"
                  element={
                    <ProtectedRoute>
                      <DashboardRequestMaterial />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/settings"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <DashboardSettings />
                    </RoleProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
