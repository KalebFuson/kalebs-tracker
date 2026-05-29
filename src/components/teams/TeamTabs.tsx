"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type TeamTabsProps = {
  activeTab: TabId;
};

export function TeamTabs({ activeTab }: TeamTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchTab(tab: TabId) {
    const p = new URLSearchParams(searchParams);
    p.set("tab", tab);
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="flex border-b border-border bg-white">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => switchTab(t.id)}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
            t.id === activeTab
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
