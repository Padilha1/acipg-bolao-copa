import type { MatchDto } from "@bolao-acipg/shared";
import { Link } from "@tanstack/react-router";
import { TeamFlag } from "../components/team-flag";
import { useMatches, useMe, usePredictions, useRanking } from "../lib/queries";

function formatHour(value: string) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("hour")}:${get("minute")}`;
}

function dateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatRelativeMatchTime(value: string) {
  const date = new Date(value);
  const today = dateKey(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const matchDay = dateKey(date);

  if (matchDay === today) return `Hoje, ${formatHour(value)}`;
  if (matchDay === dateKey(tomorrow)) return `Amanhã • ${formatHour(value)}`;

  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);

  return `${day} • ${formatHour(value)}`;
}

function CompactMatchCard({ match }: { match: MatchDto }) {
  return (
    <article className="home-next-card">
      <div className="home-next-meta">
        <span>Grupo {match.homeTeam.group ?? "-"}</span>
        <strong>{formatRelativeMatchTime(match.startsAt)}</strong>
      </div>
      <div className="home-next-fixture">
        <div>
          <TeamFlag team={match.homeTeam} />
          <span>{match.homeTeam.name}</span>
        </div>
        <strong>VS</strong>
        <div>
          <TeamFlag team={match.awayTeam} />
          <span>{match.awayTeam.name}</span>
        </div>
      </div>
      <Link className="home-card-action" to="/matches">
        Palpitar agora ›
      </Link>
    </article>
  );
}

function ResultCard({ match }: { match: MatchDto }) {
  return (
    <article className="home-result-card">
      <TeamFlag team={match.homeTeam} />
      <strong>{match.homeTeam.fifaCode}</strong>
      <b>{match.homeScore}</b>
      <span>Finalizado</span>
      <b>{match.awayScore}</b>
      <strong>{match.awayTeam.fifaCode}</strong>
      <TeamFlag team={match.awayTeam} />
    </article>
  );
}

export function HomePage() {
  const me = useMe();
  const ranking = useRanking();
  const matches = useMatches();
  const predictions = usePredictions();
  const myEntryId = me.data?.entry?.id;
  const myPosition = ranking.data?.find((row) => row.entryId === myEntryId);
  const topRanking = ranking.data?.slice(0, 5) ?? [];
  const nextMatches =
    matches.data
      ?.filter((match) => new Date(match.startsAt) > new Date())
      .slice(0, 2) ?? [];
  const nextMatch = nextMatches[0];
  const recentResults =
    matches.data
      ?.filter((match) => match.status === "finished")
      .slice(-2)
      .reverse() ?? [];

  return (
    <section className="home-screen">
      <div className="home-status-card">
        <div>
          <p>Status do competidor</p>
          <div className="home-status-grid">
            <div>
              <span>Sua Posição</span>
              <strong>{myPosition ? `${myPosition.position}º` : "-"}</strong>
            </div>
            <div>
              <span>Pontos Totais</span>
              <strong>{myPosition?.points ?? 0}</strong>
            </div>
          </div>
        </div>
        <div className="home-status-footer">
          <span>↗ campanha ativa</span>
          <Link to="/ranking">Detalhes</Link>
        </div>
      </div>

      <section className="home-panel">
        <h2>⌁ Previsão</h2>
        <div className="home-forecast-row">
          <span>Próximo Jogo</span>
          <strong>
            {nextMatch ? formatRelativeMatchTime(nextMatch.startsAt) : "-"}
          </strong>
        </div>
        <div className="home-forecast-row">
          <span>Palpites Ativos</span>
          <strong>
            {String(predictions.data?.length ?? 0).padStart(2, "0")}
          </strong>
        </div>
        <Link className="home-outline-action" to="/matches">
          Meus palpites
        </Link>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <h2>▥ Top 5 Ranking</h2>
          <Link to="/ranking">Ver Ranking Completo</Link>
        </div>
        <div className="home-ranking-card">
          <div className="home-ranking-head">
            <span>Pos</span>
            <span>Nome</span>
            <span>Pts</span>
          </div>
          {topRanking.map((row) => (
            <div
              className={
                row.entryId === myEntryId
                  ? "home-ranking-row is-me"
                  : "home-ranking-row"
              }
              key={row.entryId}
            >
              <strong>{row.position}º</strong>
              <span>{row.name}</span>
              <b>{row.points}</b>
            </div>
          ))}
          {topRanking.length === 0 ? (
            <p className="home-empty-row">Ranking ainda sem pontuação.</p>
          ) : null}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <h2>▣ Próximos Jogos</h2>
          <Link to="/matches">Ver todos</Link>
        </div>
        <div className="home-next-list">
          {nextMatches.map((match) => (
            <CompactMatchCard key={match.id} match={match} />
          ))}
          {nextMatches.length === 0 ? (
            <p className="home-empty-card">Nenhum jogo aberto no momento.</p>
          ) : null}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <h2>↺ Resultados Recentes</h2>
        </div>
        <div className="home-results-list">
          {recentResults.map((match) => (
            <ResultCard key={match.id} match={match} />
          ))}
          {recentResults.length === 0 ? (
            <p className="home-empty-card">
              Resultados aparecem aqui após os jogos.
            </p>
          ) : null}
        </div>
      </section>

      <Link className="home-fab" aria-label="Novo palpite" to="/matches">
        ⊞
      </Link>
    </section>
  );
}
