import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Trophy, Sparkles } from "lucide-react";

interface GachaCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
}

export function GachaCompletionModal({ isOpen, onClose, moduleTitle }: GachaCompletionModalProps) {
  const [displayXp, setDisplayXp] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Random XP between 50 and 150
      const rolledXp = Math.floor(Math.random() * 101) + 50;

      // Save to local storage (Simulation)
      const currentXp = parseInt(localStorage.getItem("user_xp") || "0");
      localStorage.setItem("user_xp", (currentXp + rolledXp).toString());

      // Animate number
      let current = 0;
      const interval = setInterval(() => {
        current += Math.ceil(rolledXp / 20);
        if (current >= rolledXp) {
          current = rolledXp;
          clearInterval(interval);
        }
        setDisplayXp(current);
      }, 50);

      return () => clearInterval(interval);
    } else {
      setDisplayXp(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-center">
        <DialogHeader>
          <div className="mx-auto bg-yellow-500/20 p-4 rounded-full mb-4 animate-bounce">
            <Trophy className="h-10 w-10 text-yellow-500" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-white">Module Completed!</DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            You've successfully finished "{moduleTitle}".
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <div className="text-zinc-500 text-sm font-medium uppercase tracking-wider">XP Gained</div>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-400 animate-spin" />
            {displayXp} XP
          </div>
          <div className="text-xs text-zinc-600 italic">
            (Luck based reward: 50 - 150 XP)
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold">
            Claim Reward
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
