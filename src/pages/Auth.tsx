import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, User, Github, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ============================================
// SCHEMAS (Preserved from original)
// ============================================

const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255, "Email terlalu panjang"),
  password: z.string().min(6, "Password minimal 6 karakter").max(72, "Password terlalu panjang"),
});

const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Nama minimal 2 karakter").max(100, "Nama terlalu panjang"),
  email: z.string().trim().email("Email tidak valid").max(255, "Email terlalu panjang"),
  password: z.string().min(6, "Password minimal 6 karakter").max(72, "Password terlalu panjang"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================
// MAIN AUTH COMPONENT
// ============================================

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user, role, signIn, signUp } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Determine if dark styling should be used (Auth page works best in dark)
  const isDark = resolvedTheme === "dark";

  // ============================================
  // AUTH LOGIC (Preserved from original)
  // ============================================

  const getErrorMessage = (errorMessage: string): string => {
    if (errorMessage.includes("Invalid login credentials")) {
      return "Email atau password salah";
    }
    if (errorMessage.includes("User already registered")) {
      return "Email sudah terdaftar. Silakan masuk.";
    }
    if (errorMessage.includes("Email not confirmed")) {
      return "Silakan konfirmasi email Anda terlebih dahulu";
    }
    if (errorMessage.includes("Too many requests")) {
      return "Terlalu banyak percobaan. Silakan coba lagi nanti.";
    }
    return "Terjadi kesalahan. Silakan coba lagi.";
  };

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && role) {
      // All users go to same dashboard, role-based features handled inside
      navigate('/dashboard');
    }
  }, [user, role, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Gagal masuk",
        description: getErrorMessage(error.message),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil masuk",
        description: "Selamat datang kembali!",
      });
      navigate("/dashboard");
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.displayName);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Gagal mendaftar",
        description: getErrorMessage(error.message),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil mendaftar",
        description: "Silakan cek email Anda untuk verifikasi.",
      });
    }
  };

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Gagal login",
        description: getErrorMessage(error.message),
        variant: "destructive",
      });
    }
  };

  // ============================================
  // RENDER - NEW DARK DESIGN
  // ============================================

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center bg-background text-foreground font-sans p-4 relative transition-colors duration-300">
      {/* Main Card */}
      <main className="w-full max-w-5xl h-[85vh] bg-card rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-xl border border-border z-10">

        {/* Left Column - Visual */}
        <section className="hidden md:flex w-full md:w-1/2 relative p-12 flex-col items-center justify-center text-center overflow-hidden bg-primary/10 dark:bg-primary/5">
          {/* Decorative blobs */}
          <div className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary/60 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          </div>

          {/* Illustration */}
          <div className="relative z-10 mb-8 w-full max-w-xs">
            <div className="w-full aspect-square bg-muted/50 rounded-lg border border-border shadow-2xl flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">👨‍💻</div>
                <div className="font-mono text-sm text-muted-foreground">
                  const skills = ["React", "Python", "TypeScript"];
                </div>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary flex items-center justify-center w-10 h-10 rounded-lg">
                <span className="text-primary-foreground font-mono font-bold text-lg">&gt;_</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">LearnInk</h2>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              Master tech skills, the lazy way.<br />
              All courses are free.
            </p>
          </div>
        </section>

        {/* Right Column - Form */}
        <section className="w-full md:w-1/2 bg-card p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-10">
              {isLogin ? "Welcome back, ready to build?" : "Create your account"}
            </h1>

            {isLogin ? (
              /* Login Form */
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                  {/* Email Field */}
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Email address</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="username"
                              placeholder="you@example.com"
                              className="pl-11 bg-black/20 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:bg-black/40 focus:border-primary focus:ring-primary rounded-2xl py-2.5 transition-all duration-300"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password Field */}
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
                          <button
                            type="button"
                            className="text-sm text-primary hover:text-primary/80 transition-colors"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              placeholder="••••••••"
                              className="pl-11 pr-11 bg-black/20 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:bg-black/40 focus:border-primary focus:ring-primary rounded-2xl py-2.5 transition-all duration-300"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Remember Me */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-border data-[state=checked]:bg-primary"
                    />
                    <label htmlFor="remember" className="text-sm text-muted-foreground">
                      Remember me for 30 days
                    </label>
                  </div>

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg py-2.5 font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              /* Register Form */
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Full Name</FormLabel>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input
                              type="text"
                              autoComplete="name"
                              placeholder="Your name"
                              className="pl-11 bg-black/20 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:bg-black/40 focus:border-primary focus:ring-primary rounded-2xl py-2.5 transition-all duration-300"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Email address</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="username"
                              placeholder="you@example.com"
                              className="pl-11 bg-black/20 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:bg-black/40 focus:border-primary focus:ring-primary rounded-2xl py-2.5 transition-all duration-300"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Minimal 6 characters"
                              className="pl-11 pr-11 bg-black/20 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:bg-black/40 focus:border-primary focus:ring-primary rounded-2xl py-2.5 transition-all duration-300"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Confirm Password</FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Repeat password"
                              className="pl-11 pr-11 bg-black/20 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:bg-black/40 focus:border-primary focus:ring-primary rounded-2xl py-2.5 transition-all duration-300"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg py-2.5 font-medium mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {/* Divider */}
            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('github')}
                className="flex items-center justify-center gap-3 rounded-lg border-border text-foreground hover:bg-muted py-2">
                <Github className="h-5 w-5" />
                <span>GitHub</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center gap-3 rounded-lg border-border text-foreground hover:bg-muted py-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Google</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom text link */}
      <div className="mt-8 text-center text-sm text-muted-foreground z-10">
        {isLogin ? (
          <>
            Don't have an account?{" "}
            <button
              onClick={() => setIsLogin(false)}
              className="font-medium text-primary hover:text-primary/80">
              Create one for free
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => setIsLogin(true)}
              className="font-medium text-primary hover:text-primary/80">
              Sign in
            </button>
          </>
        )}
      </div>

      {/* Home FAB */}
      <button
        onClick={() => navigate("/")}
        className="fixed bottom-6 left-6 p-3 rounded-full bg-card text-muted-foreground hover:text-foreground hover:bg-muted border border-border shadow-lg transition-all"
        aria-label="Back to home">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>
    </div>
  );
}
