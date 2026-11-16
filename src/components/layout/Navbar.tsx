import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X, LogOut, User, LayoutDashboard, ChevronDown, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#fitur", label: "Features" },
  { href: "/syllabus", label: "Syllabus", isRoute: true },
  { href: "#request", label: "Material Requests" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
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

  const handleAuthClick = () => {
    navigate("/auth");
    setIsMobileMenuOpen(false);
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
    setIsMobileMenuOpen(false);
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  const handleNavClick = (href: string, isRoute?: boolean) => {
    setIsMobileMenuOpen(false);
    if (isRoute) {
      navigate(href);
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled || isMobileMenuOpen
          ? "glass-liquid m-4 rounded-[32px] shadow-glow border-none"
          : "bg-transparent m-4 border-transparent"
      )}
    >
      <nav className="container mx-auto px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            Learn<span className="text-primary">Ink</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="nav-link text-sm font-medium"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="nav-link text-sm font-medium"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>

          {/* Desktop Auth Buttons + Theme Toggle */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Ganti Tema"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            {loading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <>
                <Button
                  onClick={handleDashboardClick}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-foreground">
                          {initials}
                        </span>
                      </div>
                      <span className="max-w-[100px] truncate">{displayName}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                      <User className="h-4 w-4 mr-2" />
                      Profil Saya
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDashboardClick}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive-text">
                      <LogOut className="h-4 w-4 mr-2" />
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={handleAuthClick}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
                >
                  Masuk
                </Button>
                <Button
                  onClick={handleAuthClick}
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
          "lg:hidden overflow-hidden transition-all duration-500 ease-in-out",
          isMobileMenuOpen ? "max-h-[80vh] opacity-100 pb-4" : "max-h-0 opacity-0"
        )}
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-col gap-1 pt-4 border-t border-white/10">
            {navLinks.map((link, index) => (
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => handleNavClick(link.href, link.isRoute)}
                  className="py-3 text-base font-medium text-muted-foreground transition-colors hover:text-foreground animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="py-3 text-base font-medium text-muted-foreground transition-colors hover:text-foreground animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {link.label}
                </a>
              )
            ))}
            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-border">
              {/* Theme Toggle - Mobile */}
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="justify-start gap-2 text-muted-foreground"
              >
                {resolvedTheme === "dark" ? (
                  <><Sun className="h-4 w-4" /> Light Mode</>
                ) : (
                  <><Moon className="h-4 w-4" /> Dark Mode</>
                )}
              </Button>
              {loading ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
              ) : user ? (
                <>
                  <Button
                    onClick={handleDashboardClick}
                    variant="outline"
                    className="justify-start gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigate("/dashboard/profile");
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start text-base font-medium text-muted-foreground hover:text-foreground hover:bg-transparent px-0 gap-2"
                  >
                    <User className="h-4 w-4" />
                    {displayName}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="justify-start text-base font-medium text-destructive-text hover:text-destructive-text hover:bg-transparent px-0 gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleAuthClick}
                    className="justify-start text-base font-medium text-muted-foreground hover:text-foreground hover:bg-transparent px-0"
                  >
                    Masuk
                  </Button>
                  <Button
                    onClick={handleAuthClick}
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
