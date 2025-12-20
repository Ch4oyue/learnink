import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#fitur", label: "Fitur" },
  { href: "#silabus", label: "Silabus" },
  { href: "#modul", label: "Daftar Modul" },
  { href: "#request", label: "Request Materi" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };

  const handleAuthClick = (isRegister: boolean) => {
    navigate("/auth");
    setIsMobileMenuOpen(false);
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
    setIsMobileMenuOpen(false);
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-lg shadow-soft"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between">
          {/* Logo */}
          <a
            href="#home"
            className="text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            Learn<span className="text-primary">AI</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            {loading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleDashboardClick}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-transparent gap-2"
                >
                  <User className="h-4 w-4" />
                  {displayName}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-transparent gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => handleAuthClick(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
                >
                  Masuk
                </Button>
                <Button
                  onClick={() => handleAuthClick(true)}
                  className="text-sm font-medium shadow-soft hover:shadow-medium transition-shadow"
                >
                  Daftar
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 -mr-2 text-foreground transition-colors hover:text-primary"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-out",
          isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="container mx-auto px-6 pb-6 bg-background/95 backdrop-blur-lg">
          <div className="flex flex-col gap-1 pt-4 border-t border-border">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-3 text-base font-medium text-muted-foreground transition-colors hover:text-foreground animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-border">
              {loading ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
              ) : user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleDashboardClick}
                    className="justify-start text-base font-medium text-muted-foreground hover:text-foreground hover:bg-transparent px-0 gap-2"
                  >
                    <User className="h-4 w-4" />
                    {displayName}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="justify-start text-base font-medium text-muted-foreground hover:text-foreground hover:bg-transparent px-0 gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => handleAuthClick(false)}
                    className="justify-start text-base font-medium text-muted-foreground hover:text-foreground hover:bg-transparent px-0"
                  >
                    Masuk
                  </Button>
                  <Button
                    onClick={() => handleAuthClick(true)}
                    className="w-full text-base font-medium"
                  >
                    Daftar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
