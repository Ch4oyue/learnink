import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load page components - ESSENTIAL ONLY
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ModuleLearn = lazy(() => import("./pages/ModuleLearn"));
const DashboardProfile = lazy(() => import("./pages/DashboardProfile"));

// Dashboard with layout
const UserDashboard = lazy(() =>
  import("@/components/dashboard/UserDashboard").then((m) => ({
    default: m.UserDashboard,
  }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal loading fallback
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
                {/* ============================
                    ESSENTIAL ROUTES ONLY
                    ============================ */}
                
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Auth (Login/Register) */}
                <Route path="/auth" element={<Auth />} />

                {/* Dashboard - User Home */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Dashboard Profile */}
                <Route
                  path="/dashboard/profile"
                  element={
                    <ProtectedRoute>
                      <DashboardProfile />
                    </ProtectedRoute>
                  }
                />

                {/* Learning Interface */}
                <Route
                  path="/learn/:moduleId"
                  element={
                    <ProtectedRoute>
                      <ModuleLearn />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Fallback */}
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
