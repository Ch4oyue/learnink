/**
 * Changelog Parser Utility
 * Parses CHANGELOG.md and returns structured data for the UI
 */

export interface ChangelogEntry {
    version: string;
    date: string;
    title: string;
    description: string;
    improvements: string[];
    fixes: string[];
    patches: string[];
}

// Import the raw changelog content at build time
import changelogContent from '/CHANGELOG.md?raw';

/**
 * Parse the CHANGELOG.md content into structured entries
 */
export function parseChangelog(): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];

    // Split by version headers (## [x.x.x])
    const versionBlocks = changelogContent.split(/(?=## \[\d+\.\d+\.\d+\])/);

    for (const block of versionBlocks) {
        // Skip empty blocks or non-version blocks
        if (!block.trim() || !block.startsWith('## [')) continue;

        // Extract version and date: ## [1.3.1] - January 18, 2026
        const headerMatch = block.match(/## \[(\d+\.\d+\.\d+)\] - (.+)/);
        if (!headerMatch) continue;

        const version = headerMatch[1];
        const date = formatDate(headerMatch[2].trim());

        // Extract title (### line after version header)
        const titleMatch = block.match(/### (.+)/);
        const title = titleMatch ? titleMatch[1].trim() : 'Update';

        // Extract description (first paragraph after title)
        const descMatch = block.match(/### .+\n\n(.+?)(?=\n\n####|\n\n---|\n\n##|$)/s);
        const description = descMatch ? descMatch[1].trim() : '';

        // Extract improvements
        const improvements = extractListItems(block, 'Improvements');

        // Extract fixes  
        const fixes = extractListItems(block, 'Fixes');

        // Extract patches/database/infrastructure (combine similar categories)
        const patches = [
            ...extractListItems(block, 'Patches'),
            ...extractListItems(block, 'Database'),
            ...extractListItems(block, 'Infrastructure'),
        ];

        entries.push({
            version,
            date,
            title,
            description,
            improvements,
            fixes,
            patches,
        });
    }

    return entries;
}

/**
 * Extract list items under a specific header
 */
function extractListItems(block: string, header: string): string[] {
    // Match section: #### Header (count)\n- item1\n- item2
    const sectionRegex = new RegExp(`#### ${header}[^\\n]*\\n([\\s\\S]*?)(?=####|---|##|$)`, 'i');
    const sectionMatch = block.match(sectionRegex);

    if (!sectionMatch) return [];

    const items: string[] = [];
    const lines = sectionMatch[1].split('\n');

    for (const line of lines) {
        // Match markdown list items: - Item text or - `code` text
        const itemMatch = line.match(/^-\s+(.+)/);
        if (itemMatch) {
            // Clean up markdown formatting for display
            const cleanItem = itemMatch[1]
                .replace(/`([^`]+)`/g, '$1') // Remove code backticks
                .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
                .trim();
            items.push(cleanItem);
        }
    }

    return items;
}

/**
 * Format date from "January 18, 2026" to "Jan 18, 2026"
 */
function formatDate(dateStr: string): string {
    const months: Record<string, string> = {
        'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
        'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
        'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
    };

    for (const [full, short] of Object.entries(months)) {
        if (dateStr.includes(full)) {
            return dateStr.replace(full, short);
        }
    }

    return dateStr;
}

// Export parsed changelog data (cached)
let cachedChangelog: ChangelogEntry[] | null = null;

export function getChangelog(): ChangelogEntry[] {
    if (!cachedChangelog) {
        cachedChangelog = parseChangelog();
    }
    return cachedChangelog;
}
