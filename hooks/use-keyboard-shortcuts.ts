import { useEffect } from "react";

export type KeyboardShortcut = {
  key: string;
  handler: () => void;
  description: string;
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
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return;
      }

      // Ignore if modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      const pressedKey = event.key.toLowerCase();
      const shortcut = shortcuts.find((s) => s.key.toLowerCase() === pressedKey);

      if (shortcut) {
        event.preventDefault();
        shortcut.handler();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [shortcuts, enabled]);
}
