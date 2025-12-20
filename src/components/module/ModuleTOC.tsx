import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface ModuleTOCProps {
  items: TOCItem[];
  activeId?: string;
  className?: string;
}

export function extractTOC(content: string): TOCItem[] {
  const lines = content.split("\n");
  const headers: TOCItem[] = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = `heading-${index}`;
      headers.push({ id, text, level });
    }
  });

  return headers;
}

export function ModuleTOC({ items, activeId, className }: ModuleTOCProps) {
  if (items.length === 0) return null;

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className={cn("", className)}>
      <div className="sticky top-28">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-foreground">
          <List className="h-4 w-4" />
          <span>Daftar Isi</span>
        </div>
        <nav className="space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={cn(
                "block w-full text-left py-1.5 text-sm transition-colors hover:text-primary",
                item.level === 1 && "font-medium text-foreground",
                item.level === 2 && "pl-3 text-muted-foreground",
                item.level === 3 && "pl-6 text-muted-foreground text-xs",
                activeId === item.id && "text-primary font-medium"
              )}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
