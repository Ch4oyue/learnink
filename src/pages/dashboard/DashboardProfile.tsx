import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePWA } from "@/contexts/PWAContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useLearningStats } from "@/hooks/useLearningStats";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { enUS as localeId } from "date-fns/locale";
import { PremiumStore } from "@/components/features/premium/PremiumStore";
import {
  ArrowLeft,
  Camera,
  Edit,
  CheckCircle,
  Smartphone,
  Users,
  CheckCircle2,
  Download,
  Flame,
  Brain,
  ChevronRight,
  Loader2,
  Save,
  BookOpen,
  Clock,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Construction,
  Sparkles,
  StickyNote,
  Crown,
  History,
} from "lucide-react";

// ============================================
// CONSTANTS
// ============================================

const roleLabels: Record<string, string> = {
  user: "Student",
  tutor: "Tutor",
  admin: "Administrator",
  superadmin: "Super Admin",
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardProfile() {
  const navigate = useNavigate();
  const { user, role, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isInstalled, deferredPrompt, installApp } = usePWA();
  const { toast } = useToast();
  const { data: progress } = useUserProgress(user?.id);
  const { data: stats, isLoading: statsLoading } = useLearningStats(user?.id);

  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || ""
  );

  // Mobile Transparency State
  const [transparentMobile, setTransparentMobile] = useState(() => {
    return localStorage.getItem("transparentMobileNav") === "true";
  });

  // Apply transparent mode class on mount and change
  useEffect(() => {
    if (transparentMobile) {
      document.documentElement.classList.add("transparent-mode");
    } else {
      document.documentElement.classList.remove("transparent-mode");
    }
  }, [transparentMobile]);

  const toggleTransparentMobile = () => {
    const newValue = !transparentMobile;
    setTransparentMobile(newValue);
    localStorage.setItem("transparentMobileNav", String(newValue));
    // Trigger storage event for other components to pick up
    window.dispatchEvent(new Event("storage"));
  };
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // URL-based tab persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const completedModules = progress?.filter((p) => p.is_completed).length || 0;
  const totalModules = progress?.length || 0;

  // Calculate streak from stats
  const streak = stats?.currentStreak || 0;

  // Get user initials
  const userName = profile?.display_name || displayName || user?.email?.split("@")[0] || "User";
  const userInitials = userName.slice(0, 2).toUpperCase();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });

      if (error) throw error;

      // Also update the profiles table
      await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
    } catch (error: unknown) {
      logger.error("Update profile error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const { data: analytics } = useAnalytics(user?.id);
  const week = (analytics?.activity ?? []).slice(-7).map((d) => {
    const total = d.completions + d.quizAttempts;
    return { key: d.day, label: new Date(d.day + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }), total };
  });
  const weekMax = Math.max(1, ...week.map((d) => d.total));
  const weekTotal = week.reduce((n, d) => n + d.total, 0);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Tab Navigation */}
        <div className="border-b border-border">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {["profile", "premium", "notes", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-4 text-sm font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab === "notes" ? "My Notes" : tab === "settings" ? "Settings" : tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Tab Content */}
        {activeTab === "profile" && (
          <>
            {/* Glass Hero Profile Header */}
            <div className="relative rounded-3xl overflow-hidden border shadow-2xl">
              {/* Background Gradient Blob */}

              <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Glass Avatar Container */}
                <div className="relative group shrink-0">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Avatar
                    isPremium={profile?.is_premium}
                    className="h-40 w-40 border-4 shadow-xl ring-4 ring-white/20 dark:ring-black/20 backdrop-blur-md"
                  >
                    <AvatarImage src={profile?.avatar_url || undefined} alt={userName} className="object-cover" />
                    <AvatarFallback className="text-5xl font-extrabold bg-primary/10 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Glass Streak Badge */}
                  <div
                    className="absolute -bottom-2 -right-2 flex flex-col items-center justify-center p-3 rounded-2xl bg-white/80 dark:bg-black/60 backdrop-blur-md border shadow-lg z-20 transition-transform hover:scale-105"
                    title={`${streak}-Day Streak!`}
                  >
                    <Flame className="h-6 w-6 text-orange-500 fill-orange-500 animate-pulse-slow" />
                    <span className="text-xs font-bold text-foreground mt-1">
                      {streak} Days
                    </span>
                  </div>

                  {/* Glass Camera Button */}
                  <button
                    className="absolute top-2 right-2 h-10 w-10 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all border shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                    aria-label="Change Avatar"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                      {userName}
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                      {role === 'superadmin' ? (
                        <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">
                          <Crown className="h-3 w-3 mr-1" /> Super Admin
                        </Badge>
                      ) : role ? (
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3 mr-1" /> {roleLabels[role] || "Member"}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                    <Button onClick={() => setIsEditing(true)} className="h-12 px-8 rounded-2xl shadow-lg hover:shadow-primary/20">
                      <Edit className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                    <Button variant="ghost" onClick={handleSignOut} className="h-12 px-6 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive-text transition-colors">
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Activity Card - Hidden during edit mode for focus */}
            {!isEditing && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Learning Activity</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Modules completed and quizzes taken, last 7 days
                    </p>
                  </div>
                  </CardHeader>
                <CardContent>
                  {/* Activity Chart: real completions + quiz attempts per day */}
                  {weekTotal === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">No activity in the last 7 days.</p>
                  ) : (
                    <div className="w-full h-48 flex items-end justify-between gap-2 sm:gap-4 mt-4" role="img" aria-label={`${weekTotal} learning events in the last 7 days`}>
                      {week.map((item, i) => {
                        const isToday = i === week.length - 1;
                        return (
                          <div key={item.key} className="group flex flex-col items-center gap-2 flex-1">
                            <div className="relative w-full bg-muted rounded-t-lg h-32 flex items-end overflow-hidden">
                              <div
                                className={`w-full rounded-t-lg ${isToday ? "bg-primary" : "bg-primary/40"}`}
                                style={{ height: `${item.total === 0 ? 0 : Math.max(8, (item.total / weekMax) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[13px] tabular-nums text-muted-foreground">{item.total}</span>
                            <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Stats Footer */}
                  <div className="mt-6 pt-6 border-t border-border flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Modules Completed
                        </span>
                        <div className="text-xl font-bold">
                          {statsLoading ? "..." : stats?.completedModules || 0}
                          <span className="text-sm font-normal text-muted-foreground"> / {stats?.totalModulesStarted || 0}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Avg. Quiz Score
                        </span>
                        <div className="text-xl font-bold">
                          {statsLoading ? "..." : `${stats?.averageQuizScore || 0}%`}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Notes
                        </span>
                        <div className="text-xl font-bold">
                          {statsLoading ? "..." : stats?.totalNotes || 0}
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/dashboard/analytics"
                      className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 group"
                    >
                      View Detailed Analytics
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Profile Card - Shown when editing */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Full Name
                        </label>
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Email Address
                        </label>
                        <Input
                          value={user?.email || ""}
                          type="email"
                          disabled
                          className="rounded-lg bg-muted"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Two Column Layout - Hidden during edit mode for focus */}
            {!isEditing && (
              <div className="grid grid-cols-1 gap-8">
                {/* Personal Information */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Full Name
                              </label>
                              <Input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                                className="rounded-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Email Address
                              </label>
                              <Input
                                value={user?.email || ""}
                                disabled
                                className="rounded-lg bg-muted"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={isUpdating}>
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              Save Changes
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsEditing(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Full Name
                            </label>
                            <div className="p-3 bg-muted rounded-lg text-foreground text-sm font-medium border border-border">
                              {userName}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Email Address
                            </label>
                            <div className="p-3 bg-muted rounded-lg text-foreground text-sm font-medium border border-border flex items-center justify-between">
                              {user?.email}
                              <CheckCircle className="h-4 w-4 text-green-500" aria-label="Verified" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Role
                            </label>
                            <div className="p-3 bg-muted rounded-lg text-foreground text-sm font-medium border border-border">
                              {role ? roleLabels[role] : "Member"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Member Since
                            </label>
                            <div className="p-3 bg-muted rounded-lg text-foreground text-sm font-medium border border-border">
                              {user?.created_at
                                ? format(new Date(user.created_at), "dd MMMM yyyy", { locale: localeId })
                                : "-"}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}

        {/* Premium Tab Content */}
        {activeTab === "premium" && (
          <PremiumStore />
        )}

        {/* My Notes Tab - Redirect to Second Brain */}
        {activeTab === "notes" && (
          <Card className="py-16">
            <CardContent>
              <div className="text-center space-y-6">
                {/* Icon */}
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                  <div className="relative flex items-center justify-center h-full">
                    <StickyNote className="h-12 w-12 text-primary" />
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Second Brain
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    You have <span className="font-bold text-foreground">{stats?.totalNotes || 0}</span> notes from your learning.
                  </p>
                </div>

                {/* CTA Button */}
                <Link to="/dashboard/second-brain">
                  <Button size="lg" className="mt-4 gap-2">
                    <Brain className="h-5 w-5" />
                    Open Second Brain
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Tab Content */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how LearnInk looks on your device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: "light" as const, label: "Light", icon: Sun, description: "Light background" },
                    { value: "dark" as const, label: "Dark", icon: Moon, description: "Dark background" },
                    { value: "system" as const, label: "System", icon: Monitor, description: "Match device" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${theme === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                    >
                      <option.icon
                        className={`h-8 w-8 ${theme === option.value ? "text-primary" : "text-muted-foreground"
                          }`}
                      />
                      <div className="text-center">
                        <span
                          className={`text-sm font-medium block ${theme === option.value ? "text-primary" : "text-foreground"
                            }`}
                        >
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {option.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mobile Preferences */}
            <Card className="md:hidden">
              <CardHeader>
                <CardTitle>Mobile Preferences</CardTitle>
                <CardDescription>Adjust settings for mobile experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Transparent Mode</p>
                      <p className="text-sm text-muted-foreground">Enable iOS-style glassmorphism effect</p>
                    </div>
                  </div>
                  <Button
                    variant={transparentMobile ? "default" : "outline"}
                    onClick={toggleTransparentMobile}
                  >
                    {transparentMobile ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Install App */}
            <Card>
              <CardHeader>
                <CardTitle>Install Application</CardTitle>
                <CardDescription>Install LearnInk for a better experience</CardDescription>
              </CardHeader>
              <CardContent>
                {isInstalled ? (
                  <Button disabled variant="outline" className="w-full gap-2 justify-start h-auto py-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-foreground">App Installed</span>
                      <span className="text-xs font-normal">You are using the app version</span>
                    </div>
                  </Button>
                ) : deferredPrompt ? (
                  <Button onClick={installApp} className="w-full gap-2 justify-start h-auto py-3">
                    <Download className="h-5 w-5" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Install App</span>
                      <span className="text-xs font-normal opacity-90">Add to Home Screen</span>
                    </div>
                  </Button>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 border border-dashed text-center">
                    <p className="text-sm text-muted-foreground">
                      Use your browser's menu to <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Changelog & Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Changelog & Updates
                </CardTitle>
                <CardDescription>
                  View version history and recent updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/changelog">
                  <Button variant="outline" className="w-full gap-2 justify-start h-auto py-3 hover:bg-muted/50">
                    <Clock className="h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium text-foreground">View Changelog</span>
                      <span className="text-xs font-normal text-muted-foreground">View app update history</span>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                  {[
                    { name: "Stitch", url: "https://stitch.withgoogle.com/", image: "/assets/contributors/stitch.png", initial: "S", color: "bg-pink-500" },
                    { name: "Bolt", url: "https://bolt.new/", image: "/assets/contributors/bolt.png", initial: "B", color: "bg-red-500" },
                    { name: "Lovable", url: "https://lovable.dev/", image: "/assets/contributors/lovable.png", initial: "L", color: "bg-purple-500" },
                    { name: "Antigravity", url: "https://antigravity.google/", image: "/assets/contributors/antigravity.png", initial: "A", color: "bg-blue-500" },
                    { name: "Jules", url: "https://jules.google.com/", image: "/assets/contributors/jules.png", initial: "J", color: "bg-indigo-500" },
                    { name: "Claude", url: "https://claude.ai/", image: "/assets/contributors/claude.png", initial: "C", color: "bg-orange-500" },
                    { name: "Gemini", url: "https://gemini.google.com/", image: "/assets/contributors/gemini.png", initial: "G", color: "bg-blue-600" },
                    { name: "Manus", url: "https://manus.im/", image: "/assets/contributors/manus-ai.png", initial: "M", color: "bg-red-500" },
                    { name: "Abelion", url: "https://lynk.id/abelion/", image: "https://ik.imagekit.io/focustimerin/preview%20image1?updatedAt=1757343104763", initial: "A", color: "bg-red-500" },
                  ].map((contrib) => (
                    <a
                      key={contrib.name}
                      href={contrib.url || "#"}
                      target={contrib.url ? "_blank" : undefined}
                      rel={contrib.url ? "noopener noreferrer" : undefined}
                      className={`flex flex-col items-center gap-2 group ${!contrib.url && "cursor-default"}`}
                    >
                      <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-background shadow-sm group-hover:scale-110 transition-transform duration-200 group-hover:shadow-md">
                          <AvatarImage src={contrib.image} alt={contrib.name} className="object-cover" />
                          <AvatarFallback className={`${contrib.color} text-white font-bold`}>
                            {contrib.initial}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-xs font-medium text-center max-w-[80px] leading-tight group-hover:text-primary transition-colors">
                        {contrib.name}
                      </span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

