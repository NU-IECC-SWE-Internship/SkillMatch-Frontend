import { useEffect, useState } from "react";

/** A success message that clears itself after a few seconds. */
export function useFlash(durationMs = 4000) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs]);

  return [message, setMessage] as const;
}

export const PENDING_SKILLS_CHANGED = "admin:pending-skills-changed";

/** Tell the sidebar to refresh its "awaiting approval" badge. */
export function notifyPendingSkillsChanged() {
  window.dispatchEvent(new Event(PENDING_SKILLS_CHANGED));
}
