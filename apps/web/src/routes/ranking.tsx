import { useMe, useRanking } from "../lib/queries";

type RankingRow = {
  position: number;
  entryId: string;
  userId: string;
  name: string;
  points: number;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function TopPlayer({
  row,
  variant,
}: {
  row: RankingRow;
  variant: "first" | "side";
}) {
  const isFirst = variant === "first";

  return (
    <div className={`top-player top-player-${variant}`}>
      <div className="top-avatar-wrap">
        <div className="top-avatar">{initials(row.name)}</div>
        <span className="top-medal">{row.position}</span>
      </div>
      <div className="top-score-card">
        {isFirst ? <span className="winner-label">Líder</span> : null}
        <strong>{row.name}</strong>
        <span className="top-points">{row.points}</span>
        {isFirst ? <span className="points-label">Pontos</span> : null}
      </div>
    </div>
  );
}

export function RankingPage() {
  const me = useMe();
  const ranking = useRanking();
  const rows = ranking.data ?? [];
  const myEntryId = me.data?.entry?.id;
  const hasMeInRanking = rows.some((row) => row.entryId === myEntryId);
  const myFallbackPosition = rows.length + 1;
  const tableRows =
    myEntryId && !hasMeInRanking && me.data?.user
      ? [
          {
            position: myFallbackPosition,
            entryId: myEntryId,
            userId: me.data.user.id,
            name: me.data.user.name ?? me.data.user.email,
            points: me.data.entry?.points ?? 0,
          },
          ...rows.slice(3),
        ]
      : rows.slice(3);

  return (
    <section className="home-screen">
      <h1 className="section-title">Top 3 Participantes</h1>

      <div className="podium">
        {rows[1] ? <TopPlayer row={rows[1]} variant="side" /> : null}
        {rows[0] ? <TopPlayer row={rows[0]} variant="first" /> : null}
        {rows[2] ? <TopPlayer row={rows[2]} variant="side" /> : null}
      </div>

      <div className="ranking-tabs" aria-label="Filtros do ranking">
        <button className="ranking-tab is-active" type="button">
          Geral
        </button>
        <button className="ranking-tab" type="button">
          Fase de Grupos
        </button>
        <button className="ranking-tab" type="button">
          Mata-mata
        </button>
      </div>

      <section className="home-sponsors" aria-label="Nossos patrocinadores">
        <span>Nossos patrocinadores</span>
        <div className="home-sponsor-list">
          <img src="/mudra.png" alt="Mudra" />
          <img src="/pacoloco.png" alt="Paco Loco" />
          <img src="/stelarosa.jpeg" alt="Stela Rosa" />
          <img src="/kellner store.png" alt="Kellner Store" />
        </div>
      </section>

      <div className="ranking-card">
        <div className="ranking-head">
          <span>#</span>
          <span>Participante</span>
          <span>Pts</span>
        </div>
        {tableRows.length === 0 ? (
          <p className="home-empty-card">Ranking ainda sem pontuação.</p>
        ) : null}
        {tableRows.map((row) => {
          const isMe = row.entryId === myEntryId;
          return (
            <div
              className={`ranking-row ${isMe ? "is-me" : ""}`}
              key={row.entryId}
            >
              <span className="ranking-position">{row.position}</span>
              <div className="ranking-person">
                <span className={`ranking-avatar ${isMe ? "is-me" : ""}`}>
                  {isMe ? "Você" : initials(row.name)}
                </span>
                <span className="ranking-name">{row.name}</span>
              </div>
              <strong className="ranking-points">{row.points}</strong>
            </div>
          );
        })}
      </div>

      <aside className="ranking-note">
        <span className="note-icon">i</span>
        <p>
          Os pontos são atualizados após o lançamento dos resultados. Critérios
          de desempate: 1. Placar exato; 2. Acerto do vencedor ou empate; 3.
          Acertos de gols.
        </p>
      </aside>
    </section>
  );
}
