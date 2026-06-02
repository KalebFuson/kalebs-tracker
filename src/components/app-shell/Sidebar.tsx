"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CheckSquare,
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-border px-5 py-5">
        <p className="text-base font-extrabold tracking-tight text-primary">
          Kalebs Tracker
        </p>
      </div>

      <div className="px-3 py-4">
        <CreateTaskMenu label="Create Task" className="w-full shadow-sm" />
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                navLinkClass,
                isActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-sidebar-foreground/70 hover:bg-primary/5 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-2 py-4">
        <Link
          href="/settings"
          className={cn(
            navLinkClass,
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "bg-primary/10 font-semibold text-primary"
              : "text-sidebar-foreground/70 hover:bg-primary/5 hover:text-sidebar-foreground",
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
