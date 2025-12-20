import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { BookOpen } from "lucide-react";

interface ContentSectionProps {
  content?: string | null;
}

export function ContentSection({ content }: ContentSectionProps) {
  return (
    <section
      id="learning-content"
      className="bg-card border-2 border-primary/20 rounded-2xl overflow-hidden shadow-soft scroll-mt-24"
    >
      {/* Section Header */}
      <div className="px-6 py-4 bg-primary/5 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Materi Pembelajaran
            </h2>
            <p className="text-sm text-muted-foreground">
              Baca materi dengan seksama sebelum mengerjakan kuis
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {content ? (
          <MarkdownRenderer content={content} />
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Konten modul belum tersedia
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
