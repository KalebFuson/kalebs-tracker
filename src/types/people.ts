export type OrgMemberWithProfile = {
  id: string; // org_members.id
  user_id: string;
  role: "member" | "admin";
  joined_at: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  teams: Array<{ team_id: string; team_name: string }>;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: "member" | "admin";
  token: string;
  created_at: string;
  expires_at: string;
  invited_by_name: string | null;
};
