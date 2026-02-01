import { useEffect, useState } from "react";

/**
 * TopProgressBar - A subtle loading bar at the top of the screen
 * Triggered when lazy components are being loaded.
 */
export function TopProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate progress increment
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return prev;
                return prev + (90 - prev) * 0.1;
            });
        }, 100);

        return () => {
            clearInterval(interval);
            setProgress(100);
        };
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-1 z-[100] pointer-events-none">
            <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, boxShadow: "0 0 10px hsl(var(--primary))" }}
            />
        </div>
    );
}
