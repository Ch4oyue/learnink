import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Modules from "./pages/Modules";
import ModuleDetail from "./pages/ModuleDetail";
import RequestDetail from "./pages/RequestDetail";
import Syllabus from "./pages/Syllabus";
import ModuleCreate from "./pages/ModuleCreate";
import ModuleEdit from "./pages/ModuleEdit";
import DashboardModules from "./pages/DashboardModules";
import DashboardRequests from "./pages/DashboardRequests";
import DashboardNotifications from "./pages/DashboardNotifications";
import DashboardProfile from "./pages/DashboardProfile";
import DashboardUsers from "./pages/DashboardUsers";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { TutorDashboard } from "@/components/dashboard/TutorDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

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

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/modules" element={<Modules />} />
              <Route path="/module/:id" element={<ModuleDetail />} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
