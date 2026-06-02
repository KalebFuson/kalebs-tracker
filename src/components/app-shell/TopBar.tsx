"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

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
import { getInitials } from "@/lib/initials";
import type { AppShellUser, Organization, Profile } from "@/types/app";
import { relaunchOnboardingTour } from "@/components/onboarding/OnboardingFlow";

type TopBarProps = {
  user: AppShellUser;
  profile: Profile | null;
  organization: Organization | null;
};

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/tasks" || pathname.startsWith("/tasks/")) return "Tasks";
  if (pathname === "/calendar" || pathname.startsWith("/calendar/")) return "Calendar";
  if (pathname.startsWith("/teams")) return "Teams";
  if (pathname === "/people") return "People";
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return "Settings";
  if (pathname === "/help") return "Help";
  return "Kalebs Tracker";
}

export function TopBar({ user, profile, organization }: TopBarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const initials = getInitials(profile, user.email);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-primary/30 bg-primary px-6 text-primary-foreground">
      <h1 className="truncate text-lg font-semibold text-primary-foreground">
        {pageTitle}
      </h1>

      <div className="flex shrink-0 items-center gap-2">
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
