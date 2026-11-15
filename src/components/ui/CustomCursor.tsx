import { useEffect, useState, useCallback } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { usePerformance } from "@/hooks/usePerformance";

/**
 * CustomCursor - a soft pointer halo that trails the system cursor.
 *
 * The native pointer is never hidden: people who enlarged or inverted their OS
 * cursor keep it, and the halo is purely additive decoration.
 * Disabled on touch devices, low-end hardware and when Reduce Motion is on.
 */

export function CustomCursor() {
    const { isLowEnd, prefersReducedMotion, isTouchDevice } = usePerformance();
    const [isVisible, setIsVisible] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // Motion values for the trailing halo
    const cursorX = useMotionValue(0);
    const cursorY = useMotionValue(0);

    // Spring config for the delayed follow
    const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
    const circleX = useSpring(cursorX, springConfig);
    const circleY = useSpring(cursorY, springConfig);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
        setIsVisible(true);
    }, [cursorX, cursorY]);

    const handleMouseLeave = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Check if hovering an interactive element
    const handleElementHover = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        setIsActive(!!target.closest(
            'button, a, [role="button"], input, textarea, select, .clickable, [data-cursor-hover]'
        ));
    }, []);

    useEffect(() => {
        if (isTouchDevice || prefersReducedMotion || isLowEnd) return;

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("mouseover", handleElementHover);

        return () => {
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
                scale: isActive ? 1.5 : 1,
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
                    ${isActive
                        ? "border-primary bg-primary/10"
                        : "border-foreground/30 bg-transparent"
                    }
                `}
            />
        </motion.div>
    );
}
