'use client';

import { useEffect, useRef } from 'react';

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Fix for iOS Safari dynamic viewport height issue
    const updateFooterPosition = () => {
      if (!footerRef.current) return;

      // Use visualViewport if available (iOS Safari)
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const offsetTop = window.visualViewport.offsetTop;
        footerRef.current.style.transform = `translateY(${offsetTop}px)`;
        footerRef.current.style.height = `calc(${footerRef.current.scrollHeight}px + env(safe-area-inset-bottom))`;
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateFooterPosition);
      window.visualViewport.addEventListener('scroll', updateFooterPosition);
      updateFooterPosition();

      return () => {
        window.visualViewport?.removeEventListener('resize', updateFooterPosition);
        window.visualViewport?.removeEventListener('scroll', updateFooterPosition);
      };
    }
  }, []);

  return (
    <footer
      ref={footerRef}
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="p-6 text-center">
        <div className="text-xs text-muted-foreground uppercase letter-spacing-wide font-playfair">
          A digital exploration of linguistic untranslatability
        </div>
      </div>
    </footer>
  );
}
