"use client";

import { useDeviceType } from "@/hooks/use-device-type";

export function Footer() {
  const { isIOS, mounted } = useDeviceType();

  return (
    <footer
      className={`${mounted && !isIOS ? 'fixed bottom-0 left-0 right-0 z-10' : ''} bg-background ${mounted && !isIOS ? 'border-t border-border' : ''}`}
      style={mounted && !isIOS ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
    >
      <div className="p-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair">
          A digital exploration of linguistic untranslatability
        </div>
      </div>
    </footer>
  );
}
