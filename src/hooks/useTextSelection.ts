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
    }, []);

    useEffect(() => {
        let timeoutId: number | null = null;

        const handleSelection = () => {
            // Clear existing timeout to debounce
            if (timeoutId) window.clearTimeout(timeoutId);

            // Debounce selection processing to avoid UI jank during rapid selection
            timeoutId = window.setTimeout(() => {
                const sel = window.getSelection();
                if (!sel || sel.isCollapsed || !sel.toString().trim()) {
                    setSelection(null);
                    return;
                }

                // Check if selection is within the reading content
                const contentElement = document.querySelector('.reading-content');
                // If we can't find the container, or selection is outside, ignore
                if (contentElement && !contentElement.contains(sel.anchorNode)) {
                    setSelection(null);
                    return;
                }

                try {
                    const range = sel.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    // Show popover above the selection
                    // We use absolute positioning relative to viewport or handled by the component
                    // Adding scrollY might be needed depending on the popover implementation, 
                    // but often fixed/portal based popovers use client rects.
                    // For now, mirroring previous logic.
                    setSelection({
                        text: sel.toString().trim(),
                        top: rect.top - 50,
                        left: rect.left + (rect.width / 2)
                    });
                } catch (e) {
                    console.warn('Selection range error:', e);
                    setSelection(null);
                }
            }, 100); // 100ms debounce
        };

        const handleSelectionChange = () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) {
                setSelection(null);
            }
        };

        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('keyup', handleSelection);
        document.addEventListener('selectionchange', handleSelectionChange);

        return () => {
            if (timeoutId) window.clearTimeout(timeoutId);
            document.removeEventListener('mouseup', handleSelection);
            document.removeEventListener('keyup', handleSelection);
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, []);

    return { selection, clearSelection };
}
