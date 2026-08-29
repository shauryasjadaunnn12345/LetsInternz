import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Label({
  children,
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-sm font-medium text-ink ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export function Input({
  className = "",
  invalid = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={`w-full rounded-lg border bg-paper-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-slate/60 transition-colors focus:outline-none focus:ring-2 focus:ring-marigold-dark/40 disabled:cursor-not-allowed disabled:bg-paper disabled:text-slate ${
        invalid ? "border-coral" : "border-border"
      } ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  invalid = false,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={`w-full rounded-lg border bg-paper-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-slate/60 transition-colors focus:outline-none focus:ring-2 focus:ring-marigold-dark/40 ${
        invalid ? "border-coral" : "border-border"
      } ${className}`}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-coral">{children}</p>;
}

export function FieldGroup({
  label,
  htmlFor,
  error,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}
