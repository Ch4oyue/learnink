import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = "/dashboard" 
}: RoleProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    } else if (role === 'tutor') {
      return <Navigate to="/dashboard/tutor" replace />;
    } else {
      return <Navigate to="/dashboard/user" replace />;
    }
  }

  return <>{children}</>;
}
