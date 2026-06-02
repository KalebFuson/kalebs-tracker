"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Caveat } from "next/font/google";
import {
  Calendar,
  CheckSquare,
  CircleHelp,
  Settings,
  Home,
  UserCircle,
  Users,
} from "lucide-react";

import { CreateTaskMenu } from "@/components/tasks/CreateTaskMenu";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/people", label: "People", icon: UserCircle },
] as const;

const navLinkClass =
  "flex items-center gap-3 rounded-lg py-2 pl-[10px] pr-3 text-sm font-medium transition-colors";

const wordmarkFont = Caveat({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-wordmark",
});

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-primary/10 text-sidebar-foreground">
      <div className="flex h-14 items-center justify-center border-b border-border px-5">
        <p className={`${wordmarkFont.variable} text-3xl leading-none text-primary [font-family:var(--font-wordmark)]`}>
          Kalebs Tracker
        </p>
      </div>

      <div className="px-3 py-4" data-tour="create-task">
        <CreateTaskMenu label="Create Task" className="w-full shadow-sm" />
      </div>

      <nav className="flex-1 space-y-0.5 px-2" data-tour="nav">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              data-tour={label === "Teams" ? "teams" : undefined}
              className={cn(
                navLinkClass,
                isActive
                  ? "font-semibold text-primary"
                  : "text-foreground/70 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-border px-2 py-4">
        <Link
          href="/help"
          className={cn(
            navLinkClass,
            pathname === "/help" || pathname.startsWith("/help/")
              ? "font-semibold text-primary"
              : "text-foreground/70 hover:text-foreground",
          )}
        >
          <CircleHelp className="size-4 shrink-0" />
          Help
        </Link>
        <Link
          href="/settings"
          className={cn(
            navLinkClass,
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "font-semibold text-primary"
              : "text-foreground/70 hover:text-foreground",
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
