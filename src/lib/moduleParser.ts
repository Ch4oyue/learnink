export interface SectionData {
  id: string;
  title: string;
  level: number;
  content: string;
}

/** A section's position in the source markdown, without its text. */
export interface SectionMeta {
  id: string;
  title: string;
  level: number;
  /** Character offset of the section (heading included) in the source markdown. */
  start: number;
  /** Character offset where the next section starts (end of file for the last one). */
  end: number;
}

export interface ModuleIndex {
  sections: Record<string, SectionMeta>;
  order: string[];
}

export interface ParsedModuleData {
  sections: Record<string, SectionData>;
  order: string[];
}

const headingRegex = /^(#{1,3})\s+(.+)$/;

// ============================================
// HELPER: Index sections without copying their text
// ============================================

/**
 * One pass over the markdown that records *where* each section lives instead of
 * slicing every section's text. The table of contents only needs ids, titles
 * and levels, so the reading view can pull a single section's text on demand
 * (`readSectionContent`) rather than materialising the whole module.
 */
export function indexModuleSections(markdown: string): ModuleIndex {
  if (!markdown) return { sections: {}, order: [] };

  const sections: Record<string, SectionMeta> = {};
  const order: string[] = [];

  let current: SectionMeta | null = null;
  let offset = 0;

  for (const line of markdown.split("\n")) {
    // Fast path: headings must start with #
    const match = line[0] === "#" ? headingRegex.exec(line) : null;

    if (match) {
      // The previous section ends where this heading begins.
      if (current) current.end = offset;

      const level = match[1].length;
      const title = match[2].trim();
      const id = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      // Handle duplicate IDs by appending random string if needed (though unlikely with title slug)
      const uniqueId = sections[id] ? `${id}-${Math.random().toString(36).substr(2, 5)}` : id;

      current = { id: uniqueId, title, level, start: offset, end: markdown.length };
      sections[uniqueId] = current;
      order.push(uniqueId);
    }

    offset += line.length + 1; // + the newline we split on
  }

  return { sections, order };
}

/** Slice a single section's markdown out of the source. */
export function readSectionContent(markdown: string, meta: SectionMeta | null | undefined): string {
  if (!markdown || !meta) return "";
  return markdown.slice(meta.start, meta.end).trim();
}

// ============================================
// HELPER: Parse all sections from Markdown
// ============================================

/** Index first, then read every section. Callers that only show one section at
 *  a time should use `indexModuleSections` + `readSectionContent` instead. */
export function parseModuleSections(markdown: string): ParsedModuleData {
  if (!markdown) return { sections: {}, order: [] };

  const { sections: meta, order } = indexModuleSections(markdown);
  const sections: Record<string, SectionData> = {};

  for (const id of order) {
    const item = meta[id];
    sections[id] = {
      id: item.id,
      title: item.title,
      level: item.level,
      content: readSectionContent(markdown, item),
    };
  }

  return { sections, order };
}
