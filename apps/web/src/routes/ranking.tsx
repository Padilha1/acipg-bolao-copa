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

function fallbackRows(): RankingRow[] {
  return [
    {
      position: 1,
      entryId: "demo-1",
      userId: "demo-1",
      name: "Carla Mendes",
      points: 158,
    },
    {
      position: 2,
      entryId: "demo-2",
      userId: "demo-2",
      name: "Ricardo M.",
      points: 142,
    },
    {
      position: 3,
      entryId: "demo-3",
      userId: "demo-3",
      name: "Fabio L.",
      points: 138,
    },
    {
      position: 4,
      entryId: "demo-4",
      userId: "demo-4",
      name: "Guilherme S.",
      points: 135,
    },
    {
      position: 5,
      entryId: "demo-5",
      userId: "demo-5",
      name: "Beatriz Santos",
      points: 132,
    },
    {
      position: 6,
      entryId: "demo-6",
      userId: "demo-6",
      name: "Rodrigo Mello",
      points: 130,
    },
    {
      position: 7,
      entryId: "demo-7",
      userId: "demo-7",
      name: "Luciana Costa",
      points: 128,
    },
    {
      position: 8,
      entryId: "demo-8",
      userId: "demo-8",
      name: "Helio Junior",
      points: 125,
    },
    {
      position: 9,
      entryId: "demo-9",
      userId: "demo-9",
      name: "Marcos Paulo",
      points: 122,
    },
    {
      position: 10,
      entryId: "demo-10",
      userId: "demo-10",
      name: "Patricia K.",
      points: 120,
    },
  ];
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
  const rows =
    ranking.data && ranking.data.length > 0 ? ranking.data : fallbackRows();
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
          ...rows.slice(3, 10),
        ]
      : rows.slice(3, 10);

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

      <div className="ranking-card">
        <div className="ranking-head">
          <span>#</span>
          <span>Participante</span>
          <span>Pts</span>
        </div>
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
