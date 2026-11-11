"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

const DEFAULT_AI_MESSAGES = [
  "Uploading photo…",
  "Looking closely at the photo…",
  "Checking for visible signs of illness or injury…",
  "Comparing with common livestock conditions…",
  "Finishing up the assessment…",
];

// Progress is a visual approximation (we don't get real progress from the model server) —
// it exists to reassure the farmer the app hasn't frozen during a slow cold-start inference.
export function AiProgress({
  title = "AI is analyzing the photo…",
  messages = DEFAULT_AI_MESSAGES,
  estimateSeconds = 45,
  className = "",
}: {
  title?: string;
  messages?: string[];
  estimateSeconds?: number;
  className?: string;
}) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const messageTimer = setInterval(() => setMessageIndex((i) => (i + 1) % messages.length), 3000);
    const clock = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(messageTimer);
      clearInterval(clock);
    };
  }, [messages.length]);

  const progress = Math.min(96, (elapsed / estimateSeconds) * 100);

  return (
    <Card className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="relative flex h-10 w-10 flex-none items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-teal/30" />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-teal/15 text-teal-dark">
            <Loader2 size={20} className="animate-spin" />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{title}</p>
          <p className="truncate text-xs text-muted">{messages[messageIndex]}</p>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-teal transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-right text-[11px] text-muted">{elapsed}s · can take up to a couple of minutes on a cold start</p>
    </Card>
  );
}
