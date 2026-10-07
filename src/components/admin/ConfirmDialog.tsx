import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onClose,
}: ConfirmOptions & { onClose: (confirmed: boolean) => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="admin-dialog-overlay" onClick={() => onClose(false)}>
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="admin-dialog-title">{title}</h2>
        <div className="admin-dialog-body">{message}</div>
        <div className="admin-dialog-actions">
          <button type="button" className="admin-secondary-btn" onClick={() => onClose(false)}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={danger ? "admin-danger-btn" : "admin-approve-btn"}
            onClick={() => onClose(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
