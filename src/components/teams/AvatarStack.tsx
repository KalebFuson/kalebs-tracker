import { cn } from "@/lib/utils";

type AvatarItem = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type AvatarStackProps = {
  members: AvatarItem[];
  max?: number;
  size?: "sm" | "md";
};

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export function AvatarStack({ members, max = 3, size = "md" }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  const sizeClass = size === "sm" ? "size-6 text-[9px]" : "size-8 text-xs";

  return (
    <div className="flex -space-x-2">
      {visible.map((m) => (
        <div
          key={m.user_id}
          className={cn(
            "rounded-full ring-2 ring-white overflow-hidden shrink-0 bg-indigo-200 flex items-center justify-center font-semibold text-indigo-700",
            sizeClass,
          )}
          title={m.full_name ?? undefined}
        >
          {m.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.avatar_url} alt={m.full_name ?? ""} className="size-full object-cover" />
          ) : (
            <span>{initials(m.full_name)}</span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center font-semibold text-gray-600 shrink-0",
            sizeClass,
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
