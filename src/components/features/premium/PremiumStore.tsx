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
  Coins,
  Loader2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const PREMIUM_OFFERS = [
  { id: "7_days", label: "7 Days Premium", cost: 500, days: 7 },
  { id: "30_days", label: "30 Days Premium", cost: 1500, days: 30, popular: true },
  { id: "streak_claim", label: "Streak Reward (30 Days)", cost: 0, streakRequired: 30, days: 14 },
];

export function PremiumStore() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const buyPremium = useMutation({
    mutationFn: async ({ offerId, cost, isStreakClaim }: { offerId: string; cost: number; isStreakClaim: boolean }) => {
      if (!user || !profile) throw new Error("Unauthorized");

      // Quick client-side checks for a clear message; the server repeats them and is the source of truth.
      if (!isStreakClaim && (profile.points || 0) < cost) {
        throw new Error("Not enough points");
      }
      if (isStreakClaim && (profile.current_streak || 0) < 30) {
        throw new Error("Streak has not reached 30 days");
      }

      // Points, premium and streak are protected columns: redeem through the server function.
      const { data, error } = await supabase.rpc("redeem_premium", { p_offer_id: offerId });
      if (error) throw error;
      return { newPremiumUntil: String(data) };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-role"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Activation successful! 👑",
        description: `Premium status active until ${format(new Date(data.newPremiumUntil), "dd MMM yyyy")}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Activation failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setIsProcessing(null)
  });

  const handleExchange = (offer: typeof PREMIUM_OFFERS[0]) => {
    setIsProcessing(offer.id);
    buyPremium.mutate({
      offerId: offer.id,
      cost: offer.cost,
      isStreakClaim: !!offer.streakRequired
    });
  };

  const isPremiumActive = profile?.is_premium && profile?.premium_until && new Date(profile.premium_until) > new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            LearnInk Elite
          </h2>
          <p className="text-muted-foreground">1.5x XP and an Elite badge on your profile, for as long as it lasts.</p>
        </div>
        <div className="text-left sm:shrink-0 sm:text-right">
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
                Expires on {format(new Date(profile!.premium_until!), "dd MMM yyyy")}
              </p>
            </div>
          </div>
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
              offer.popular && "border-primary"
            )}>
              <CardHeader>
                <CardTitle>{offer.label}</CardTitle>
                <CardDescription>
                  {isStreak ? `Requires a ${offer.streakRequired}-Day Streak` : `${offer.cost} InkPoints`}
                </CardDescription>
              </CardHeader>
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
                    canAfford ? "Redeem" : isStreak ? "Streak too low" : "Not enough points"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
