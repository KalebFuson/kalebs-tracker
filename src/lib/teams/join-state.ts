export type TeamJoinState = "member" | "pending" | "none";

export function getTeamJoinState(
  teamId: string,
  memberTeamIds: string[],
  pendingTeamIds: string[],
): TeamJoinState {
  if (memberTeamIds.includes(teamId)) return "member";
  if (pendingTeamIds.includes(teamId)) return "pending";
  return "none";
}
