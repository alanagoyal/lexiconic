"use client"

import { Info } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FooterProps {
  isMapView?: boolean;
}

export function Footer({ isMapView = false }: FooterProps) {
  const [open, setOpen] = useState(false);

  return (
    <footer className={`bg-background border-t border-border ${isMapView ? 'fixed bottom-0 left-0 right-0 z-10' : '-mt-px'}`}>
      <div className="p-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair flex items-center justify-center gap-1.5">
          A digital exploration of linguistic untranslatability
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center hover:text-foreground transition-colors">
                <Info className="h-3 w-3" />
              </button>
            </DialogTrigger>
            <DialogContent
              className="bg-black text-primary-foreground max-w-sm"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
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
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </footer>
  );
}
