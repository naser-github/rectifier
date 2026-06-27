import { useState, type ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

interface HeaderProps {
  readonly onClearSaved: () => void;
}

export function Header({ onClearSaved }: HeaderProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <>
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-line px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-[5px] bg-red-accent font-code text-xs font-black text-white">
            {"{ }"}
          </span>
          <span className="text-lg font-extrabold">Rectifier</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-black focus-visible:outline-2 focus-visible:outline-red-accent focus-visible:outline-offset-2"
        >
          <LockKeyhole size={14} aria-hidden="true" />
          <span className="hidden sm:inline">Your JSON stays in this browser</span>
          <span className="sm:hidden" aria-label="Privacy">
            Privacy
          </span>
        </button>
      </header>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setConfirmClear(false);
        }}
        title="Browser storage"
        actions={
          confirmClear ? (
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                onClick={() => {
                  onClearSaved();
                  setOpen(false);
                  setConfirmClear(false);
                }}
              >
                Confirm clear
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmClear(false);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              onClick={() => {
                setConfirmClear(true);
              }}
            >
              Clear saved workspace
            </Button>
          )
        }
      >
        {confirmClear ? (
          <p className="text-sm leading-relaxed">
            Are you sure you want to clear the saved workspace? This removes persisted
            data without clearing your currently open workspace.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            Rectifier saves the latest small workspace locally in this browser. Large
            inputs are not auto-saved. No data is sent to a server. Clearing saved data
            removes persisted work without clearing your currently open workspace.
          </p>
        )}
      </Dialog>
    </>
  );
}
