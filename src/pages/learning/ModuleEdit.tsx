import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { ModuleEditor } from "@/components/features/module/ModuleEditor";
import { useModule } from "@/hooks/useModules";
import { Skeleton } from "@/components/ui/skeleton";

export default function ModuleEdit() {
  const { id } = useParams<{ id: string }>();
  const { data: module, isLoading } = useModule(id ?? "");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!module) {
    return <Navigate to="/dashboard/modules" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Edit Module</h1>
          <p className="text-muted-foreground">
            Update learning material
          </p>
        </div>
        <ModuleEditor mode="edit" module={module} />
      </div>
    </DashboardLayout>
  );
}
