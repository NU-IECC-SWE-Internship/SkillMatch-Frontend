import './StatusModal.css'

type StatusModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "success" | "error";
  confirmText?: string;
  onClose: () => void;
};

export default function StatusModal({
  isOpen,
  title,
  message,
  type = "success",
  confirmText = "Close",
  onClose,
}: StatusModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="status-modal-overlay" onClick={onClose}>
      <div
        className="status-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="status-modal-header">
          <div className="status-modal-icon" data-type={type}>
            {type === "success" ? "✓" : "!"}
          </div>
          <h2 id="status-modal-title">{title}</h2>
          <button
            type="button"
            className="status-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="status-modal-body">
          <p>{message}</p>
        </div>

        <div className="status-modal-footer">
          <button type="button" className="status-modal-button" onClick={onClose}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
