import { Control, useWatch } from "react-hook-form";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

interface ModuleContentPreviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
}

export function ModuleContentPreview({ control }: ModuleContentPreviewProps) {
  const content = useWatch({
    control,
    name: "content",
  });

  return (
    <div className="min-h-[500px] p-4 rounded-lg border bg-muted/30 overflow-auto">
      {content ? (
        <MarkdownRenderer content={content} />
      ) : (
        <p className="text-muted-foreground text-center py-10">
          Belum ada konten untuk di-preview
        </p>
      )}
    </div>
  );
}
