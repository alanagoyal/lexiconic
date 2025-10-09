export function Footer() {
  return (
    <footer
      className="fixed left-0 right-0 bg-background border-t border-border z-10"
      style={{
        bottom: 'calc(-1 * env(safe-area-inset-bottom))',
        paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
      }}
    >
      <div className="px-6 pt-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair">
          A digital exploration of linguistic untranslatability
        </div>
      </div>
    </footer>
  );
}
