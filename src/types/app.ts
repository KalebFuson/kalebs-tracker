export type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  email: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
};

export type AppShellUser = {
  id: string;
  email: string | undefined;
};

export type AppShellProps = {
  user: AppShellUser;
  profile: Profile | null;
  organization: Organization | null;
};

export type CreateOrgState = {
  error?: string;
};
