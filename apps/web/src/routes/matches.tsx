import type { MatchDto } from "@bolao-acipg/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { TeamFlag } from "../components/team-flag";
import { apiClient } from "../lib/api";
import { useMatches, usePredictions } from "../lib/queries";

type ScoreDraft = {
  homeScore: number;
  awayScore: number;
};

const PHASE_TABS = [
  "Fase de Grupos",
  "Oitavas de Final",
  "Quartas",
  "Semifinal",
  "Final",
];

function formatMatchDay(value: string) {
  const date = new Date(value);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
    weekday: "long",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatMatchHour(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("hour")}:${get("minute")}`;
}

function getDayKey(value: string) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(99, value));
}

function getDefaultScore(match: MatchDto, prediction?: ScoreDraft) {
  if (prediction) return prediction;

  if (
    match.status === "finished" &&
    match.homeScore !== null &&
    match.awayScore !== null
  ) {
    return {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    };
  }

  return { homeScore: 0, awayScore: 0 };
}

export function MatchesPage() {
  const matches = useMatches();
  const predictions = usePredictions();
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, ScoreDraft>>({});
  const [dayIndex, setDayIndex] = useState(0);

  const predictionByMatchId = useMemo(
    () =>
      new Map(
        predictions.data?.map((prediction) => [
          prediction.matchId,
          prediction,
        ]) ?? [],
      ),
    [predictions.data],
  );

  const groupedMatches = useMemo(() => {
    const groups = new Map<string, MatchDto[]>();

    for (const match of matches.data ?? []) {
      const key = getDayKey(match.startsAt);
      groups.set(key, [...(groups.get(key) ?? []), match]);
    }

    return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, items]) => ({
        key,
        label: formatMatchDay(items[0].startsAt),
        matches: items.sort(
          (left, right) =>
            new Date(left.startsAt).getTime() -
            new Date(right.startsAt).getTime(),
        ),
      }));
  }, [matches.data]);
  const selectedDayIndex = Math.min(
    dayIndex,
    Math.max(groupedMatches.length - 1, 0),
  );
  const selectedGroup = groupedMatches[selectedDayIndex];

  const saveAll = useMutation({
    mutationFn: async () => {
      const openDrafts = Object.entries(scores).filter(([matchId, score]) => {
        const match = matches.data?.find((item) => item.id === matchId);
        if (!match || new Date(match.startsAt) <= new Date()) return false;

        const saved = predictionByMatchId.get(matchId);
        return (
          !saved ||
          saved.homeScore !== score.homeScore ||
          saved.awayScore !== score.awayScore
        );
      });

      await Promise.all(
        openDrafts.map(([matchId, score]) =>
          apiClient.savePrediction(matchId, score.homeScore, score.awayScore),
        ),
      );
    },
    onSuccess: async () => {
      setScores({});
      await queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
  });

  function setScore(
    matchId: string,
    current: ScoreDraft,
    side: keyof ScoreDraft,
    delta: number,
  ) {
    setScores((value) => ({
      ...value,
      [matchId]: {
        ...current,
        [side]: clampScore(current[side] + delta),
      },
    }));
  }

  const hasOpenDrafts = Object.entries(scores).some(([matchId, score]) => {
    const match = matches.data?.find((item) => item.id === matchId);
    if (!match || new Date(match.startsAt) <= new Date()) return false;

    const saved = predictionByMatchId.get(matchId);
    return (
      !saved ||
      saved.homeScore !== score.homeScore ||
      saved.awayScore !== score.awayScore
    );
  });

  return (
    <section className="matches-screen">
      <div className="match-tabs" aria-label="Fases da Copa">
        {PHASE_TABS.map((tab, index) => (
          <button
            className={index === 0 ? "match-tab match-tab-active" : "match-tab"}
            disabled={index > 0}
            key={tab}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {selectedGroup ? (
        <>
          <div className="match-day-pager">
            <button
              disabled={selectedDayIndex === 0}
              onClick={() => setDayIndex((value) => Math.max(value - 1, 0))}
              type="button"
            >
              ‹ Anterior
            </button>
            <span>
              Dia {selectedDayIndex + 1} de {groupedMatches.length}
            </span>
            <button
              disabled={selectedDayIndex >= groupedMatches.length - 1}
              onClick={() =>
                setDayIndex((value) =>
                  Math.min(value + 1, groupedMatches.length - 1),
                )
              }
              type="button"
            >
              Próximo ›
            </button>
          </div>

          <section className="match-day" key={selectedGroup.key}>
            <div className="match-day-title">
              <h2>{selectedGroup.label}</h2>
            </div>

            <div className="match-card-list">
              {selectedGroup.matches.map((match) => {
                const prediction = predictionByMatchId.get(match.id);
                const current =
                  scores[match.id] ?? getDefaultScore(match, prediction);
                const isLocked = new Date(match.startsAt) <= new Date();
                const hasPrediction = Boolean(prediction);
                const isFinished = match.status === "finished";

                return (
                  <article
                    className={
                      isLocked
                        ? "bet-card bet-card-locked"
                        : "bet-card bet-card-open"
                    }
                    key={match.id}
                  >
                    <header className="bet-card-header">
                      <span
                        className={
                          isLocked ? "bet-badge bet-badge-muted" : "bet-badge"
                        }
                      >
                        Grupo {match.homeTeam.group ?? "-"} •{" "}
                        {formatMatchHour(match.startsAt)}
                      </span>
                      <span className="bet-status">
                        {isLocked
                          ? "▣ Encerrado"
                          : hasPrediction
                            ? "◉ Palpite Salvo"
                            : "◴ Aberto"}
                      </span>
                    </header>

                    <div className="bet-match-grid">
                      <div className="bet-team">
                        <TeamFlag team={match.homeTeam} />
                        <span>{match.homeTeam.name}</span>
                      </div>

                      <div className="bet-score-board">
                        <div className="score-control">
                          <button
                            aria-label={`Aumentar gols de ${match.homeTeam.name}`}
                            disabled={isLocked}
                            onClick={() =>
                              setScore(match.id, current, "homeScore", 1)
                            }
                            type="button"
                          >
                            +
                          </button>
                          <strong>{current.homeScore}</strong>
                          <button
                            aria-label={`Diminuir gols de ${match.homeTeam.name}`}
                            disabled={isLocked || current.homeScore <= 0}
                            onClick={() =>
                              setScore(match.id, current, "homeScore", -1)
                            }
                            type="button"
                          >
                            -
                          </button>
                        </div>

                        <span className="score-separator">x</span>

                        <div className="score-control">
                          <button
                            aria-label={`Aumentar gols de ${match.awayTeam.name}`}
                            disabled={isLocked}
                            onClick={() =>
                              setScore(match.id, current, "awayScore", 1)
                            }
                            type="button"
                          >
                            +
                          </button>
                          <strong>{current.awayScore}</strong>
                          <button
                            aria-label={`Diminuir gols de ${match.awayTeam.name}`}
                            disabled={isLocked || current.awayScore <= 0}
                            onClick={() =>
                              setScore(match.id, current, "awayScore", -1)
                            }
                            type="button"
                          >
                            -
                          </button>
                        </div>
                      </div>

                      <div className="bet-team">
                        <TeamFlag team={match.awayTeam} />
                        <span>{match.awayTeam.name}</span>
                      </div>
                    </div>

                    {isFinished && prediction ? (
                      <div className="bet-points">
                        + {prediction.points} Pontos Conquistados
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <p className="home-empty-card">Nenhum jogo cadastrado.</p>
      )}

      <button
        className="save-all-bets"
        disabled={!hasOpenDrafts || saveAll.isPending}
        onClick={() => saveAll.mutate()}
        type="button"
      >
        ▣ Salvar Todos os Palpites
      </button>
    </section>
  );
}
