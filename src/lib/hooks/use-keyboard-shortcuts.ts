"use client";

import { useEffect } from "react";

const SEARCH_OPEN_EVENT = "pocketshift:open-search";

export function dispatchOpenSearch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SEARCH_OPEN_EVENT));
  }
}

export function useOpenSearchListener(callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(SEARCH_OPEN_EVENT, handler);
    return () => window.removeEventListener(SEARCH_OPEN_EVENT, handler);
  }, [callback]);
}

export function useKeyboardShortcuts(options: {
  onAdd?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const inInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.getAttribute?.("contenteditable") === "true";

      if (!inInput && isMod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        e.stopPropagation();
        options.onAdd?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [options.onAdd]);
}
