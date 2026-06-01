import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PendingJoinRequest } from "@/types/teams";

import { PendingJoinRequestsList } from "./PendingJoinRequestsList";

type PendingJoinRequestsCardProps = {
  requests: PendingJoinRequest[];
};

export function PendingJoinRequestsCard({ requests }: PendingJoinRequestsCardProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold text-gray-900">Pending Requests</CardTitle>
        <p className="text-xs text-muted-foreground">
          Members waiting to join this team.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <PendingJoinRequestsList requests={requests} />
      </CardContent>
    </Card>
  );
}
