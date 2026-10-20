"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PawPrint, Stethoscope, ClipboardList, CalendarDays, PhoneCall, type LucideIcon } from "lucide-react";
import type { Role, User as UserType } from "@/lib/types";
import { Logo } from "@/components/Logo";

const FARMER_LINKS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/animals", label: "My Animals", Icon: PawPrint },
  { href: "/vets", label: "Veterinarians", Icon: Stethoscope },
  { href: "/reports", label: "Health Records", Icon: ClipboardList },
  { href: "/appointments", label: "Appointments", Icon: CalendarDays },
  { href: "/emergency", label: "Emergency Help", Icon: PhoneCall },
];

const VET_LINKS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/vet", label: "Home", Icon: Home },
  { href: "/vet/reports", label: "Reports", Icon: ClipboardList },
  { href: "/vet/appointments", label: "Appointments", Icon: CalendarDays },
];

function isActive(pathname: string, href: string) {
  const homeHrefs = ["/home", "/vet"];
  if (homeHrefs.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ role, user }: { role: Role; user: UserType }) {
  const pathname = usePathname();
  const links = role === "vet" ? VET_LINKS : FARMER_LINKS;

  return (
    <aside className="hidden w-64 flex-none flex-col border-r border-border bg-card md:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <Logo size={40} />
        <div>
          <p className="text-sm font-bold text-navy">VetConnect</p>
          <p className="text-xs text-muted">{role === "vet" ? "Veterinarian" : "Farmer"}</p>
        </div>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                    active ? "bg-navy text-white" : "text-navy hover:bg-background"
                  }`}
                >
                  <link.Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Link
        href="/profile"
        className={`m-3 flex items-center gap-3 rounded-xl px-3 py-3 ${
          pathname === "/profile" ? "bg-navy text-white" : "hover:bg-background"
        }`}
      >
        <div
          className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-semibold ${
            pathname === "/profile" ? "bg-white/15 text-white" : "bg-teal/15 text-teal-dark"
          }`}
        >
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className={`text-xs ${pathname === "/profile" ? "text-white/70" : "text-muted"}`}>View profile</p>
        </div>
      </Link>
    </aside>
  );
}
