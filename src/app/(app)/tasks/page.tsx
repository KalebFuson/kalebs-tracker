import { redirect } from "next/navigation";

import { TasksFilterBar } from "@/components/tasks/TasksFilterBar";
import { TasksPageHeader } from "@/components/tasks/TasksPageHeader";
import { TasksTable } from "@/components/tasks/TasksTable";
import { createClient } from "@/lib/supabase/server";
import { buildTasksUrl } from "@/lib/tasks/build-url";
import {
  getOrgMembers,
  getTasksForOrg,
  getUserTeamsForOrg,
} from "@/lib/tasks/queries";
import type { SortOption } from "@/types/tasks";

const DEFAULT_PAGE_SIZE = 10;
const VALID_SORTS: SortOption[] = [
  "due_date_asc",
  "due_date_desc",
  "priority",
  "status",
  "created_at",
];

type TasksPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;

  // Parse search params
  const rawFilter = String(params.filter ?? "all");
  const filter = rawFilter;
  const rawSort = String(params.sort ?? "due_date_asc");
  const sort: SortOption = VALID_SORTS.includes(rawSort as SortOption)
    ? (rawSort as SortOption)
    : "due_date_asc";
  const page = Math.max(1, parseInt(String(params.page ?? "1"), 10) || 1);
  const search = String(params.search ?? "").trim();
  const taskParam = String(params.task ?? "").trim();
  // Keep selectedTaskNumber so pagination links preserve ?task= while browsing pages
  const selectedTaskNumber = taskParam ? parseInt(taskParam, 10) : null;

  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Org
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, organizations(id, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.org_id) redirect("/onboarding");

  const orgId = membership.org_id;
  const orgRelation = membership.organizations;
  const org = Array.isArray(orgRelation) ? orgRelation[0] : orgRelation;
  const orgSlug = (org as { slug: string } | null)?.slug ?? "";

  // Parallel data fetches
  const [teamsResult, tasksResult, orgMembers] = await Promise.all([
    getUserTeamsForOrg(orgId, user.id),
    getTasksForOrg(orgId, user.id, { filter, sort, page, search, pageSize: DEFAULT_PAGE_SIZE }),
    getOrgMembers(orgId),
  ]);

  // Serializable params object — safe to pass as a prop to client components
  const urlParams = { filter, sort, search, page, task: selectedTaskNumber };

  // Pagination URLs
  const hasPrev = page > 1;
  const hasNext = page * DEFAULT_PAGE_SIZE < tasksResult.total;
  const prevPageHref = hasPrev ? buildTasksUrl(urlParams, { page: String(page - 1) }) : null;
  const nextPageHref = hasNext ? buildTasksUrl(urlParams, { page: String(page + 1) }) : null;

  return (
    <div className="flex flex-col gap-5 p-6">
      <TasksPageHeader />

      <TasksFilterBar
        teams={teamsResult}
        urlParams={urlParams}
      />

      <TasksTable
        tasks={tasksResult.tasks}
        total={tasksResult.total}
        pageSize={DEFAULT_PAGE_SIZE}
        orgSlug={orgSlug}
        urlParams={urlParams}
        prevPageHref={prevPageHref}
        nextPageHref={nextPageHref}
        orgMembers={orgMembers}
        currentUserId={user.id}
      />
      {/* TaskDetailSheet is now rendered globally in (app)/layout.tsx */}
    </div>
  );
}
