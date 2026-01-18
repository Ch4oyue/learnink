import { useEffect, useState, useCallback } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

/**
 * CustomCursor - Premium animated cursor with spring physics
 * 
 * Features:
 * - Small dot (8px) follows cursor exactly
 * - Large circle (40px) follows with spring delay
 * - Scales up on interactive elements
 * - Hidden on mobile/touch devices
 * - Respects prefers-reduced-motion
 * - Auto-disables on low-end devices (4GB RAM or less)
 */

// Check if device is low-end (4GB RAM or less, slow CPU, or slow connection)
function isLowEndDevice(): boolean {
    if (typeof window === "undefined") return true;

    // Check device memory (in GB) - available in Chromium browsers
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (deviceMemory && deviceMemory <= 4) return true;

    // Check hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;

    // Check for slow connection
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    if (connection) {
        if (connection.saveData) return true;
        if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") return true;
    }

    return false;
}

export function CustomCursor() {
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

    // Check if device supports hover (not touch-only)
    const [isTouchDevice, setIsTouchDevice] = useState(true);

    // Check for low-end device
    const [isLowEnd, setIsLowEnd] = useState(true);

    useEffect(() => {
        // Detect if this is a touch-only device
        const checkTouch = () => {
            const hasHover = window.matchMedia("(hover: hover)").matches;
            const hasPointer = window.matchMedia("(pointer: fine)").matches;
            setIsTouchDevice(!hasHover || !hasPointer);
        };

        // Check low-end device
        setIsLowEnd(isLowEndDevice());

        checkTouch();
        window.addEventListener("resize", checkTouch);

        return () => window.removeEventListener("resize", checkTouch);
    }, []);

    // Check for reduced motion preference
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener("change", handler);

        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

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
        const isPointerCursor = window.getComputedStyle(target).cursor === "pointer";

        setIsHovering(!!isInteractive);
        setIsPointer(isPointerCursor);
    }, []);

    useEffect(() => {
        // Skip on touch devices, low-end devices, or reduced motion preference
        if (isTouchDevice || prefersReducedMotion || isLowEnd) return;

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
