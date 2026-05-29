import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { NotificationRow } from "./NotificationRow";

type NotificationsCardProps = {
  notifyTaskAssigned: boolean;
  notifyMentions: boolean;
  notifyDailyDigest: boolean;
  onNotifyTaskAssignedChange: (v: boolean) => void;
  onNotifyMentionsChange: (v: boolean) => void;
  onNotifyDailyDigestChange: (v: boolean) => void;
};

export function NotificationsCard({
  notifyTaskAssigned,
  notifyMentions,
  notifyDailyDigest,
  onNotifyTaskAssignedChange,
  onNotifyMentionsChange,
  onNotifyDailyDigestChange,
}: NotificationsCardProps) {
  return (
    <Card className="bg-white shadow-xs">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base font-semibold text-gray-900">Notifications</CardTitle>
        <CardDescription>
          Choose what you want to be notified about and how.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        <NotificationRow
          id="notify-task-assigned"
          label="Task Assigned"
          description="When someone assigns a new task to you."
          checked={notifyTaskAssigned}
          onCheckedChange={onNotifyTaskAssignedChange}
        />
        <NotificationRow
          id="notify-mentions"
          label="Mentions"
          description="When you are @mentioned in a task description or comment."
          checked={notifyMentions}
          onCheckedChange={onNotifyMentionsChange}
        />
        <NotificationRow
          id="notify-daily-digest"
          label="Daily Digest"
          description="A daily morning email summarizing tasks due today and upcoming."
          checked={notifyDailyDigest}
          onCheckedChange={onNotifyDailyDigestChange}
          badge="Recommended"
        />
      </CardContent>
    </Card>
  );
}
