import { useState, useEffect } from 'react';

interface SelectionState {
    text: string;
    top: number;
    left: number;
}

export function useTextSelection() {
    const [selection, setSelection] = useState<SelectionState | null>(null);

    useEffect(() => {
        let timeoutId: number | null = null;

        const handleSelection = () => {
            if (timeoutId) window.clearTimeout(timeoutId);

            timeoutId = window.setTimeout(() => {
                const sel = window.getSelection();
                if (!sel || sel.isCollapsed || !sel.toString().trim()) {
                    setSelection(null);
                    return;
                }

                // Check if selection is within the reading content
                // We use a general selector or just check if it's within a main content area
                const contentElement = document.querySelector('.reading-content');
                if (contentElement && !contentElement.contains(sel.anchorNode)) {
                    setSelection(null);
                    return;
                }

                try {
                    const range = sel.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    setSelection({
                        text: sel.toString().trim(),
                        top: rect.top - 50,
                        left: rect.left + (rect.width / 2)
                    });
                } catch (e) {
                    setSelection(null);
                }
            }, 100); // Debounce for performance
        };

        const handleSelectionClear = () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) {
                setSelection(null);
            }
        };

        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('keyup', handleSelection);
        document.addEventListener('selectionchange', handleSelectionClear);

        return () => {
            if (timeoutId) window.clearTimeout(timeoutId);
            document.removeEventListener('mouseup', handleSelection);
            document.removeEventListener('keyup', handleSelection);
            document.removeEventListener('selectionchange', handleSelectionClear);
        };
    }, []);

    const clearSelection = () => {
        window.getSelection()?.removeAllRanges();
        setSelection(null);
    };

    return { selection, setSelection, clearSelection };
}
