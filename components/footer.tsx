"use client";

import { Info } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FooterProps {
  isMapView?: boolean;
}

export function Footer({ isMapView = false }: FooterProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device supports touch
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const infoContent = (
    <p className="text-xs leading-relaxed">
      Please note that definitions, pronunciations, and other metadata were generated using openai (gpt-5 and gpt-4o-mini-tts) and may not be fully accurate or precisely translated. To suggest edits or improvements, please{" "}
      <a
        href="mailto:hi@basecase.vc"
        className="underline-offset-4 hover:underline"
      >
        reach out
      </a>
      {" "}or{" "}
      <a
        href="https://github.com/alanagoyal/lexiconic/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-4 hover:underline"
      >
        submit a pull request
      </a>
      .
    </p>
  );

  return (
    <footer className={`bg-background border-t border-border ${isMapView ? 'fixed bottom-0 left-0 right-0 z-10' : '-mt-px'}`}>
      <div className="p-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair flex items-center justify-center gap-1.5">
          A digital exploration of linguistic untranslatability
          {isTouchDevice ? (
            <Dialog>
              <DialogTrigger asChild>
                <button className="inline-flex items-center hover:text-foreground transition-colors">
                  <Info className="h-3 w-3" />
                </button>
              </DialogTrigger>
              <DialogContent
                className="max-w-sm"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DialogDescription className="text-left">
                  {infoContent}
                </DialogDescription>
              </DialogContent>
            </Dialog>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex items-center hover:text-foreground transition-colors">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-black text-primary-foreground max-w-sm text-left px-4 py-3"
                sideOffset={5}
              >
                {infoContent}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </footer>
  );
}
