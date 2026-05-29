import type { Profile } from "@/types/app";

export function getInitials(
  profile: Profile | null,
  email?: string,
): string {
  if (profile?.full_name?.trim()) {
    const parts = profile.full_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  const source = profile?.email ?? email ?? "?";
  return source.slice(0, 2).toUpperCase();
}
