"use client";

import { useEffect } from "react";
import { dispatchOpenSearch } from "@/lib/hooks/use-keyboard-shortcuts";

/**
 * Global keyboard listener for Ctrl+K and / to open search.
 * Must be in capture phase to intercept before browser defaults (e.g. Ctrl+K in Chrome).
 */
export function GlobalKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const inInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.getAttribute?.("contenteditable") === "true";

      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        dispatchOpenSearch();
        return;
      }

      if (!inInput && e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        dispatchOpenSearch();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  return null;
}
