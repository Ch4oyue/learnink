export interface SectionData {
  id: string;
  title: string;
  level: number;
  content: string;
}

export interface ParsedModuleData {
  sections: Record<string, SectionData>;
  order: string[];
  indexMap: Map<string, number>;
}

const headingRegex = /^(#{1,3})\s+(.+)$/;

// ============================================
// HELPER: Parse all sections from Markdown (ONE-TIME)
// ============================================

export function parseModuleSections(markdown: string): ParsedModuleData {
  if (!markdown) return { sections: {}, order: [], indexMap: new Map() };

  const lines = markdown.split("\n");
  const sections: Record<string, SectionData> = {};
  const order: string[] = [];

  let currentSection: SectionData | null = null;
  let contentLines: string[] = [];

  const saveCurrentSection = () => {
    if (currentSection) {
      currentSection.content = contentLines.join("\n").trim();
      sections[currentSection.id] = currentSection;
      order.push(currentSection.id);
    }
  };

  for (const line of lines) {
    const match = headingRegex.exec(line);

    if (match) {
      saveCurrentSection();

      // Start new section
      const level = match[1].length;
      const title = match[2].trim();
      const id = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      // Handle duplicate IDs by appending random string if needed (though unlikely with title slug)
      const uniqueId = sections[id] ? `${id}-${Math.random().toString(36).substr(2, 5)}` : id;

      currentSection = { id: uniqueId, title, level, content: "" };
      contentLines = [line]; // Include heading in content
    } else {
      // Accumulate content lines
      contentLines.push(line);
    }
  }

  // Don't forget the last section
  saveCurrentSection();

  // Create index map for O(1) lookups
  const indexMap = new Map<string, number>();
  order.forEach((id, index) => indexMap.set(id, index));

  return { sections, order, indexMap };
}
