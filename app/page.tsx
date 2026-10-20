"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import { useUser, useUsers } from "@/lib/hooks";
import { ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui";
import { Logo } from "@/components/Logo";
import type { User } from "@/lib/types";

export default function ProfilePickerPage() {
  const router = useRouter();
  const { userId, setUserId, ready } = useProfile();
  const { data: activeUser } = useUser(userId);
  const { data: users, isLoading } = useUsers();

  useEffect(() => {
    if (ready && activeUser) {
      router.replace(activeUser.role === "vet" ? "/vet" : "/home");
    }
  }, [ready, activeUser, router]);

  function chooseProfile(user: User) {
    setUserId(user.id);
    router.push(user.role === "vet" ? "/vet" : "/home");
  }

  if (!ready || isLoading) return <Spinner />;

  const farmers = users?.filter((u) => u.role === "farmer") ?? [];
  const vets = users?.filter((u) => u.role === "vet") ?? [];

  return (
    <div className="flex min-h-screen flex-col items-center bg-navy px-6 pt-16 pb-10 text-white md:justify-center md:px-10 md:py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-10 flex flex-col items-center text-center md:mb-12">
          <Logo size={64} className="mb-4 border border-white/10 md:h-20 md:w-20" />
          <h1 className="text-2xl font-bold md:text-3xl">VetConnect</h1>
          <p className="mt-1 text-sm text-white/60 md:text-base">
            Livestock health records and direct farmer–veterinarian support.
          </p>
        </div>

        <div className="flex-1 space-y-6 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
          <section>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-white/50">
              Continue as a farmer
            </h2>
            <div className="space-y-2">
              {farmers.map((u) => (
                <ProfileCard key={u.id} user={u} onClick={() => chooseProfile(u)} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-white/50">
              Continue as a veterinarian
            </h2>
            <div className="space-y-2">
              {vets.map((u) => (
                <ProfileCard key={u.id} user={u} onClick={() => chooseProfile(u)} />
              ))}
            </div>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          No account needed for this demo — pick a profile to continue.
        </p>
      </div>
    </div>
  );
}

function ProfileCard({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-teal/20 text-base font-semibold text-teal">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{user.name}</p>
          <p className="text-xs text-white/50">
            {user.role === "farmer" ? user.district : user.specialty}
          </p>
        </div>
        <ChevronRight size={18} className="text-white/40" />
      </div>
    </button>
  );
}
