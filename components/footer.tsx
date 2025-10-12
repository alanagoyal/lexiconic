import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FooterProps {
  isMapView?: boolean;
}

export function Footer({ isMapView = false }: FooterProps) {
  return (
    <footer className={`bg-background border-t border-border ${isMapView ? 'fixed bottom-0 left-0 right-0 z-10' : '-mt-px'}`}>
      <div className="p-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair">
          A digital exploration of linguistic untranslatability
        </div>
        <div className="mt-3 flex items-center justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-left">
                <p>
                  Definitions and metadata for these words were generated from language models (OpenAI GPT-5) and may not be completely accurate. Voice pronunciations were generated from OpenAI language models (Text-to-Speech) and may not be completely accurate. If you have questions or would like to submit an edit or modification, don't hesitate to reach out or submit a pull request.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </footer>
  );
}
