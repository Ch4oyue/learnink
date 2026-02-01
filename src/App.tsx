import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/features/auth/ProtectedRoute";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { TopProgressBar } from "@/components/shared/TopProgressBar";
import { PWAInstallPrompt } from "@/components/features/pwa/PWAInstallPrompt";
import { PWAProvider } from "@/contexts/PWAContext";
import { HelmetProvider } from "react-helmet-async";

// ============================================
// LAZY LOADED PAGES
// ============================================

// Public Pages
const LandingPage = lazy(() => import("./pages/public/LandingPage"));
const Auth = lazy(() => import("./pages/auth/Auth"));
const NotFound = lazy(() => import("./pages/public/NotFound"));
const Changelog = lazy(() => import("./pages/public/Changelog"));
const Syllabus = lazy(() => import("./pages/public/Syllabus"));

// Dashboard Pages
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const DashboardProfile = lazy(() => import("./pages/dashboard/DashboardProfile"));
const DashboardSettings = lazy(() => import("./pages/dashboard/DashboardSettings"));
const DashboardUsers = lazy(() => import("./pages/dashboard/DashboardUsers"));
const DashboardCourses = lazy(() => import("./pages/dashboard/DashboardCourses"));
const DashboardModules = lazy(() => import("./pages/dashboard/DashboardModules"));
const DashboardNotifications = lazy(() => import("./pages/dashboard/DashboardNotifications"));
const DashboardRequests = lazy(() => import("./pages/dashboard/DashboardRequests"));
const CourseDetail = lazy(() => import("./pages/dashboard/CourseDetail"));
const ComingSoon = lazy(() => import("./pages/dashboard/ComingSoon"));
const SecondBrain = lazy(() => import("./pages/dashboard/SecondBrain"));

// Learning Pages
const ModuleLearn = lazy(() => import("./pages/learning/ModuleLearn"));

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
      staleTime: 10 * 60 * 1000, // 10 minutes (increased to reduce cost/network)
      gcTime: 30 * 60 * 1000, // 30 minutes
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
    <TopProgressBar />
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
    <HelmetProvider>
      <ThemeProvider>
        <PWAProvider>
          <CustomCursor />
          <PWAInstallPrompt />
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: true }}>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* ============================
                      PUBLIC ROUTES
                      ============================ */}
                      <Route path="/" element={<SmartLanding />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/login" element={<Navigate to="/auth" replace />} />
                      <Route path="/changelog" element={<Changelog />} />
                      <Route path="/syllabus" element={<Syllabus />} />

                      {/* ============================
                      DASHBOARD ROUTES
                      ============================ */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <DashboardHome />
                            </ErrorBoundary>
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
                      <Route
                        path="/dashboard/second-brain"
                        element={
                          <ProtectedRoute>
                            <SecondBrain />
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
                            <DashboardCourses />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/course/:trackId"
                        element={
                          <ProtectedRoute>
                            <CourseDetail />
                          </ProtectedRoute>
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
                        path="/dashboard/users"
                        element={
                          <ProtectedRoute>
                            <DashboardUsers />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/requests"
                        element={
                          <ProtectedRoute>
                            <DashboardRequests />
                          </ProtectedRoute>
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
                      {/* Alias for singular path requested by user */}
                      <Route
                        path="/dashboard/request"
                        element={<Navigate to="/dashboard/requests" replace />}
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
                      <Route
                        path="/modules"
                        element={<Navigate to="/dashboard/courses" replace />}
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
        </PWAProvider>
      </ThemeProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
