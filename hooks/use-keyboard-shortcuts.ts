import { useEffect } from "react";

export type KeyboardShortcut = {
  key: string;
  handler: () => void;
  description: string;
  allowInInput?: boolean;
};

/**
 * Custom hook for managing keyboard shortcuts
 * @param shortcuts - Array of keyboard shortcut configurations
 * @param enabled - Whether shortcuts are currently active (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      // Ignore if modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      const pressedKey = event.key.toLowerCase();
      const shortcut = shortcuts.find((s) => s.key.toLowerCase() === pressedKey);

      if (shortcut) {
        // Allow shortcut if allowInInput is true, or if not in an input
        if (shortcut.allowInInput || !isInInput) {
          event.preventDefault();
          shortcut.handler();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [shortcuts, enabled]);
}
