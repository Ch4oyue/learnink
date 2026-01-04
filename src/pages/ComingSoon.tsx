import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft, Sparkles } from "lucide-react";

interface ComingSoonProps {
    title?: string;
    description?: string;
}

export default function ComingSoon({
    title = "Segera Hadir",
    description = "Fitur ini sedang dalam pengembangan dan akan segera tersedia."
}: ComingSoonProps) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Animated Icon */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                    <div className="relative flex items-center justify-center h-full">
                        <Construction className="h-12 w-12 text-primary" />
                    </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        {title}
                    </h1>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild variant="default">
                        <Link to="/">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali ke Beranda
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link to="/modules">
                            Lihat Modul
                        </Link>
                    </Button>
                </div>

                {/* Progress indicator */}
                <div className="pt-4">
                    <div className="h-2 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
                        <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Pengembangan 60% selesai</p>
                </div>
            </div>
        </div>
    );
}
