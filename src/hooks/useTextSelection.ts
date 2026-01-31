import { useState, useEffect, useCallback } from 'react';

interface SelectionState {
    text: string;
    top: number;
    left: number;
}

export function useTextSelection() {
    const [selection, setSelection] = useState<SelectionState | null>(null);

    const clearSelection = useCallback(() => {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    }, []);

    useEffect(() => {
        const handleSelectionChange = () => {
            const sel = window.getSelection();

            // Basic validation
            if (!sel || sel.isCollapsed || !sel.toString().trim()) {
                // Only clear if we currently have a selection state to avoid unnecessary renders
                // But we defer clearing to 'selectionchange' event usually, handled below
                return;
            }

            // Check if selection is within the reading content
            // We rely on the class 'reading-content' being present
            const contentElement = document.querySelector('.reading-content');
            if (contentElement && !contentElement.contains(sel.anchorNode)) {
                return;
            }

            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Check for valid dimensions (avoid 0-width selections invisible to user)
            if (rect.width === 0 || rect.height === 0) return;

            setSelection({
                text: sel.toString().trim(),
                top: rect.top - 50, // Position above the text
                left: rect.left + (rect.width / 2) // Center horizontally
            });
        };

        const handleClear = () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) {
                setSelection(null);
            }
        };

        // We listen to multiple events to catch all selection scenarios
        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('keyup', handleSelectionChange);
        document.addEventListener('selectionchange', handleClear);

        return () => {
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('keyup', handleSelectionChange);
            document.removeEventListener('selectionchange', handleClear);
        };
    }, []);

    return { selection, clearSelection };
}
