import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GachaCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  onClaim: () => void;
  isClaiming: boolean;
  xpEarned: number | null;
}

export function GachaCompletionModal({
  isOpen,
  onClose,
  moduleTitle,
  onClaim,
  isClaiming,
  xpEarned
}: GachaCompletionModalProps) {

  // Handling state "claim success" vs "initial open"
  const isSuccess = xpEarned !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isClaiming) onClose();
    }}>
      <DialogContent className="sm:max-w-md bg-card border-border text-center shadow-lg">
        <DialogHeader>
          <div className={cn(
            "mx-auto p-4 rounded-full mb-4 animate-bounce",
            isSuccess ? "bg-primary/20" : "bg-yellow-500/20"
          )}>
            <Trophy className={cn(
              "h-10 w-10",
              isSuccess ? "text-primary" : "text-yellow-500"
            )} />
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-foreground">
            {isSuccess ? "Reward Claimed!" : "Module Completed!"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {isSuccess
              ? `You've earned XP for completing "${moduleTitle}".`
              : `You've successfully finished "${moduleTitle}". Claim your reward now!`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          {isSuccess ? (
            <>
              <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">XP Gained</div>
              <div className="text-5xl font-black text-foreground flex items-center gap-2 animate-in zoom-in duration-300">
                <Sparkles className="h-8 w-8 text-yellow-400 animate-spin-slow" />
                {xpEarned} XP
              </div>
            </>
          ) : (
             <div className="p-4 bg-muted/50 rounded-xl w-full">
               <p className="text-sm text-muted-foreground">
                 Click below to roll for your XP reward (50 - 150 XP)
               </p>
             </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center flex-col gap-2 sm:gap-0">
          {!isSuccess ? (
            <Button
              onClick={onClaim}
              disabled={isClaiming}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-lg shadow-md transition-all active:scale-95"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Claiming...
                </>
              ) : (
                "Claim Reward"
              )}
            </Button>
          ) : (
             <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
