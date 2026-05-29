export type TeamMember = {
  id: string; // team_members.id
  user_id: string;
  role: string | null;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  joined_at: string;
};

export type TeamMemberPreview = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type TeamListItem = {
  id: string;
  name: string;
  department: string | null;
  description: string | null;
  created_at: string;
  member_count: number;
  active_task_count: number;
  /** First few members for the avatar stack */
  members: TeamMemberPreview[];
};

export type TeamEvent = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  actor_name: string | null;
  actor_avatar: string | null;
  metadata: Record<string, unknown> | null;
};

export type TeamDetail = {
  id: string;
  name: string;
  department: string | null;
  description: string | null;
  created_at: string;
  members: TeamMember[];
  active_task_count: number;
  overdue_task_count: number;
  completed_task_count: number;
  recent_events: TeamEvent[];
};

/** Lightweight team shape used in dropdowns / checkboxes */
export type OrgTeam = {
  id: string;
  name: string;
};

export type CreateTeamInput = {
  name: string;
  department: string | null;
  description: string | null;
};

export type CreateTeamResult =
  | { ok: true; teamId: string }
  | { ok: false; error: string };

export type SendInvitationsInput = {
  emails: string[];
  role: "member" | "admin";
  defaultTeamIds: string[];
};

export type SentInvitation = {
  email: string;
  token: string;
};

export type SendInvitationsResult =
  | { ok: true; invitations: SentInvitation[] }
  | { ok: false; error: string };
