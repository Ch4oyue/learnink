import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// ============================================
// LAZY LOADED PAGES
// ============================================

// Public Pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Changelog = lazy(() => import("./pages/Changelog"));

// Dashboard Pages
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const DashboardProfile = lazy(() => import("./pages/DashboardProfile"));
const DashboardSettings = lazy(() => import("./pages/DashboardSettings"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));

// Learning Pages
const ModuleLearn = lazy(() => import("./pages/ModuleLearn"));

// Admin Pages
const ManageSources = lazy(() => import("./pages/admin/ManageSources"));
const ContentApproval = lazy(() => import("./pages/admin/ContentApproval"));
const IntegrationManager = lazy(() => import("./pages/admin/IntegrationManager"));

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
// SMART LANDING (No redirect - show landing to everyone)
// ============================================

const SmartLanding = () => {
  return <LandingPage />;
};

// ============================================
// MODULE REDIRECT (Legacy /module/:id -> /learn/:id)
// ============================================

const ModuleRedirect = () => {
  const { moduleId } = useParams();
  return <Navigate to={`/learn/${moduleId}`} replace />;
};

// ============================================
// APP COMPONENT
// ============================================

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <CustomCursor />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* ============================
                    PUBLIC ROUTES
                    ============================ */}
                  <Route path="/" element={<SmartLanding />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<Navigate to="/auth" replace />} />
                  <Route path="/changelog" element={<Changelog />} />

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
                  <Route
                    path="/dashboard/settings"
                    element={
                      <ProtectedRoute>
                        <DashboardSettings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Coming Soon Routes - Pages under development */}
                  <Route
                    path="/dashboard/analytics"
                    element={
                      <ProtectedRoute>
                        <ComingSoon title="Analytics" description="Fitur analytics untuk melihat statistik pembelajaran Anda secara detail sedang dalam pengembangan." />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/achievements"
                    element={
                      <ProtectedRoute>
                        <ComingSoon title="Achievements" description="Fitur achievements untuk melihat semua pencapaian belajar Anda sedang dalam pengembangan." />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/admin/approval"
                    element={
                      <ProtectedRoute>
                        <ContentApproval />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/courses"
                    element={
                      <ProtectedRoute>
                        <ComingSoon title="My Courses" description="Fitur daftar kursus yang sedang Anda pelajari akan segera tersedia." />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/users"
                    element={
                      <ProtectedRoute>
                        <ComingSoon title="Manajemen Pengguna" description="Fitur untuk mengelola pengguna, mengubah role, dan mengelola akun sedang dalam pengembangan." />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/requests"
                    element={
                      <ProtectedRoute>
                        <ComingSoon title="Request Materi" description="Fitur untuk melihat dan mengelola permintaan materi dari pengguna sedang dalam pengembangan." />
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
                  <Route
                    path="/dashboard/admin/integrations"
                    element={
                      <ProtectedRoute>
                        <IntegrationManager />
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
                  {/* Legacy redirect: /module/:id -> /learn/:id */}
                  <Route
                    path="/module/:moduleId"
                    element={<ModuleRedirect />}
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
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
