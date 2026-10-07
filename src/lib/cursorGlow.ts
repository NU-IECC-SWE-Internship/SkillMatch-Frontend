import type { PointerEvent } from "react";

export function cursorGlowFor(selector: string) {
  return (e: PointerEvent<HTMLElement>) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(selector);
    if (!card) return;

    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    card.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };
}

export const handleCursorGlow = cursorGlowFor(".fx-glow");
