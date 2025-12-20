import { Lock, Play, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LockedContentOverlayProps {
  isAuthenticated: boolean;
  onStartLearning: () => void;
  isLoading?: boolean;
}

export function LockedContentOverlay({
  isAuthenticated,
  onStartLearning,
  isLoading,
}: LockedContentOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-sm z-10">
      <div className="text-center p-8 max-w-md">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Materi Terkunci
        </h3>
        <p className="text-muted-foreground mb-6">
          {isAuthenticated
            ? "Klik tombol di bawah untuk mulai belajar dan membuka materi pembelajaran."
            : "Silakan masuk untuk mengakses materi pembelajaran dan melacak progres Anda."}
        </p>
        {isAuthenticated ? (
          <Button onClick={onStartLearning} disabled={isLoading} size="lg" className="gap-2">
            <Play className="h-5 w-5" />
            Mulai Belajar
          </Button>
        ) : (
          <Button asChild size="lg" className="gap-2">
            <Link to="/auth">
              <LogIn className="h-5 w-5" />
              Masuk untuk Belajar
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
