import { useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();

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

                {/* Single CTA Button - Goes back to previous page */}
                <Button onClick={() => navigate(-1)} variant="default">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                </Button>
            </div>
        </div>
    );
}
