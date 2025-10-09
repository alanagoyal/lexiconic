export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-10" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="p-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair">
          A digital exploration of linguistic untranslatability
        </div>
      </div>
    </footer>
  );
}
