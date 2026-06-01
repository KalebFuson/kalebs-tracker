import { Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardEvent } from "@/types/dashboard";

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function formatActionLabel(action: string, entityType: string): string {
  const entity = entityType.replace(/_/g, " ");
  switch (action) {
    case "created": return `created a ${entity}`;
    case "updated": return `updated a ${entity}`;
    case "deleted": return `deleted a ${entity}`;
    case "completed": return `completed ${entity}`;
    case "assigned": return `was assigned a ${entity}`;
    case "commented": return `commented on`;
    default: return `${action} a ${entity}`;
  }
}

type RecentActivityFeedProps = {
  events: DashboardEvent[];
};

export function RecentActivityFeed({ events }: RecentActivityFeedProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <Activity className="size-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-0 pb-0">
        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Activity className="size-7 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">No recent activity yet.</p>
            <p className="text-xs text-gray-500">
              Activity will appear here as you and your team work on tasks.
            </p>
          </div>
        ) : (
          <>
            <ul>
              {events.map((event) => {
                const initials = (event.actor_name ?? "?")
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <li
                    key={event.id}
                    className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <span className="text-xs font-semibold text-primary">
                        {initials}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">
                          {event.actor_name ?? "Someone"}
                        </span>{" "}
                        {formatActionLabel(event.action, event.entity_type)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="inline-block size-3 rounded-full border border-current opacity-60" />
                        {formatRelativeTime(event.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {/* "Load more" is a visual placeholder — pagination comes later */}
            <div className="border-t border-border px-4 py-3 text-center">
              <span className="cursor-default text-sm font-medium text-primary opacity-50">
                Load more activity
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
