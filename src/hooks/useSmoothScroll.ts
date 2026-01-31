import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePerformance } from "@/hooks/usePerformance";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

interface UseSmoothScrollOptions {
    /** Enable smooth scroll behavior (default: true) */
    enabled?: boolean;
    /** Duration of scroll animation in seconds (default: 0.8) */
    duration?: number;
    /** GSAP easing function (default: "power2.out") */
    ease?: string;
    /** Scroll offset from top for anchor links (default: 80) */
    offset?: number;
}

/**
 * useSmoothScroll - GSAP-powered smooth scrolling hook
 * 
 * Features:
 * - Smooth scroll to anchor links
 * - ScrollTrigger animations for elements
 * - Respects prefers-reduced-motion
 * - Opt-in per page (not global to avoid form issues)
 * 
 * @param containerRef - Ref to the scrollable container
 * @param options - Configuration options
 */
export function useSmoothScroll(
    containerRef: React.RefObject<HTMLElement>,
    options: UseSmoothScrollOptions = {}
) {
    const { isLowEnd, prefersReducedMotion: prefersReducedMotionVal } = usePerformance();

    const {
        enabled = true,
        duration = 0.8,
        ease = "power2.out",
        offset = 80,
    } = options;

    const scrollTriggerInstances = useRef<ScrollTrigger[]>([]);

    // Use current value or fallback to ref if needed (but hook is better)
    const isDisabled = !enabled || prefersReducedMotionVal || isLowEnd;

    /**
     * Smooth scroll to a specific element or position
     */
    const scrollTo = useCallback((
        target: HTMLElement | number | string,
        customDuration?: number
    ) => {
        if (isDisabled) {
            // Fallback to native scroll for reduced motion or low-end
            if (typeof target === "number") {
                window.scrollTo({ top: target, behavior: "auto" });
            } else if (typeof target === "string") {
                const element = document.querySelector(target);
                element?.scrollIntoView({ behavior: "auto" });
            } else {
                target.scrollIntoView({ behavior: "auto" });
            }
            return;
        }

        let scrollTarget: number;

        if (typeof target === "number") {
            scrollTarget = target;
        } else if (typeof target === "string") {
            const element = document.querySelector(target) as HTMLElement;
            if (!element) return;
            scrollTarget = element.offsetTop - offset;
        } else {
            scrollTarget = target.offsetTop - offset;
        }

        gsap.to(window, {
            scrollTo: scrollTarget,
            duration: customDuration ?? duration,
            ease,
        });
    }, [enabled, duration, ease, offset]);

    /**
     * Create fade-in animation for elements when they enter viewport
     */
    const createFadeInAnimation = useCallback((
        selector: string,
        options?: {
            start?: string;
            stagger?: number;
            y?: number;
        }
    ) => {
        if (isDisabled) return;

        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;

        const trigger = ScrollTrigger.batch(elements, {
            onEnter: (batch) => {
                gsap.fromTo(batch,
                    {
                        opacity: 0,
                        y: options?.y ?? 30,
                    },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: "power2.out",
                        stagger: options?.stagger ?? 0.1,
                    }
                );
            },
            start: options?.start ?? "top 85%",
            once: true,
        });

        scrollTriggerInstances.current.push(...(Array.isArray(trigger) ? trigger : [trigger]));
    }, [enabled]);

    /**
     * Create parallax effect for an element
     */
    const createParallax = useCallback((
        element: HTMLElement,
        speed: number = 0.5
    ) => {
        if (isDisabled) return;

        const trigger = ScrollTrigger.create({
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
                const yPos = (self.progress - 0.5) * 100 * speed;
                gsap.set(element, { y: yPos });
            },
        });

        scrollTriggerInstances.current.push(trigger);
    }, [enabled]);

    // Handle anchor link clicks
    useEffect(() => {
        if (isDisabled) return;

        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement;

            if (anchor) {
                const href = anchor.getAttribute("href");
                if (href && href !== "#") {
                    e.preventDefault();
                    scrollTo(href);
                }
            }
        };

        document.addEventListener("click", handleAnchorClick);

        return () => {
            document.removeEventListener("click", handleAnchorClick);
        };
    }, [enabled, scrollTo]);

    // Cleanup ScrollTrigger instances on unmount
    useEffect(() => {
        return () => {
            scrollTriggerInstances.current.forEach((instance) => instance.kill());
            scrollTriggerInstances.current = [];
        };
    }, []);

    // Refresh ScrollTrigger when container changes
    useEffect(() => {
        if (containerRef.current) {
            ScrollTrigger.refresh();
        }
    }, [containerRef]);

    return {
        scrollTo,
        createFadeInAnimation,
        createParallax,
        refresh: () => ScrollTrigger.refresh(),
    };
}

/**
 * Simple hook for enabling smooth scroll on a page
 * Just call this in your component to enable smooth anchor scrolling
 */
export function useSimpleSmoothScroll(enabled: boolean = true) {
    useEffect(() => {
        if (!enabled) return;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) return;

        // Add smooth scroll class to html element
        document.documentElement.style.scrollBehavior = "smooth";

        return () => {
            document.documentElement.style.scrollBehavior = "";
        };
    }, [enabled]);
}
