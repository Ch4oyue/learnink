import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// ============================================
// LAZY LOADED PAGES
// ============================================

// Public Pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Dashboard Pages
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const DashboardProfile = lazy(() => import("./pages/DashboardProfile"));

// Learning Pages
const ModuleLearn = lazy(() => import("./pages/ModuleLearn"));

// Admin Pages
const ManageSources = lazy(() => import("./pages/admin/ManageSources"));

// ============================================
// QUERY CLIENT CONFIG
// ============================================

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

// ============================================
// LOADING FALLBACK
// ============================================

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
);

// ============================================
// SMART LANDING (Redirect logged-in users)
// ============================================

const SmartLanding = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // If user is already logged in, redirect to dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
};

// ============================================
// APP COMPONENT
// ============================================

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
                    PUBLIC ROUTES
                    ============================ */}
                <Route path="/" element={<SmartLanding />} />
                <Route path="/auth" element={<Auth />} />

                {/* ============================
                    DASHBOARD ROUTES
                    ============================ */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardHome />
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

                {/* ============================
                    ADMIN ROUTES
                    ============================ */}
                <Route
                  path="/dashboard/admin/sources"
                  element={
                    <ProtectedRoute>
                      <ManageSources />
                    </ProtectedRoute>
                  }
                />

                {/* ============================
                    LEARNING ROUTES
                    ============================ */}
                <Route
                  path="/learn/:moduleId"
                  element={
                    <ProtectedRoute>
                      <ModuleLearn />
                    </ProtectedRoute>
                  }
                />

                {/* ============================
                    404 FALLBACK
                    ============================ */}
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
