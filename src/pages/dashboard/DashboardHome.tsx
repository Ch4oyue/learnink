import { useAuth, AppRole } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy import dashboard content components for code splitting
import { UserDashboardContent } from "@/components/features/dashboard/UserDashboard";
import { TutorDashboardContent } from "@/components/features/dashboard/TutorDashboard";
import { AdminDashboardContent } from "@/components/features/dashboard/AdminDashboard";

/**
 * DashboardHome - Smart Redirect Component
 * =========================================
 * Renders the appropriate dashboard content based on user role.
 * Acts as a routing shell that delegates to role-specific components.
 */

function DashboardLoadingSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-6 w-24" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-5">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-11 w-11 rounded-lg" />
                            <div>
                                <Skeleton className="h-7 w-12 mb-1" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="bg-card border border-border rounded-xl p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function DashboardHome() {
    const { role, loading } = useAuth();

    // Show loading skeleton while role is being determined
    if (loading || role === null) {
        return (
            <DashboardLayout>
                <DashboardLoadingSkeleton />
            </DashboardLayout>
        );
    }

    // Type-safe role rendering
    const safeRole: AppRole = role;

    // Render role-specific content
    const renderContent = () => {
        switch (safeRole) {
            case "admin":
            case "superadmin":
                return <AdminDashboardContent />;
            case "tutor":
                return <TutorDashboardContent />;
            case "user":
            default:
                return <UserDashboardContent />;
        }
    };

    return <DashboardLayout>{renderContent()}</DashboardLayout>;
}
