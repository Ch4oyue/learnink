/**
 * TopProgressBar - A subtle loading bar at the top of the screen
 * Triggered when lazy components are being loaded.
 *
 * The growth is a keyframe animation (see `progress-grow` in tailwind.config.ts)
 * instead of a 100ms interval, so nothing wakes the main thread while a route
 * chunk is loading. The keyframes follow the same easing curve the interval
 * used, so the bar looks identical.
 */
export function TopProgressBar() {
    return (
        <div
            className="fixed top-0 left-0 w-full h-1 z-[100] pointer-events-none"
            aria-hidden="true"
        >
            <div
                className="h-full bg-primary animate-progress-grow"
                style={{ boxShadow: "0 0 10px hsl(var(--primary-hsl))" }}
            />
        </div>
    );
}
