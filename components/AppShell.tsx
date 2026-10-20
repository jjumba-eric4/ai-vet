"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useProfile } from "@/lib/profile-context";
import { useUser } from "@/lib/hooks";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { userId, ready } = useProfile();
  const { data: user } = useUser(userId);

  const showChrome = ready && !!user && pathname !== "/";

  if (!showChrome) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <Sidebar role={user.role} user={user} />
      <div className="flex flex-1 justify-center">
        <div className="w-full max-w-md pb-20 md:max-w-5xl md:px-10 md:py-8 md:pb-10">{children}</div>
      </div>
      <BottomNav role={user.role} />
    </div>
  );
}
