"use client";

import type { AppShellProps } from "@/types/app";

import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({
  user,
  profile,
  organization,
  children,
}: AppShellProps & {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          user={user}
          profile={profile}
          organization={organization}
        />
        <OnboardingFlow hasCompletedOnboarding={profile?.has_completed_onboarding ?? false} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
