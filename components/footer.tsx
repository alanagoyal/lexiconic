import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FooterProps {
  isMapView?: boolean;
}

export function Footer({ isMapView = false }: FooterProps) {
  return (
    <footer className={`bg-background border-t border-border ${isMapView ? 'fixed bottom-0 left-0 right-0 z-10' : '-mt-px'}`}>
      <div className="p-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair flex items-center justify-center gap-1.5">
          A digital exploration of linguistic untranslatability
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex items-center hover:text-foreground transition-colors">
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-black text-primary-foreground max-w-sm text-left"
              sideOffset={5}
            >
              <p className="text-xs leading-relaxed">
                Please note that definitions, pronunciations, and other metadata were generated using openai (gpt-5 and gpt-4o-mini-tts) and may not be fully accurate or precisely translated. To suggest edits or improvements, please{" "}
                <a
                  href="mailto:hi@basecase.vc"
                  className="underline-offset-4 hover:underline"
                >
                  reach out
                </a>
                {" "}or submit a pull request.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </footer>
  );
}
