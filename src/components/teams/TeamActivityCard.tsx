import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamEvent } from "@/types/teams";

type TeamActivityCardProps = {
  events: TeamEvent[];
};

function formatAction(event: TeamEvent): string {
  const meta = event.metadata as Record<string, string> | null;
  switch (event.action) {
    case "created":
      return `created ${event.entity_type === "team" ? "this team" : "a task"}`;
    case "updated":
      if (meta?.field === "status") return `changed status to ${meta.to ?? "unknown"}`;
      if (meta?.field === "priority") return `changed priority to ${meta.to ?? "unknown"}`;
      if (meta?.field === "assignee") return `updated assignee`;
      return "updated a task";
    case "commented":
      return "commented on a task";
    default:
      return event.action.replace(/_/g, " ");
  }
}

function MemberAvatar({ name, avatar }: { name: string | null; avatar: string | null }) {
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="size-7 shrink-0 rounded-full overflow-hidden bg-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 ring-1 ring-white">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export function TeamActivityCard({ events }: TeamActivityCardProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold text-gray-900">Recent Activity</CardTitle>
        <p className="text-xs text-muted-foreground">
          Latest updates and actions within the team.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Activity className="size-7 opacity-30" />
            <p className="text-sm">No activity yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-3 px-4 py-3">
                <MemberAvatar name={event.actor_name} avatar={event.actor_avatar} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">
                      {event.actor_name ?? "Someone"}
                    </span>{" "}
                    {formatAction(event)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
