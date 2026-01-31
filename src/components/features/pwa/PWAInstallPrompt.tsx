import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Share, PlusSquare, Download } from "lucide-react";
import { usePWA } from "@/contexts/PWAContext";

export function PWAInstallPrompt() {
  const { deferredPrompt, isInstalled, isIOS, installApp } = usePWA();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isInstalled) return;

    // Check if dismissed
    const isDismissed = localStorage.getItem("pwa_prompt_dismissed");
    if (isDismissed) return;

    if (isIOS) {
       // Only show on iOS if not installed (standalone check is in context)
       // Delay to ensure hydration/loading
       const timer = setTimeout(() => setIsOpen(true), 2000);
       return () => clearTimeout(timer);
    } else if (deferredPrompt) {
       setIsOpen(true);
    }
  }, [deferredPrompt, isIOS, isInstalled]);

  const handleInstall = async () => {
    await installApp();
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => {
        // Only allow closing if we handle state properly
        setIsOpen(open);
    }}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Install Aplikasi LearnAI</DrawerTitle>
            <DrawerDescription>
              Tambahkan ke Home Screen untuk pengalaman full screen yang lebih baik.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            {isIOS ? (
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md"><Share className="h-5 w-5" /></div>
                  <p>1. Tap tombol <strong>Share</strong> di menu bawah browser.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md"><PlusSquare className="h-5 w-5" /></div>
                  <p>2. Pilih <strong>Add to Home Screen</strong>.</p>
                </div>
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center py-4">
                  <img src="/icon-192.png" alt="Icon" className="w-16 h-16 rounded-xl mb-4 shadow-lg" />
                  <p className="text-center text-muted-foreground">Aplikasi akan diinstall di perangkat Anda.</p>
               </div>
            )}
          </div>
          <DrawerFooter>
            {!isIOS && (
              <Button onClick={handleInstall} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Install Sekarang
              </Button>
            )}
            <Button variant="outline" onClick={handleDismiss}>
              Nanti Saja
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
