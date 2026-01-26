
// Cache for regex compilation to improve performance
const sectionRegexCache = new Map<string, RegExp>();

/**
 * Extract list items under a specific header
 */
export function extractListItems(block: string, header: string): string[] {
    // Match section: #### Header (count)\n- item1\n- item2
    // Improved regex to handle variable whitespace
    let sectionRegex = sectionRegexCache.get(header);
    if (!sectionRegex) {
        sectionRegex = new RegExp(`#### ${header}[^\\n]*\\n([\\s\\S]*?)(?=####|---|##|$)`, 'i');
        sectionRegexCache.set(header, sectionRegex);
    }

    const sectionMatch = block.match(sectionRegex);

    if (!sectionMatch) return [];

    const items: string[] = [];
    const lines = sectionMatch[1].split('\n');

    for (const line of lines) {
        // Match markdown list items: - Item text or - `code` text
        const itemMatch = line.match(/^-\s+(.+)/);
        if (itemMatch) {
            // Sanitize: remove any script tags or dangerous patterns
            const cleanItem = itemMatch[1]
                .trim()
                .replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '');
            if (cleanItem) {
                items.push(cleanItem);
            }
        }
    }

    return items;
}
