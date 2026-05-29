import Link from "next/link";
import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Team = { id: string; name: string };

type PersonalInfoCardProps = {
  firstName: string;
  lastName: string;
  email: string;
  teams: Team[];
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
};

function UserInitialsAvatar({ name }: { name: string }) {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : trimmed.slice(0, 2).toUpperCase() || "?";

  return (
    <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white ring-4 ring-indigo-100">
      {initials}
    </div>
  );
}

export function PersonalInfoCard({
  firstName,
  lastName,
  email,
  teams,
  onFirstNameChange,
  onLastNameChange,
}: PersonalInfoCardProps) {
  const fullName = `${firstName} ${lastName}`.trim() || "?";

  return (
    <Card className="bg-white shadow-xs">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base font-semibold text-gray-900">
          Personal Information
        </CardTitle>
        <CardDescription>
          Update your personal details used across Kalebs Tracker.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Avatar row */}
        <div className="flex items-center gap-5">
          <UserInitialsAvatar name={fullName} />
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                disabled
                className="rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-gray-500 opacity-50 cursor-not-allowed"
                title="Coming soon"
              >
                Change Avatar
              </button>
              <button
                type="button"
                disabled
                className="rounded-md px-3 py-1.5 text-sm font-medium text-red-400 opacity-50 cursor-not-allowed"
                title="Coming soon"
              >
                Remove
              </button>
            </div>
            <p className="text-xs text-gray-600">
              JPG, GIF or PNG. 1MB max. (Coming soon)
            </p>
          </div>
        </div>

        {/* Name row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="first-name">First name</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last-name">Last name</Label>
            <Input
              id="last-name"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        {/* Email — display only */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="bg-gray-50 text-muted-foreground"
          />
          <p className="text-xs text-gray-600">
            Your email is used for login and notifications.
          </p>
        </div>

        {/* Team memberships */}
        <div className="space-y-3 border-t border-border pt-5">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="size-4 shrink-0 text-muted-foreground" />
            Team Memberships
          </div>
          <div className="flex flex-wrap gap-2">
            {teams.length === 0 ? (
              <span className="text-sm text-muted-foreground">Not in any teams yet.</span>
            ) : (
              teams.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                >
                  {t.name}
                </span>
              ))
            )}
            <Link
              href="/teams"
              className="rounded-full border border-dashed border-indigo-300 px-3 py-1 text-xs font-medium text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              Browse Teams →
            </Link>
          </div>
          <p className="text-xs text-gray-600">
            Team memberships dictate which tasks and calendars you can view by default. Contact
            an admin to change roles.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
