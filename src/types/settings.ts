export type UserPreferences = {
  timezone: string;
  notify_task_assigned_email: boolean;
  notify_mentions_email: boolean;
  notify_daily_digest_email: boolean;
};

export type UserSettings = {
  firstName: string;
  lastName: string;
  email: string;
  teams: Array<{ id: string; name: string }>;
  preferences: UserPreferences;
};

export type UpdateSettingsInput = {
  fullName: string;
  timezone: string;
  notifyTaskAssignedEmail: boolean;
  notifyMentionsEmail: boolean;
  notifyDailyDigestEmail: boolean;
};

export type UpdateSettingsResult = { ok: true } | { ok: false; error: string };
