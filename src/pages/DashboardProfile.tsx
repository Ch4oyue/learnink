import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  Camera,
  Edit,
  CheckCircle,
  MapPin,
  Flame,
  Trophy,
  Brain,
  Lock,
  ChevronRight,
  Loader2,
  Save,
  BookOpen,
  Clock,
  LogOut,
} from "lucide-react";

// ============================================
// CONSTANTS
// ============================================

const roleLabels: Record<string, string> = {
  user: "Student",
  tutor: "Tutor",
  admin: "Administrator",
};

// Dummy activity data for the chart
const activityData = [
  { day: "Mon", minutes: 45, height: 40 },
  { day: "Tue", minutes: 70, height: 65 },
  { day: "Wed", minutes: 30, height: 30 },
  { day: "Thu", minutes: 105, height: 85 },
  { day: "Fri", minutes: 130, height: 95, isToday: true },
  { day: "Sat", minutes: 55, height: 50 },
  { day: "Sun", minutes: 15, height: 20 },
];

const achievements = [
  {
    id: 1,
    title: "Fast Learner",
    description: "Completed 5 lessons in one day",
    icon: Trophy,
    bgColor: "from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30",
    borderColor: "border-yellow-200 dark:border-yellow-800/50",
    iconColor: "text-yellow-600 dark:text-yellow-500",
    unlocked: true,
  },
  {
    id: 2,
    title: "Deep Focus",
    description: "2 hours of uninterrupted study",
    icon: Brain,
    bgColor: "from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30",
    borderColor: "border-blue-200 dark:border-blue-800/50",
    iconColor: "text-blue-600 dark:text-blue-500",
    unlocked: true,
  },
  {
    id: 3,
    title: "Note Master",
    description: "Create 50 notes (18/50)",
    icon: Lock,
    bgColor: "",
    borderColor: "border-border",
    iconColor: "text-muted-foreground",
    unlocked: false,
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardProfile() {
  const navigate = useNavigate();
  const { user, role, profile, signOut } = useAuth();
  const { toast } = useToast();
  const { data: progress } = useUserProgress(user?.id);

  const [displayName, setDisplayName] = useState(
    profile?.full_name || user?.user_metadata?.display_name || ""
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const completedModules = progress?.filter((p) => p.is_completed).length || 0;
  const totalModules = progress?.length || 0;

  // Calculate streak (dummy for now)
  const streak = 7;

  // Get user initials
  const userName = profile?.full_name || displayName || user?.email?.split("@")[0] || "User";
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
        .update({ full_name: displayName })
        .eq("id", user.id);

      toast({
        title: "Sukses",
        description: "Profil berhasil diperbarui",
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui profil",
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

  const formatMinutes = (mins: number) => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      return `${hours}h ${minutes}m`;
    }
    return `${mins} mins`;
  };

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
            {["profile", "notes", "billing", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-4 text-sm font-medium transition-colors capitalize ${activeTab === tab
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab === "notes" ? "My Notes" : tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Header Card */}
        <Card className="relative overflow-hidden">
          {/* Decorative blur */}
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

          <CardContent className="p-6 sm:p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 w-full md:w-auto">
                {/* Avatar with streak badge */}
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
                    <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Streak Badge */}
                  <div
                    className="absolute -top-2 -right-2 flex flex-col items-center justify-center h-14 w-14 rounded-full bg-orange-50 dark:bg-orange-900/40 border-2 border-background shadow-md z-20"
                    title={`${streak}-Day Streak!`}
                  >
                    <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 leading-none -mt-0.5">
                      {streak}
                    </span>
                  </div>

                  {/* Change Avatar Button */}
                  <button
                    className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-card shadow-md flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border border-border z-10"
                    aria-label="Change Avatar"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                {/* User Info */}
                <div className="text-center sm:text-left pt-2">
                  <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
                    {userName}
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                    {profile?.bio || "Lifelong learner exploring new skills."}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                    {role && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {roleLabels[role] || "Member"}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {profile?.location || "Earth"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/25"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="px-6 py-3 rounded-xl font-bold text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Activity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Learning Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Your daily progress over the last week
              </p>
            </div>
            <div className="hidden sm:flex bg-muted p-1 rounded-lg">
              <button className="px-3 py-1 text-xs font-bold text-primary bg-card shadow-sm rounded-md">
                Weekly
              </button>
              <button className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Monthly
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Activity Chart */}
            <div className="w-full h-48 flex items-end justify-between gap-2 sm:gap-4 mt-4">
              {activityData.map((item) => (
                <div key={item.day} className="group flex flex-col items-center gap-2 flex-1 cursor-pointer">
                  <div className="relative w-full bg-muted rounded-t-lg h-32 flex items-end overflow-hidden">
                    <div
                      className={`w-full transition-all rounded-t-lg relative ${item.isToday
                        ? "bg-primary hover:bg-primary/90 shadow-glow"
                        : "bg-primary/40 group-hover:bg-primary/60"
                        }`}
                      style={{ height: `${item.height}%` }}
                    >
                      <div
                        className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] py-1 px-2 rounded transition-opacity whitespace-nowrap z-10 ${item.isToday ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                      >
                        {formatMinutes(item.minutes)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium ${item.isToday ? "text-primary font-bold" : "text-muted-foreground"
                      }`}
                  >
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats Footer */}
            <div className="mt-6 pt-6 border-t border-border flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Total XP
                  </span>
                  <div className="text-xl font-bold">12,450</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Avg. Time
                  </span>
                  <div className="text-xl font-bold">
                    48m <span className="text-sm font-normal text-muted-foreground">/ day</span>
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

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-2">
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
                        <CheckCircle className="h-4 w-4 text-green-500" title="Verified" />
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

          {/* Achievements */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Achievements</CardTitle>
                <Link to="/dashboard/achievements" className="text-xs font-bold text-primary hover:text-primary/80">
                  View All
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${!achievement.unlocked ? "opacity-60 grayscale" : ""
                        }`}
                    >
                      <div
                        className={`h-12 w-12 rounded-full bg-gradient-to-br ${achievement.bgColor || "bg-muted"} flex items-center justify-center shrink-0 border ${achievement.borderColor}`}
                      >
                        <achievement.icon className={`h-5 w-5 ${achievement.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{achievement.title}</h3>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalModules}</p>
                <p className="text-xs text-muted-foreground">Modules Started</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedModules}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">48m</p>
                <p className="text-xs text-muted-foreground">Avg. Daily</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
