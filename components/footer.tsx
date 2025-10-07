export function Footer() {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 border-t border-border z-50"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="p-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair">
          A digital exploration of linguistic untranslatability
        </div>
      </div>
    </footer>
  );
}
