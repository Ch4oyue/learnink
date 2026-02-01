import { useEffect, useState, useCallback } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { usePerformance } from "@/hooks/usePerformance";

/**
 * CustomCursor - Premium animated cursor with spring physics
 * 
 * Features:
 * - Small dot (8px) follows cursor exactly
 * - Large circle (40px) follows with spring delay
 * - Scales up on interactive elements
 * - Hidden on mobile/touch devices
 * - Respects prefers-reduced-motion
 * - Auto-disables on low-end devices (Unified via usePerformance)
 */

// Cache for element cursor styles to avoid layout thrashing
const cursorStyleCache = new WeakMap<HTMLElement, string>();

export function CustomCursor() {
    const { isLowEnd, prefersReducedMotion, isTouchDevice } = usePerformance();
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isPointer, setIsPointer] = useState(false);

    // Motion values for smooth cursor tracking
    const cursorX = useMotionValue(0);
    const cursorY = useMotionValue(0);

    // Spring config for the outer circle (delayed follow)
    const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
    const circleX = useSpring(cursorX, springConfig);
    const circleY = useSpring(cursorY, springConfig);

    // Mouse move handler - throttled for performance
    const handleMouseMove = useCallback((e: MouseEvent) => {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
        setIsVisible(true);
    }, [cursorX, cursorY]);

    // Mouse leave handler
    const handleMouseLeave = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Check if hovering interactive element
    const handleElementHover = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isInteractive = target.closest(
            'button, a, [role="button"], input, textarea, select, .clickable, [data-cursor-hover]'
        );

    let cursor = cursorStyleCache.get(target);
    if (cursor === undefined) {
        cursor = window.getComputedStyle(target).cursor;
        cursorStyleCache.set(target, cursor);
    }
    const isPointerCursor = cursor === "pointer";

        setIsHovering(!!isInteractive);
        setIsPointer(isPointerCursor);
    }, []);

    useEffect(() => {
        // Skip on touch devices, low-end devices, or reduced motion preference
        if (isTouchDevice || prefersReducedMotion || isLowEnd) {
            document.body.style.cursor = "";
            return;
        }

        // Hide default cursor globally
        document.body.style.cursor = "none";

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("mouseover", handleElementHover);

        return () => {
            document.body.style.cursor = "";
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("mouseover", handleElementHover);
        };
    }, [isTouchDevice, prefersReducedMotion, isLowEnd, handleMouseMove, handleMouseLeave, handleElementHover]);

    // Don't render on touch devices, low-end devices, or if reduced motion is preferred
    if (isTouchDevice || prefersReducedMotion || isLowEnd) {
        return null;
    }

    return (
        <>
            {/* Cursor dot - follows exactly */}
            <motion.div
                aria-hidden="true"
                className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    opacity: isVisible ? 1 : 0,
                    scale: isHovering || isPointer ? 0 : 1,
                }}
                transition={{ duration: 0.15 }}
            >
                <div className="w-2 h-2 rounded-full bg-white" />
            </motion.div>

            {/* Cursor circle - follows with spring delay */}
            <motion.div
                aria-hidden="true"
                className="fixed top-0 left-0 z-[9998] pointer-events-none"
                style={{
                    x: circleX,
                    y: circleY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    opacity: isVisible ? 1 : 0,
                    scale: isHovering || isPointer ? 1.5 : 1,
                }}
                transition={{
                    opacity: { duration: 0.15 },
                    scale: { type: "spring", stiffness: 300, damping: 20 },
                }}
            >
                <div
                    className={`
                        w-10 h-10 rounded-full border-2
                        transition-colors duration-200
                        ${isHovering || isPointer
                            ? "border-primary bg-primary/10"
                            : "border-foreground/30 bg-transparent"
                        }
                    `}
                />
            </motion.div>

            {/* Global cursor hiding styles */}
            <style>{`
                * {
                    cursor: none !important;
                }
                
                /* Restore cursor for inputs where selection is important */
                input[type="text"],
                input[type="email"],
                input[type="password"],
                input[type="search"],
                input[type="url"],
                input[type="tel"],
                input[type="number"],
                textarea {
                    cursor: text !important;
                }
            `}</style>
        </>
    );
}
