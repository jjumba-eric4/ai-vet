import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  backHref,
  right,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 px-5 pt-6 pb-4 md:px-0">
      {backHref && (
        <Link href={backHref} className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-teal-dark hover:bg-border/50">
          <ChevronLeft size={22} />
        </Link>
      )}
      <div className="flex-1">
        <h1 className="text-xl font-bold text-navy md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
