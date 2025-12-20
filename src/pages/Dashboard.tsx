import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="text-xl font-semibold tracking-tight text-foreground">
              Learn<span className="text-primary">AI</span>
            </a>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Selamat datang, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Lanjutkan perjalanan belajar AI automation Anda.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Modul Aktif</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">0%</p>
                <p className="text-sm text-muted-foreground">Progress Total</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Modul Selesai</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-soft">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Belum ada modul yang diikuti
            </h2>
            <p className="text-muted-foreground mb-6">
              Mulai perjalanan belajar Anda dengan mengeksplorasi modul-modul yang tersedia.
            </p>
            <Button onClick={() => navigate("/#modul")}>
              Jelajahi Modul
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
