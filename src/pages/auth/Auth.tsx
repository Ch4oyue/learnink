import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, User, Github, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Button as HeroButton } from "@heroui/react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/shared/SEO";
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
  email: z.string().trim().email("Invalid email").max(255, "Email is too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
});

const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Invalid email").max(255, "Email is too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
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
  const navigate = useNavigate();
  const { toast } = useToast();

  // ============================================
  // AUTH LOGIC (Preserved from original)
  // ============================================

  const getErrorMessage = (errorMessage: string): string => {
    if (errorMessage.includes("Invalid login credentials")) {
      return "Incorrect email or password";
    }
    if (errorMessage.includes("User already registered")) {
      return "This email is already registered. Please sign in.";
    }
    if (errorMessage.includes("Email not confirmed")) {
      return "Please confirm your email first";
    }
    if (errorMessage.includes("Too many requests")) {
      return "Too many attempts. Please try again later.";
    }
    return "Something went wrong. Please try again.";
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
        title: "Sign-in failed",
        description: getErrorMessage(error.message),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
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
        title: "Sign up failed",
        description: getErrorMessage(error.message),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sign up successful",
        description: "Please check your email for verification.",
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
        title: "Sign in failed",
        description: getErrorMessage(error.message),
        variant: "destructive",
      });
    }
  };

  // ============================================
  // RENDER - Apple-style single-column auth
  // ============================================

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-secondary/50 dark:bg-background text-foreground font-sans px-4 py-10 transition-colors duration-300">
      <SEO
        title={isLogin ? "Sign In" : "Create Account"}
        description="Sign in to your LearnInk account to continue your tech learning journey."
      />

      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-foreground rounded-[11px] flex items-center justify-center text-background font-mono font-bold text-sm">
          &gt;_
        </div>
        <span className="font-semibold text-lg tracking-tight">LearnInk</span>
      </Link>

      <main className="w-full max-w-[400px] bg-card rounded-[28px] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_24px_64px_-24px_rgba(0,0,0,0.18)] p-8 sm:p-9">
        <h1 className="text-[26px] font-semibold tracking-tight text-center mb-1.5">
          {isLogin ? "Sign in" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {isLogin ? "Welcome back." : "Free forever. No card required."}
        </p>

        {isLogin ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-muted-foreground">Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="username"
                          placeholder="you@example.com"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-[13px] font-medium text-muted-foreground">Password</FormLabel>
                      <button
                        type="button"
                        className="text-[13px] text-primary hover:text-primary/70 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="Your password"
                          className="pl-10 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label htmlFor="remember" className="text-[13px] text-muted-foreground">
                  Remember me for 30 days
                </label>
              </div>

              <HeroButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isDisabled={isLoading}
                className="mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </HeroButton>
            </form>
          </Form>
        ) : (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-muted-foreground">Full name</FormLabel>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
                      <FormControl>
                        <Input
                          type="text"
                          autoComplete="name"
                          placeholder="Your name"
                          className="pl-10"
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
                    <FormLabel className="text-[13px] font-medium text-muted-foreground">Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="username"
                          placeholder="you@example.com"
                          className="pl-10"
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
                    <FormLabel className="text-[13px] font-medium text-muted-foreground">Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="At least 6 characters"
                          className="pl-10 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    <FormLabel className="text-[13px] font-medium text-muted-foreground">Confirm password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Repeat password"
                          className="pl-10 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <HeroButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isDisabled={isLoading}
                className="mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </HeroButton>
            </form>
          </Form>
        )}

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/70" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-card text-muted-foreground">or continue with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSocialLogin('github')}
            className="flex items-center justify-center gap-2.5 text-foreground hover:bg-secondary/70">
            <Github className="h-4 w-4" />
            <span className="text-sm">GitHub</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSocialLogin('google')}
            className="flex items-center justify-center gap-2.5 text-foreground hover:bg-secondary/70">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-sm">Google</span>
          </Button>
        </div>
      </main>

      {/* Toggle */}
      <div className="mt-7 text-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            New to LearnInk?{" "}
            <button
              onClick={() => setIsLogin(false)}
              className="font-medium text-primary hover:text-primary/70 transition-colors">
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => setIsLogin(true)}
              className="font-medium text-primary hover:text-primary/70 transition-colors">
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
