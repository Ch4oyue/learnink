import type { Config } from "tailwindcss";
import tailwindcssTypography from "@tailwindcss/typography";

export default {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
            },
            colors: {
                border: "hsl(var(--border-hsl))",
                input: "hsl(var(--input-hsl))",
                ring: "hsl(var(--ring-hsl))",
                background: "hsl(var(--background-hsl))",
                foreground: "hsl(var(--foreground-hsl))",
                primary: {
                    DEFAULT: "hsl(var(--primary-hsl))",
                    foreground: "hsl(var(--primary-foreground-hsl))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary-hsl))",
                    foreground: "hsl(var(--secondary-foreground-hsl))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive-hsl))",
                    foreground: "hsl(var(--destructive-foreground-hsl))",
                    text: "hsl(var(--destructive-text-hsl))",
                },
                success: {
                    DEFAULT: "hsl(var(--success-hsl))",
                    foreground: "hsl(var(--success-foreground-hsl))",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning-hsl))",
                    foreground: "hsl(var(--warning-foreground-hsl))",
                },
                info: {
                    DEFAULT: "hsl(var(--info-hsl))",
                    foreground: "hsl(var(--info-foreground-hsl))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted-hsl))",
                    foreground: "hsl(var(--muted-foreground-hsl))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent-muted))",
                    foreground: "hsl(var(--accent-muted-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover-hsl))",
                    foreground: "hsl(var(--popover-foreground-hsl))",
                },
                card: {
                    DEFAULT: "hsl(var(--card-hsl))",
                    foreground: "hsl(var(--card-foreground-hsl))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-hsl))",
                    foreground: "hsl(var(--sidebar-foreground-hsl))",
                    border: "hsl(var(--sidebar-border-hsl))",
                    accent: "hsl(var(--sidebar-accent-hsl))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground-hsl))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                // Tracks the old 100ms interval easing (p += (90 - p) * 0.1)
                // so the bar looks identical without any JavaScript ticking.
                "progress-grow": {
                    "0%": { width: "0%" },
                    "2%": { width: "10.7%" },
                    "4%": { width: "20.1%" },
                    "6%": { width: "28.4%" },
                    "8%": { width: "35.7%" },
                    "10%": { width: "42.2%" },
                    "12.5%": { width: "49.2%" },
                    "16%": { width: "57.3%" },
                    "20%": { width: "64.6%" },
                    "25%": { width: "71.5%" },
                    "33%": { width: "78.8%" },
                    "42%": { width: "83.7%" },
                    "50%": { width: "86.2%" },
                    "60%": { width: "88%" },
                    "70%": { width: "88.9%" },
                    "85%": { width: "89.6%" },
                    "100%": { width: "90%" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "progress-grow": "progress-grow 6s linear forwards",
            },
        },
    },
    plugins: [tailwindcssTypography],
} satisfies Config;
