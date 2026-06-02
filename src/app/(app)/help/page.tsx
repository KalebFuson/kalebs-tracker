import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Help" };

function HelpList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-700">
      {children}
    </ul>
  );
}

function HelpParagraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-gray-700">{children}</p>;
}

export default function HelpPage() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Help &amp; Getting Started</h1>
          <p className="mt-1 text-sm text-gray-600">
            How to use Kalebs Tracker — tasks, teams, calendar, and permissions.
          </p>
        </div>

        <Card className="bg-white shadow-xs">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-gray-900">
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <HelpParagraph>
              Kalebs Tracker helps you track tasks across all your teams.
            </HelpParagraph>
            <HelpParagraph>
              When you first sign up, you&apos;ll either create a new organization (becoming
              its admin) or accept an invite to join an existing one.
            </HelpParagraph>
            <HelpParagraph>
              New here? You can replay the welcome tour anytime from the &quot;Take the
              tour&quot; option in the top bar.
            </HelpParagraph>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xs">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-gray-900">
              Creating Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">A single task</h3>
              <HelpParagraph>
                Click &quot;Create Task&quot; (sidebar) → &quot;Create a Single Task.&quot; Fill
                in a title (required), and optionally a description, team, assignee, due date,
                status, and priority. New tasks default to &quot;To Do&quot; status and
                &quot;Medium&quot; priority, assigned to you.
              </HelpParagraph>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Multiple tasks with AI
              </h3>
              <HelpParagraph>
                Click &quot;Create Task&quot; → &quot;Create Multiple Tasks with Text &amp;
                AI.&quot; Paste notes, an email, or a list (up to 10,000 characters), and the app
                extracts individual tasks for you to review and edit before saving. You can
                adjust each task&apos;s details, then confirm to create them all at once (up to
                50 at a time). Note: AI extraction is limited to 10 uses per minute and 100 per
                day.
              </HelpParagraph>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xs">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-gray-900">
              Editing Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <HelpList>
              <li>
                On the Tasks page, you can edit a task&apos;s assignee, due date, priority, and
                status directly inline.
              </li>
              <li>
                Click any task to open its full detail view, where you can also edit the title
                and description.
              </li>
              <li>Subtasks, tags, and task deletion are not yet available.</li>
            </HelpList>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xs">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-gray-900">
              Tasks &amp; Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <HelpList>
              <li>
                The Tasks page shows your tasks with filters: All, My Tasks, or by team. You can
                search by title.
              </li>
              <li>
                The Calendar shows tasks by their due date (month, week, or day view). Tasks
                without a due date won&apos;t appear on the calendar.
              </li>
              <li>
                On the dashboard, click any day in the mini-calendar to see that day&apos;s
                tasks.
              </li>
            </HelpList>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xs">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-gray-900">
              Who Can See Which Tasks
            </CardTitle>
            <CardDescription>Task visibility works as follows:</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <HelpList>
              <li>
                You can always see tasks <strong>assigned to you</strong> or{" "}
                <strong>created by you</strong>.
              </li>
              <li>
                You can see tasks belonging to <strong>any team you&apos;re a member of</strong>.
              </li>
              <li>
                <strong>Organization admins</strong> can see all tasks that belong to a team.
              </li>
              <li>
                A task with <strong>no team assigned</strong> is private — visible only to its
                creator and the person it&apos;s assigned to. (Even admins can&apos;t see these.)
              </li>
            </HelpList>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xs">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-gray-900">Teams</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <HelpList>
              <li>Browse your organization&apos;s teams on the Teams page.</li>
              <li>
                <strong>To join a team:</strong> click &quot;Request to Join&quot; on a team. A
                team admin (or an org admin) reviews and approves or denies your request. Once
                approved, you&apos;ll see that team&apos;s tasks.
              </li>
              <li>
                <strong>Org admins</strong> can create teams, add or remove members directly,
                and edit or delete teams.
              </li>
              <li>
                <strong>Team admins</strong> (and org admins) can approve or deny join requests
                for their team. The person who creates a team becomes its team admin.
              </li>
            </HelpList>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xs">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-gray-900">
              Roles &amp; Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-gray-900">Organization Member</h3>
              <HelpParagraph>
                Create and edit tasks, use AI extraction, view teams/people/calendar, and
                request to join teams.
              </HelpParagraph>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-gray-900">Organization Admin</h3>
              <HelpParagraph>
                Everything a member can do, plus invite people to the organization, manage
                member roles, create/edit/delete teams, add/remove team members, and change team
                roles.
              </HelpParagraph>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-gray-900">Team Admin</h3>
              <HelpParagraph>
                Approve or deny join requests for their specific team. (This is separate from
                being an org admin.)
              </HelpParagraph>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xs">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-gray-900">
              Inviting People (Org Admins)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <HelpList>
              <li>
                Go to the People page → &quot;Invite New Members.&quot; Enter email addresses to
                generate invite links.
              </li>
              <li>
                Currently, invite links are generated for you to copy and share manually —
                automatic email delivery is coming soon.
              </li>
              <li>Invites expire after 7 days. You can revoke a pending invite anytime.</li>
            </HelpList>
          </CardContent>
        </Card>

        <Card className="border-dashed bg-muted/30 shadow-xs">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-gray-900">Coming Soon</CardTitle>
            <CardDescription>Features in progress</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <HelpParagraph>
              A few features are in progress and not yet available: global search,
              notifications, automatic invite emails, task tags and subtasks, and task
              deletion.
            </HelpParagraph>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
