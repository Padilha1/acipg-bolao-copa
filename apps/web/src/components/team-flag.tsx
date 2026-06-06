import type { TeamDto } from "@bolao-acipg/shared";
import { teamFlagUrl } from "../lib/flags";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TeamFlag({ team }: { team: TeamDto }) {
  const flagUrl = teamFlagUrl(team.fifaCode);

  if (!flagUrl) {
    return <span className="team-flag-fallback">{initials(team.name)}</span>;
  }

  return (
    <img alt={`Bandeira ${team.name}`} className="team-flag" src={flagUrl} />
  );
}
