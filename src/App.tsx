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
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { TutorDashboard } from "@/components/dashboard/TutorDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

const queryClient = new QueryClient();

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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
