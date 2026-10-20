"use client";

import { useRouter } from "next/navigation";
import { useRequireProfile } from "@/lib/hooks";
import { useProfile } from "@/lib/profile-context";
import { PageHeader } from "@/components/PageHeader";
import { Button, Card, Spinner } from "@/components/ui";

export default function ProfilePage() {
  const { user, isLoading } = useRequireProfile();
  const { setUserId } = useProfile();
  const router = useRouter();

  if (isLoading || !user) return <Spinner />;

  return (
    <div>
      <PageHeader title="Profile" />
      <div className="space-y-4 px-5 md:max-w-xl md:px-0">
        <Card className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-teal/15 text-xl font-bold text-teal-dark">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="text-base font-bold text-navy">{user.name}</p>
            <p className="text-sm text-muted">{user.role === "farmer" ? "Farmer" : "Veterinarian"}</p>
          </div>
        </Card>

        <Card className="space-y-3">
          {user.phone && <Row label="Phone" value={user.phone} />}
          {user.district && <Row label="District" value={user.district} />}
          {user.credentials && <Row label="Credentials" value={user.credentials} />}
          {user.specialty && <Row label="Specialty" value={user.specialty} />}
          {user.location && <Row label="Location" value={user.location} />}
          {user.consult_fee && <Row label="Consultation fee" value={user.consult_fee} />}
        </Card>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setUserId(null);
            router.push("/");
          }}
        >
          Switch profile
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-navy">{value}</span>
    </div>
  );
}
