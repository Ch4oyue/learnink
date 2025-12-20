import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ModuleEditor } from "@/components/module/ModuleEditor";

export default function ModuleCreate() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Buat Modul Baru</h1>
          <p className="text-muted-foreground">
            Buat materi pembelajaran baru untuk siswa
          </p>
        </div>
        <ModuleEditor mode="create" />
      </div>
    </DashboardLayout>
  );
}
