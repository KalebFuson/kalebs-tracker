"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/initials";
import type { AppShellUser, Organization, Profile } from "@/types/app";
import { relaunchOnboardingTour } from "@/components/onboarding/OnboardingFlow";

type TopBarProps = {
  user: AppShellUser;
  profile: Profile | null;
  organization: Organization | null;
};

export function TopBar({ user, profile, organization }: TopBarProps) {
  const initials = getInitials(profile, user.email);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-primary/30 bg-primary px-6 text-primary-foreground">
      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary-foreground/80" />
          <Input
            type="search"
            placeholder="Search tasks, people..."
            className="border-white/35 bg-white/35 pl-9 text-primary-foreground/80 placeholder:text-primary-foreground/80 disabled:opacity-100"
            disabled
            aria-label="Search tasks, people"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {organization ? (
          <span className="hidden text-sm text-primary-foreground/95 sm:inline">
            {organization.name}
          </span>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-primary-foreground/90 hover:bg-white/15 hover:text-primary-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Account menu"
          >
            <Avatar size="sm">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="" />
              ) : null}
              <AvatarFallback className="bg-white/20 text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              render={<Link href="/settings" />}
              nativeButton={false}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => relaunchOnboardingTour()}
            >
              Take the tour
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                void signOut();
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
