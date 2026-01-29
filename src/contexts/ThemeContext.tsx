import { createContext, useContext, useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("theme") as Theme) || "system";
        }
        return "system";
    });

    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        let resolved: "light" | "dark";
        if (theme === "system") {
            resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        } else {
            resolved = theme;
        }

        root.classList.add(resolved);
        setResolvedTheme(resolved);
        localStorage.setItem("theme", theme);

        // Update meta theme-color
        const metaThemeColor = document.querySelector("meta[name='theme-color']");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", resolved === "dark" ? "#09090b" : "#ffffff");
        }
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");
            const newTheme = e.matches ? "dark" : "light";
            root.classList.add(newTheme);
            setResolvedTheme(newTheme);

            // Update meta theme-color for system changes
            const metaThemeColor = document.querySelector("meta[name='theme-color']");
            if (metaThemeColor) {
                metaThemeColor.setAttribute("content", newTheme === "dark" ? "#09090b" : "#ffffff");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
