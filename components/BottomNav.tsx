"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PawPrint, Stethoscope, ClipboardList, CalendarDays, User } from "lucide-react";
import type { Role } from "@/lib/types";

const FARMER_LINKS = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/animals", label: "My Animals", Icon: PawPrint },
  { href: "/vets", label: "Vets", Icon: Stethoscope },
  { href: "/profile", label: "Profile", Icon: User },
];

const VET_LINKS = [
  { href: "/vet", label: "Home", Icon: Home },
  { href: "/vet/reports", label: "Reports", Icon: ClipboardList },
  { href: "/vet/appointments", label: "Appointments", Icon: CalendarDays },
  { href: "/profile", label: "Profile", Icon: User },
];

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = role === "vet" ? VET_LINKS : FARMER_LINKS;

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-border bg-card md:hidden">
      <ul className="flex">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/home" && link.href !== "/vet" && pathname.startsWith(link.href));
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                  active ? "text-navy" : "text-muted"
                }`}
              >
                <link.Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
