import type { MatchDto } from "@bolao-acipg/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { TeamFlag } from "../components/team-flag";
import { apiClient } from "../lib/api";
import { useMatches, useMe, useRounds, useTeams } from "../lib/queries";

const ADMIN_EMAIL = "padilha.matheus@hotmail.com";

type ResultDraft = {
  homeScore: string;
  awayScore: string;
};

function formatAdminDate(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value.replace(".", "") ?? "";

  return `${get("day")} ${get("month")}, ${get("hour")}:${get("minute")}`;
}

function groupLabel(match: MatchDto) {
  return `Grupo ${match.homeTeam.group ?? "-"}`;
}

export function AdminPage() {
  const me = useMe();
  const rounds = useRounds();
  const teams = useTeams();
  const matches = useMatches();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [round, setRound] = useState({ name: "", kind: "group", order: "1" });
  const [match, setMatch] = useState({
    roundId: "",
    homeTeamId: "",
    awayTeamId: "",
    startsAt: "",
  });
  const [resultDrafts, setResultDrafts] = useState<Record<string, ResultDraft>>(
    {},
  );

  const canAccessAdmin = me.data?.user.email.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    if (me.data && !canAccessAdmin) {
      navigate({ to: "/" });
    }
  }, [canAccessAdmin, me.data, navigate]);

  const invalidateAdminData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rounds"] }),
      queryClient.invalidateQueries({ queryKey: ["matches"] }),
      queryClient.invalidateQueries({ queryKey: ["ranking"] }),
    ]);
  };

  const createRound = useMutation({
    mutationFn: () =>
      apiClient.createRound({ ...round, order: Number(round.order) }),
    onSuccess: async () => {
      setRound({ name: "", kind: "group", order: "1" });
      setShowRoundForm(false);
      await invalidateAdminData();
    },
  });

  const createMatch = useMutation({
    mutationFn: () =>
      apiClient.createMatch({
        ...match,
        startsAt: new Date(match.startsAt).toISOString(),
      }),
    onSuccess: async () => {
      setMatch({ roundId: "", homeTeamId: "", awayTeamId: "", startsAt: "" });
      setShowMatchForm(false);
      await invalidateAdminData();
    },
  });

  const updateResult = useMutation({
    mutationFn: (input: {
      matchId: string;
      homeScore: number;
      awayScore: number;
    }) =>
      apiClient.updateResult(input.matchId, {
        homeScore: input.homeScore,
        awayScore: input.awayScore,
      }),
    onSuccess: invalidateAdminData,
  });

  const recalculateAll = useMutation({
    mutationFn: async () => {
      const finishedMatches =
        matches.data?.filter(
          (item) => item.homeScore !== null && item.awayScore !== null,
        ) ?? [];

      await Promise.all(
        finishedMatches.map((item) => apiClient.recalculate(item.id)),
      );
    },
    onSuccess: invalidateAdminData,
  });

  const matchesByRound = useMemo(() => {
    const count = new Map<string, number>();
    for (const item of matches.data ?? []) {
      count.set(item.roundId, (count.get(item.roundId) ?? 0) + 1);
    }
    return count;
  }, [matches.data]);

  const upcomingMatches =
    matches.data
      ?.filter((item) => new Date(item.startsAt) > new Date())
      .slice(0, 4) ?? [];

  const resultMatches =
    matches.data
      ?.filter((item) => new Date(item.startsAt) <= new Date())
      .slice()
      .sort(
        (left, right) =>
          new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime(),
      )
      .slice(0, 8) ?? [];

  function resultDraft(matchItem: MatchDto) {
    return (
      resultDrafts[matchItem.id] ?? {
        homeScore: matchItem.homeScore?.toString() ?? "",
        awayScore: matchItem.awayScore?.toString() ?? "",
      }
    );
  }

  function submitResult(event: FormEvent, matchItem: MatchDto) {
    event.preventDefault();
    const draft = resultDraft(matchItem);

    updateResult.mutate({
      matchId: matchItem.id,
      homeScore: Number(draft.homeScore),
      awayScore: Number(draft.awayScore),
    });
  }

  if (!canAccessAdmin) {
    return (
      <section className="admin-screen">
        <p className="home-empty-card">Acesso restrito ao administrador.</p>
      </section>
    );
  }

  return (
    <section className="admin-screen">
      <div className="admin-hero">
        <h1>Painel de Administração</h1>
        <p>Controle de rodadas, partidas e processamento de pontos.</p>
        <button
          disabled={recalculateAll.isPending}
          onClick={() => recalculateAll.mutate()}
          type="button"
        >
          ↻ Recalcular pontos
        </button>
      </div>

      <section className="admin-section">
        <div className="admin-section-title">
          <h2>▦ Rodadas</h2>
          <button
            type="button"
            onClick={() => setShowRoundForm((value) => !value)}
          >
            + Nova Rodada
          </button>
        </div>

        {showRoundForm ? (
          <form
            className="admin-form-card"
            onSubmit={(event) => {
              event.preventDefault();
              createRound.mutate();
            }}
          >
            <input
              placeholder="Nome da rodada"
              required
              value={round.name}
              onChange={(event) =>
                setRound({ ...round, name: event.target.value })
              }
            />
            <select
              value={round.kind}
              onChange={(event) =>
                setRound({ ...round, kind: event.target.value })
              }
            >
              <option value="group">Fase de Grupos</option>
              <option value="round_32">32 avos</option>
              <option value="round_16">Oitavas</option>
              <option value="quarter">Quartas</option>
              <option value="semi">Semifinal</option>
              <option value="final">Final</option>
            </select>
            <input
              inputMode="numeric"
              placeholder="Ordem"
              required
              value={round.order}
              onChange={(event) =>
                setRound({ ...round, order: event.target.value })
              }
            />
            <button disabled={createRound.isPending} type="submit">
              Salvar rodada
            </button>
          </form>
        ) : null}

        <div className="admin-list">
          {rounds.data?.slice(0, 4).map((item, index) => (
            <article className="admin-round-card" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.kind === "group" ? "Fase de Grupos" : item.kind} •{" "}
                  {matchesByRound.get(item.id) ?? 0} partidas
                </span>
              </div>
              <span
                className={index === 0 ? "admin-pill active" : "admin-pill"}
              >
                {index === 0 ? "Ativa" : "Pendente"}
              </span>
              <button aria-label="Editar rodada" type="button">
                ✎
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-title">
          <h2>⚽ Partidas</h2>
          <button
            type="button"
            onClick={() => setShowMatchForm((value) => !value)}
          >
            + Adicionar Jogo
          </button>
        </div>

        {showMatchForm ? (
          <form
            className="admin-form-card"
            onSubmit={(event) => {
              event.preventDefault();
              createMatch.mutate();
            }}
          >
            <select
              required
              value={match.roundId}
              onChange={(event) =>
                setMatch({ ...match, roundId: event.target.value })
              }
            >
              <option value="">Rodada</option>
              {rounds.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              required
              value={match.homeTeamId}
              onChange={(event) =>
                setMatch({ ...match, homeTeamId: event.target.value })
              }
            >
              <option value="">Mandante</option>
              {teams.data?.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <select
              required
              value={match.awayTeamId}
              onChange={(event) =>
                setMatch({ ...match, awayTeamId: event.target.value })
              }
            >
              <option value="">Visitante</option>
              {teams.data?.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <input
              required
              type="datetime-local"
              value={match.startsAt}
              onChange={(event) =>
                setMatch({ ...match, startsAt: event.target.value })
              }
            />
            <button disabled={createMatch.isPending} type="submit">
              Salvar jogo
            </button>
          </form>
        ) : null}

        <div className="admin-list">
          {upcomingMatches.map((item) => (
            <article className="admin-match-card" key={item.id}>
              <div className="admin-match-meta">
                <strong>
                  ID: #{item.id} • {formatAdminDate(item.startsAt)}
                </strong>
                <button aria-label="Mais opções" type="button">
                  ⋮
                </button>
              </div>
              <div className="admin-match-row">
                <span>{item.homeTeam.name}</span>
                <b>VS</b>
                <span>{item.awayTeam.name}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-title">
          <h2>☑ Resultados Oficiais</h2>
        </div>

        <div className="admin-result-list">
          {resultMatches.map((item) => {
            const draft = resultDraft(item);
            const isSaved = item.status === "finished";

            return (
              <form
                className="admin-result-card"
                key={item.id}
                onSubmit={(event) => submitResult(event, item)}
              >
                <div className="admin-result-head">
                  <span>
                    {groupLabel(item)} •{" "}
                    {formatAdminDate(item.startsAt)} •{" "}
                    {isSaved ? "Encerrado" : "Em andamento"}
                  </span>
                  <strong className={isSaved ? "" : "pending"}>
                    {isSaved ? "Salvo" : "Pendente"}
                  </strong>
                </div>

                <div className="admin-result-score">
                  <div>
                    <TeamFlag team={item.homeTeam} />
                    <input
                      inputMode="numeric"
                      placeholder="-"
                      value={draft.homeScore}
                      onChange={(event) =>
                        setResultDrafts((value) => ({
                          ...value,
                          [item.id]: {
                            ...draft,
                            homeScore: event.target.value,
                          },
                        }))
                      }
                    />
                    <span>{item.homeTeam.fifaCode}</span>
                  </div>
                  <b>X</b>
                  <div>
                    <TeamFlag team={item.awayTeam} />
                    <input
                      inputMode="numeric"
                      placeholder="-"
                      value={draft.awayScore}
                      onChange={(event) =>
                        setResultDrafts((value) => ({
                          ...value,
                          [item.id]: {
                            ...draft,
                            awayScore: event.target.value,
                          },
                        }))
                      }
                    />
                    <span>{item.awayTeam.fifaCode}</span>
                  </div>
                </div>

                <button disabled={updateResult.isPending} type="submit">
                  {isSaved ? "Atualizar" : "Salvar Resultado"}
                </button>
              </form>
            );
          })}
          {resultMatches.length === 0 ? (
            <p className="home-empty-card">
              Resultados ficam disponíveis depois do início das partidas.
            </p>
          ) : null}
        </div>
      </section>

      <aside className="admin-system-card">
        <span>ⓘ</span>
        <p>
          Último recalcular pontos: <strong>agora</strong>
          <small>Sistema operando normalmente</small>
        </p>
        <button aria-label="Exportar" type="button">
          ⇩
        </button>
        <button aria-label="Configurações" type="button">
          ⚙
        </button>
      </aside>
    </section>
  );
}
