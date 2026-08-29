"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useCallback, useState } from "react";

interface ToastState {
  id: number;
  message: string;
  variant: "success" | "error";
}

let nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, variant: "success" | "error" = "success") => {
    const id = nextId++;
    setToasts((current) => [...current, { id, message, variant }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const ToastViewport = useCallback(
    () => (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              toast.variant === "success"
                ? "border-teal/30 bg-paper-raised text-teal"
                : "border-coral/30 bg-paper-raised text-coral"
            }`}
          >
            {toast.variant === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    ),
    [toasts]
  );

  return { showToast, ToastViewport };
}
