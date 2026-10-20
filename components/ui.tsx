import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-card p-4 ${className}`}>{children}</div>;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline" | "danger" }) {
  const base = "rounded-full px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50";
  const variants: Record<string, string> = {
    primary: "bg-teal text-navy hover:bg-teal-dark hover:text-white",
    secondary: "bg-navy text-white hover:bg-navy-light",
    outline: "border border-border bg-transparent text-navy hover:bg-border/40",
    danger: "bg-danger-bg text-danger hover:bg-danger/10",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "teal" | "warning" | "danger" | "muted" }) {
  const tones: Record<string, string> = {
    default: "bg-border text-navy",
    teal: "bg-teal/15 text-teal-dark",
    warning: "bg-warning-bg text-warning",
    danger: "bg-danger-bg text-danger",
    muted: "bg-border/60 text-muted",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
      <p className="font-medium text-navy">{title}</p>
      {body && <p className="mt-1 text-sm text-muted">{body}</p>}
    </div>
  );
}

export function Spinner() {
  return <div className="px-5 py-10 text-center text-sm text-muted">Loading…</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-navy">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy placeholder:text-muted focus:border-teal focus:outline-none";
