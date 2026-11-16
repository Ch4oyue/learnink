// Display-only English labels for category/level values stored in the database.
// Stored values are never changed; these maps only affect what users see.
// Unknown values (e.g. newly added admin categories/levels) render as stored.

const CATEGORY_LABELS: Record<string, string> = {
  "AI Dasar": "AI Basics",
  "Automation": "Automation",
  "AI Tools": "AI Tools",
  "Advanced": "Advanced",
  "Prompt Engineering": "Prompt Engineering",
  "No-Code AI": "No-Code AI",
  "Umum": "General",
  "Lainnya": "Other",
  "Matematika": "Mathematics",
  "Sains": "Science",
  "Bahasa": "Languages",
  "Teknologi": "Technology",
};

const LEVEL_LABELS: Record<string, string> = {
  "Pemula": "Beginner",
  "Menengah": "Intermediate",
  "Lanjutan": "Advanced",
};

export function displayCategory(value: string | null | undefined): string {
  if (!value) return "";
  return CATEGORY_LABELS[value] ?? value;
}

export function displayLevel(value: string | null | undefined): string {
  if (!value) return "";
  return LEVEL_LABELS[value] ?? value;
}
