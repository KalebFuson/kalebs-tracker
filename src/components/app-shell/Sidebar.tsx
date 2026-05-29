"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  CheckSquare,
  Settings,
  Home,
  Plus,
  UserCircle,
  Users,
} from "lucide-react";

import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/people", label: "People", icon: UserCircle },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  return (
    <>
      <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-gray-50">
        <div className="border-b border-border px-5 py-5">
          <p className="text-base font-extrabold tracking-tight text-indigo-600">Kalebs Tracker</p>
        </div>

        <div className="px-3 py-4">
          <Button
            type="button"
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            onClick={() => setTaskDialogOpen(true)}
          >
            <Plus data-icon="inline-start" />
            Create Task
          </Button>
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
                  "flex items-center gap-3 rounded-lg py-2 pl-[10px] pr-3 text-sm font-medium transition-colors border-l-[3px]",
                  isActive
                    ? "border-indigo-600 bg-white text-indigo-700 shadow-sm"
                    : "border-transparent text-gray-600 hover:bg-white hover:text-gray-900",
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
              "flex items-center gap-3 rounded-lg py-2 pl-[10px] pr-3 text-sm font-medium transition-colors border-l-[3px]",
              pathname === "/settings" || pathname.startsWith("/settings/")
                ? "border-indigo-600 bg-white text-indigo-700 shadow-sm"
                : "border-transparent text-gray-600 hover:bg-white hover:text-gray-900",
            )}
          >
            <Settings className="size-4 shrink-0" />
            Settings
          </Link>
        </div>
      </aside>

      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
      />
    </>
  );
}
