import { Link } from "react-router-dom";
import { Terminal } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-card border-t border-border pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 mb-4 md:mb-0">
                        <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xs font-bold">
                            <Terminal className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-foreground">LearnInk</span>
                    </Link>
                    <div className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} LearnInk Inc. Hak cipta dilindungi.
                    </div>
                </div>
            </div>
        </footer>
    );
}
