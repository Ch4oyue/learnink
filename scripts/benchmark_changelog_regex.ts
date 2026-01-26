
import { performance } from 'perf_hooks';

// --- Original Implementation ---
function extractListItemsOriginal(block: string, header: string): string[] {
    // Match section: #### Header (count)\n- item1\n- item2
    // Improved regex to handle variable whitespace
    const sectionRegex = new RegExp(`#### ${header}[^\\n]*\\n([\\s\\S]*?)(?=####|---|##|$)`, 'i');
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

// --- Optimized Implementation ---
const regexCache = new Map<string, RegExp>();

function extractListItemsOptimized(block: string, header: string): string[] {
    let sectionRegex = regexCache.get(header);
    if (!sectionRegex) {
        sectionRegex = new RegExp(`#### ${header}[^\\n]*\\n([\\s\\S]*?)(?=####|---|##|$)`, 'i');
        regexCache.set(header, sectionRegex);
    }

    const sectionMatch = block.match(sectionRegex);

    if (!sectionMatch) return [];

    const items: string[] = [];
    const lines = sectionMatch[1].split('\n');

    for (const line of lines) {
        const itemMatch = line.match(/^-\s+(.+)/);
        if (itemMatch) {
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

// --- Benchmark Setup ---
const sampleBlock = `
## [1.4.0] - 2024-03-20
### Major Update

#### Improvements (3)
- Added new performance tracking module
- Updated UI components to glass-liquid theme
- Refactored changelog parser for better speed

#### Fixes (2)
- Fixed login race condition
- Resolved mobile sidebar scrolling issue

#### Database
- Added index on user_id
`;

const ITERATIONS = 100000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

// --- Verify Correctness ---
const originalResult = extractListItemsOriginal(sampleBlock, 'Improvements');
const optimizedResult = extractListItemsOptimized(sampleBlock, 'Improvements');

if (JSON.stringify(originalResult) !== JSON.stringify(optimizedResult)) {
    console.error('Mismatch in results!');
    console.error('Original:', originalResult);
    console.error('Optimized:', optimizedResult);
    process.exit(1);
}
console.log('✅ Correctness verified: Outputs match.');

// --- Run Benchmark ---

// Measure Original
const startOriginal = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    extractListItemsOriginal(sampleBlock, 'Improvements');
    extractListItemsOriginal(sampleBlock, 'Fixes');
    extractListItemsOriginal(sampleBlock, 'Database');
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;

// Measure Optimized
const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    extractListItemsOptimized(sampleBlock, 'Improvements');
    extractListItemsOptimized(sampleBlock, 'Fixes');
    extractListItemsOptimized(sampleBlock, 'Database');
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

// --- Report ---
console.log('\nResults:');
console.log(`Original: ${timeOriginal.toFixed(2)}ms`);
console.log(`Optimized: ${timeOptimized.toFixed(2)}ms`);
console.log(`Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}% faster`);
