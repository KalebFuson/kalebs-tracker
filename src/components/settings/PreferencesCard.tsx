import { CalendarDays, Globe } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (America/New_York)" },
  { value: "America/Chicago", label: "Central Time (America/Chicago)" },
  { value: "America/Denver", label: "Mountain Time (America/Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (America/Los_Angeles)" },
  { value: "America/Phoenix", label: "Arizona (America/Phoenix)" },
  { value: "America/Anchorage", label: "Alaska (America/Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Pacific/Honolulu)" },
  { value: "Europe/London", label: "UK (Europe/London)" },
  { value: "Europe/Paris", label: "Central European (Europe/Paris)" },
  { value: "Asia/Tokyo", label: "Japan (Asia/Tokyo)" },
  { value: "Australia/Sydney", label: "Australia Eastern (Australia/Sydney)" },
] as const;

type PreferencesCardProps = {
  timezone: string;
  onTimezoneChange: (v: string | null) => void;
};

export function PreferencesCard({ timezone, onTimezoneChange }: PreferencesCardProps) {
  const selectedLabel =
    TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone;

  return (
    <Card className="bg-white shadow-xs">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base font-semibold text-gray-900">
          Regional &amp; Application Preferences
        </CardTitle>
        <CardDescription>
          Customize how dates, times, and external integrations behave.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Timezone */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Globe className="size-4 text-muted-foreground" />
            Timezone
          </Label>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger className="w-full">
              <SelectValue>{selectedLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-600">
            Even though tasks are day-based, timezone ensures the &quot;current day&quot; flips
            at the correct moment for you.
          </p>
        </div>

        {/* Calendar sync — coming soon */}
        <div className="space-y-2 border-t border-border pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-gray-900">Personal Calendar Sync</p>
                <p className="text-xs text-muted-foreground">
                  Export your assigned tasks to Google Calendar or Outlook.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              Coming soon
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
