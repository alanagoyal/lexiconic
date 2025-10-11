interface FooterProps {
  isMapView?: boolean;
}

export function Footer({ isMapView = false }: FooterProps) {
  return (
    <footer className={`bg-background border-t border-border ${isMapView ? 'fixed bottom-0 left-0 right-0 z-10' : ''}`}>
      <div className="p-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair">
          A digital exploration of linguistic untranslatability
        </div>
      </div>
    </footer>
  );
}
