import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, User, ArrowLeft, ArrowRight, Eye, EyeOff, Github } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, role, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Redirect to role-based dashboard if already logged in
  useEffect(() => {
    if (user && role) {
      const dashboardPath = role === 'admin'
        ? '/dashboard/admin'
        : role === 'tutor'
          ? '/dashboard/tutor'
          : '/dashboard/user';
      navigate(dashboardPath);
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

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast({
        title: "Email diperlukan",
        description: "Masukkan email Anda untuk reset password.",
        variant: "destructive",
      });
      return;
    }

    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setForgotLoading(false);

    if (error) {
      toast({
        title: "Gagal mengirim email",
        description: getErrorMessage(error.message),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email terkirim",
        description: "Cek inbox Anda untuk link reset password.",
      });
      setIsForgotPassword(false);
      setForgotEmail("");
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
  // RENDER - NEW 2-COLUMN LAYOUT
  // ============================================

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-background antialiased">
      {/* Left Side: Abstract Illustration */}
      <div className="hidden md:flex w-1/2 h-full bg-[#f0f9ff] relative items-center justify-center p-12 overflow-hidden">
        {/* Abstract Shapes Composition */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#e0f2fe] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[#bae6fd] rounded-full mix-blend-multiply filter blur-3xl opacity-60" />
          <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-[#7dd3fc] rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
        </div>

        <div className="relative z-10 max-w-lg w-full">
          {/* Abstract CSS Art */}
          <div className="w-full aspect-square bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full p-16 flex flex-col justify-between">
              {/* Floating Lines */}
              <div className="space-y-4">
                <div className="w-3/4 h-2 bg-primary/10 rounded-full" />
                <div className="w-1/2 h-2 bg-primary/20 rounded-full ml-8" />
                <div className="w-2/3 h-2 bg-primary/10 rounded-full" />
              </div>

              <div className="flex gap-4 items-end justify-center h-48">
                <div className="w-16 h-32 bg-gradient-to-t from-primary/30 to-primary/5 rounded-t-xl" />
                <div className="w-16 h-48 bg-gradient-to-t from-primary/40 to-primary/10 rounded-t-xl" />
                <div className="w-16 h-24 bg-gradient-to-t from-primary/20 to-primary/5 rounded-t-xl" />
              </div>
            </div>
          </div>

          <div className="mt-8 text-center md:text-left">
            <h2 className="text-2xl font-semibold text-[#0c4a6e] mb-2">Master your craft.</h2>
            <p className="text-primary opacity-80 max-w-sm">
              Join a community of developers building the future, one commit at a time.
            </p>
          </div>
        </div>

        {/* Brand Mark Top Left */}
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            L
          </div>
          <span className="font-bold text-lg tracking-tight text-[#0c4a6e]">LearnInk</span>
        </Link>
      </div>

      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center items-center p-6 sm:p-12 relative bg-card">
        {/* Mobile Brand Mark */}
        <Link to="/" className="md:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            L
          </div>
          <span className="font-bold text-lg tracking-tight">LearnInk</span>
        </Link>

        <div className="w-full max-w-[420px] flex flex-col gap-6 animate-fade-in">
          {/* Forgot Password View */}
          {isForgotPassword ? (
            <>
              <div className="space-y-1 text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Reset Password</h1>
                <p className="text-muted-foreground text-sm font-medium">
                  Masukkan email untuk menerima link reset password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="forgot-email" className="text-sm font-semibold ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="rounded-xl px-4 py-3 h-12"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="mt-4 w-full rounded-xl py-3.5 h-12 font-semibold"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Link Reset"
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                <button
                  onClick={() => setIsForgotPassword(false)}
                  className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke login
                </button>
              </p>
            </>
          ) : isLogin ? (
            /* Login Form */
            <>
              <div className="space-y-1 text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Welcome back.
                </h1>
                <p className="text-muted-foreground text-sm font-medium">Ready to continue?</p>
              </div>

              {/* Social Auth */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('github')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl h-11"
                >
                  <Github className="h-5 w-5" />
                  <span className="text-sm font-semibold">GitHub</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl h-11"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-sm font-semibold">Google</span>
                </Button>
              </div>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border" />
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-border" />
              </div>

              {/* Email/Pass Form */}
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="flex flex-col gap-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold ml-1">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@example.com"
                            className="rounded-xl px-4 py-3 h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center ml-1">
                          <FormLabel className="text-sm font-semibold">Password</FormLabel>
                          <button
                            type="button"
                            onClick={() => setIsForgotPassword(true)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="rounded-xl px-4 py-3 h-12 pr-10"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-4 w-full rounded-xl py-3.5 h-12 font-semibold group"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Don't have an account?{" "}
                <button
                  onClick={toggleMode}
                  className="font-bold text-primary hover:underline"
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            /* Register Form */
            <>
              <div className="space-y-1 text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Create an account
                </h1>
                <p className="text-muted-foreground text-sm font-medium">
                  Start your learning journey today.
                </p>
              </div>

              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="flex flex-col gap-4">
                  <FormField
                    control={registerForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold ml-1">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Your name"
                            className="rounded-xl px-4 py-3 h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold ml-1">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@example.com"
                            className="rounded-xl px-4 py-3 h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold ml-1">Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Minimal 6 characters"
                              className="rounded-xl px-4 py-3 h-12 pr-10"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                        <FormLabel className="text-sm font-semibold ml-1">Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Repeat password"
                            className="rounded-xl px-4 py-3 h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-4 w-full rounded-xl py-3.5 h-12 font-semibold group"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{" "}
                <button
                  onClick={toggleMode}
                  className="font-bold text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>

        {/* Footer / Legal */}
        <div className="absolute bottom-6 w-full text-center">
          <p className="text-xs text-muted-foreground">© 2024 LearnInk Inc.</p>
        </div>
      </div>
    </div>
  );
}
