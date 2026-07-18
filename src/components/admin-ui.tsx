import { Loader2, X } from "lucide-react";
import { ReactNode } from "react";

export const inpCls = "w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  onSubmit,
  children,
  loading,
}: {
  title: string;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl bg-card border shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {onSubmit ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(e);
            }}
          >
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
            <div className="flex items-center justify-end gap-2 border-t bg-muted/40 px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
        )}
      </div>
    </div>
  );
}
