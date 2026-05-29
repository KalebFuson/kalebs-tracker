import { format } from "date-fns";

import type { OrgMemberWithProfile } from "@/types/people";

import { InlineRoleEditor } from "./InlineRoleEditor";
import { MemberActionsMenu } from "./MemberActionsMenu";

type PeopleMemberRowProps = {
  member: OrgMemberWithProfile;
  isAdmin: boolean;
  isCurrentUser: boolean;
};

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
    <div className="size-9 shrink-0 rounded-full overflow-hidden bg-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 ring-1 ring-border">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export function PeopleMemberRow({ member, isAdmin, isCurrentUser }: PeopleMemberRowProps) {
  const displayName = member.full_name ?? member.email;

  return (
    <tr className="group border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
      {/* Name + Email */}
      <td className="py-3 pl-4 pr-4">
        <div className="flex items-center gap-3">
          <MemberAvatar name={member.full_name} avatar={member.avatar_url} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {displayName}
              {isCurrentUser && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">(you)</span>
              )}
            </p>
            {member.full_name && (
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
            )}
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="py-3 pr-4">
        <InlineRoleEditor
          memberId={member.id}
          currentRole={member.role}
          editable={isAdmin && !isCurrentUser}
        />
      </td>

      {/* Teams */}
      <td className="py-3 pr-4">
        {member.teams.length === 0 ? (
          <span className="text-xs text-muted-foreground">Not in any teams</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {member.teams.slice(0, 2).map((t) => (
              <span
                key={t.team_id}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {t.team_name}
              </span>
            ))}
            {member.teams.length > 2 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                +{member.teams.length - 2} more
              </span>
            )}
          </div>
        )}
      </td>

      {/* Joined */}
      <td className="py-3 pr-4 text-sm text-muted-foreground whitespace-nowrap">
        {format(new Date(member.joined_at), "MMM d, yyyy")}
      </td>

      {/* Actions (admin only, not self) */}
      <td className="py-3 pr-4 w-10 text-right">
        {isAdmin && !isCurrentUser && (
          <MemberActionsMenu memberId={member.id} memberName={displayName} />
        )}
      </td>
    </tr>
  );
}
