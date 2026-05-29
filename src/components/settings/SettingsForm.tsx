"use client";

import { Save } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import type { UserSettings } from "@/types/settings";

import { NotificationsCard } from "./NotificationsCard";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { PreferencesCard } from "./PreferencesCard";

type SettingsFormProps = {
  initial: UserSettings;
};

type FormState = {
  firstName: string;
  lastName: string;
  timezone: string;
  notifyTaskAssigned: boolean;
  notifyMentions: boolean;
  notifyDailyDigest: boolean;
};

function toFormState(s: UserSettings): FormState {
  return {
    firstName: s.firstName,
    lastName: s.lastName,
    timezone: s.preferences.timezone,
    notifyTaskAssigned: s.preferences.notify_task_assigned_email,
    notifyMentions: s.preferences.notify_mentions_email,
    notifyDailyDigest: s.preferences.notify_daily_digest_email,
  };
}

function isDirty(current: FormState, saved: FormState): boolean {
  return (Object.keys(current) as (keyof FormState)[]).some(
    (k) => current[k] !== saved[k],
  );
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [saved, setSaved] = useState<FormState>(toFormState(initial));
  const [form, setForm] = useState<FormState>(toFormState(initial));
  const [isPending, startTransition] = useTransition();

  const dirty = isDirty(form, saved);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCancel() {
    setForm(saved);
  }

  function handleSave() {
    startTransition(async () => {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      const result = await updateSettings({
        fullName,
        timezone: form.timezone,
        notifyTaskAssignedEmail: form.notifyTaskAssigned,
        notifyMentionsEmail: form.notifyMentions,
        notifyDailyDigestEmail: form.notifyDailyDigest,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Settings saved.");
      setSaved(form);
    });
  }

  return (
    <div className="space-y-6">
      <PersonalInfoCard
        firstName={form.firstName}
        lastName={form.lastName}
        email={initial.email}
        teams={initial.teams}
        onFirstNameChange={(v) => set("firstName", v)}
        onLastNameChange={(v) => set("lastName", v)}
      />

      <PreferencesCard
        timezone={form.timezone}
        onTimezoneChange={(v) => { if (v !== null) set("timezone", v); }}
      />

      <NotificationsCard
        notifyTaskAssigned={form.notifyTaskAssigned}
        notifyMentions={form.notifyMentions}
        notifyDailyDigest={form.notifyDailyDigest}
        onNotifyTaskAssignedChange={(v) => set("notifyTaskAssigned", v)}
        onNotifyMentionsChange={(v) => set("notifyMentions", v)}
        onNotifyDailyDigestChange={(v) => set("notifyDailyDigest", v)}
      />

      {/* Footer */}
      <div className="flex justify-end gap-3 pb-8">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={!dirty || isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isPending}
          className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="size-4" />
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
