import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Crown,
  Sparkles,
  Zap,
  Flame,
  Coins,
  Check,
  Loader2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";

const PREMIUM_OFFERS = [
  { id: "7_days", label: "7 Days Premium", cost: 500, days: 7, icon: Zap },
  { id: "30_days", label: "30 Days Premium", cost: 1500, days: 30, icon: Crown, popular: true },
  { id: "streak_claim", label: "Streak Reward (30 Days)", cost: 0, streakRequired: 30, days: 14, icon: Flame },
];

export function PremiumStore() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const buyPremium = useMutation({
    mutationFn: async ({ days, cost, isStreakClaim }: { days: number; cost: number; isStreakClaim: boolean }) => {
      if (!user || !profile) throw new Error("Unauthorized");

      // Validations
      if (!isStreakClaim && (profile.points || 0) < cost) {
        throw new Error("Not enough points");
      }
      if (isStreakClaim && (profile.current_streak || 0) < 30) {
        throw new Error("Streak has not reached 30 days");
      }

      const currentPremiumUntil = profile.premium_until ? new Date(profile.premium_until) : new Date();
      const baseDate = currentPremiumUntil > new Date() ? currentPremiumUntil : new Date();
      const newPremiumUntil = addDays(baseDate, days).toISOString();

      const updateData: { is_premium: boolean; premium_until: string; points?: number } = {
        is_premium: true,
        premium_until: newPremiumUntil,
      };

      if (!isStreakClaim) {
        updateData.points = (profile.points || 0) - cost;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;
      return { newPremiumUntil };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-role"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Aktivasi Berhasil! 👑",
        description: `Premium status active until ${format(new Date(data.newPremiumUntil), "dd MMM yyyy")}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Aktivasi",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setIsProcessing(null)
  });

  const handleExchange = (offer: typeof PREMIUM_OFFERS[0]) => {
    setIsProcessing(offer.id);
    buyPremium.mutate({
      days: offer.days,
      cost: offer.cost,
      isStreakClaim: !!offer.streakRequired
    });
  };

  const isPremiumActive = profile?.is_premium && profile?.premium_until && new Date(profile.premium_until) > new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            LearnInk Elite
          </h2>
          <p className="text-muted-foreground">Redeem points or streaks for exclusive feature access.</p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="text-lg px-3 py-1 gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            {profile?.points || 0} Points
          </Badge>
        </div>
      </div>

      {isPremiumActive && (
        <div className="p-4 glass-liquid border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Crown className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-amber-500">Premium Status Active</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Berakhir pada {format(new Date(profile!.premium_until!), "dd MMM yyyy")}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500/50 text-amber-500">ELITE MEMBER</Badge>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PREMIUM_OFFERS.map((offer) => {
          const isStreak = !!offer.streakRequired;
          const canAfford = isStreak
            ? (profile?.current_streak || 0) >= offer.streakRequired!
            : (profile?.points || 0) >= offer.cost;

          return (
            <Card key={offer.id} className={cn(
              "glass-liquid transition-all duration-300 relative overflow-hidden",
              offer.popular && "border-primary shadow-glow scale-105 z-10"
            )}>
              {offer.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[13px] font-bold px-2 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
                  <offer.icon className={cn("h-6 w-6", isStreak ? "text-orange-500" : "text-primary")} />
                </div>
                <CardTitle>{offer.label}</CardTitle>
                <CardDescription>
                  {isStreak ? `Syarat: ${offer.streakRequired} Hari Streak` : `${offer.cost} InkPoints`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Multiplier XP 1.5x</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Elite Badge on Profile</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Ad-Free (Coming Soon)</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full rounded-xl"
                  variant={canAfford ? "default" : "outline"}
                  disabled={!canAfford || isProcessing === offer.id}
                  onClick={() => handleExchange(offer)}
                >
                  {isProcessing === offer.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    canAfford ? "Tukarkan" : isStreak ? "Streak Belum Cukup" : "Poin Belum Cukup"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Elite Benefits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="p-4 rounded-2xl bg-white/5 flex gap-4">
             <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
               <Zap className="h-5 w-5 text-primary" />
             </div>
             <div>
               <p className="font-bold text-sm">Turbo Learning</p>
               <p className="text-xs text-muted-foreground">Earn XP faster with the premium multiplier.</p>
             </div>
           </div>
           <div className="p-4 rounded-2xl bg-white/5 flex gap-4">
             <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center">
               <Crown className="h-5 w-5 text-amber-500" />
             </div>
             <div>
               <p className="font-bold text-sm">Exclusive Badge</p>
               <p className="text-xs text-muted-foreground">Show off your status with a crown icon and VFX.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
