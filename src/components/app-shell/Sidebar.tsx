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

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-white">
        <div className="border-b border-border px-4 py-5">
          <p className="text-lg font-bold text-indigo-600">Kalebs Tracker</p>
        </div>

        <div className="px-3 py-4">
          <Button
            type="button"
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setTaskDialogOpen(true)}
          >
            <Plus data-icon="inline-start" />
            Create Task
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-4">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/settings" || pathname.startsWith("/settings/")
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <Settings className="size-4 shrink-0" />
            Settings
          </Link>
        </div>
      </aside>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Task creation coming in Phase 4
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
