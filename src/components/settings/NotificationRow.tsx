import { Switch } from "@/components/ui/switch";

type NotificationRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  badge?: string;
};

export function NotificationRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  badge,
}: NotificationRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
          {label}
          {badge && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
              {badge}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground">Email</span>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}
