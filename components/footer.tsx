"use client";

import { useDeviceType } from "@/hooks/use-device-type";

export function Footer() {
  const { isIOS, isMobile, isLoading } = useDeviceType();

  // Don't apply sticky footer on mobile devices
  const shouldBeFixed = !isLoading && !isMobile && !isIOS;

  return (
    <footer
      className={`${shouldBeFixed ? 'fixed bottom-0 left-0 right-0 z-10' : ''} bg-background ${shouldBeFixed ? 'border-t border-border' : ''}`}
      style={shouldBeFixed ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
    >
      <div className="p-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair">
          A digital exploration of linguistic untranslatability
        </div>
      </div>
    </footer>
  );
}
