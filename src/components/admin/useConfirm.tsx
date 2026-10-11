import { useCallback, useState } from "react";
import ConfirmDialog, { type ConfirmOptions } from "./ConfirmDialog";

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * Promise-based replacement for window.confirm:
 *   const { confirm, dialog } = useConfirm();
 *   if (!(await confirm({ title, message }))) return;
 * Render `dialog` somewhere in the component.
 */
export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const close = useCallback(
    (confirmed: boolean) => {
      pending?.resolve(confirmed);
      setPending(null);
    },
    [pending],
  );

  const dialog = pending ? <ConfirmDialog {...pending} onClose={close} /> : null;
  return { confirm, dialog };
}
