import type { MatchDto, PredictionDto } from "@bolao-acipg/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { KnockoutBracket } from "../components/knockout-bracket";
import { TeamFlag } from "../components/team-flag";
import { Loader } from "../components/ui/loader";
import { apiClient } from "../lib/api";
import { useMatches, usePredictions } from "../lib/queries";

type ScoreDraft = {
  homeScore: number | null;
  awayScore: number | null;
};

const PHASE_TABS = [
  { phase: "group", label: "Fase de Grupos" },
  { phase: "round_32", label: "16 avos" },
  { phase: "round_16", label: "Oitavas" },
  { phase: "quarter", label: "Quartas" },
  { phase: "semi", label: "Semifinais" },
  { phase: "final", label: "Final" },
] as const;

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

type CompleteScoreDraft = {
  homeScore: number;
  awayScore: number;
};

function getDefaultScore(prediction?: ScoreDraft) {
  if (prediction) return prediction;

  return { homeScore: null, awayScore: null };
}

function hasCompleteScore(score: ScoreDraft): score is CompleteScoreDraft {
  return score.homeScore !== null && score.awayScore !== null;
}

export function MatchesPage() {
  const matches = useMatches();
  const predictions = usePredictions();
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, ScoreDraft>>({});
  const [dayIndex, setDayIndex] = useState(0);
  const [activePhase, setActivePhase] =
    useState<(typeof PHASE_TABS)[number]["phase"]>("round_32");
  const hasAutoSelectedDay = useRef(false);

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

    for (const match of matches.data?.filter(
      (item) => item.phase === "group",
    ) ?? []) {
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

  useEffect(() => {
    if (hasAutoSelectedDay.current || groupedMatches.length === 0) return;

    const todayKey = getDayKey(new Date().toISOString());
    const todayIndex = groupedMatches.findIndex(
      (group) => group.key === todayKey,
    );
    const nextIndex = groupedMatches.findIndex((group) => group.key > todayKey);

    setDayIndex(
      todayIndex >= 0
        ? todayIndex
        : nextIndex >= 0
          ? nextIndex
          : groupedMatches.length - 1,
    );
    hasAutoSelectedDay.current = true;
  }, [groupedMatches]);

  const selectedDayIndex = Math.min(
    dayIndex,
    Math.max(groupedMatches.length - 1, 0),
  );
  const selectedGroup = groupedMatches[selectedDayIndex];

  const saveAll = useMutation({
    mutationFn: async () => {
      const openDrafts = Object.entries(scores).flatMap(
        ([matchId, score]): Array<[string, CompleteScoreDraft]> => {
          const match = matches.data?.find((item) => item.id === matchId);
          if (
            !match ||
            new Date(match.startsAt) <= new Date() ||
            match.status !== "scheduled"
          )
            return [];
          if (!hasCompleteScore(score)) return [];

          const saved = predictionByMatchId.get(matchId);
          const hasChanged =
            !saved ||
            saved.homeScore !== score.homeScore ||
            saved.awayScore !== score.awayScore;

          return hasChanged ? [[matchId, score]] : [];
        },
      );

      return Promise.all(
        openDrafts.map(([matchId, score]) =>
          apiClient.savePrediction(matchId, score.homeScore, score.awayScore),
        ),
      );
    },
    onSuccess: async (savedPredictions) => {
      queryClient.setQueryData<PredictionDto[]>(["predictions"], (current) => {
        const currentByMatch = new Map(
          (current ?? []).map((prediction) => [prediction.matchId, prediction]),
        );

        for (const prediction of savedPredictions) {
          currentByMatch.set(prediction.matchId, prediction);
        }

        return [...currentByMatch.values()];
      });
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
        [side]: current[side] === null ? 0 : clampScore(current[side] + delta),
      },
    }));
  }

  const hasOpenDrafts = Object.entries(scores).some(([matchId, score]) => {
    const match = matches.data?.find((item) => item.id === matchId);
    if (
      !match ||
      new Date(match.startsAt) <= new Date() ||
      match.status !== "scheduled"
    )
      return false;
    if (!hasCompleteScore(score)) return false;

    const saved = predictionByMatchId.get(matchId);
    return (
      !saved ||
      saved.homeScore !== score.homeScore ||
      saved.awayScore !== score.awayScore
    );
  });

  if (matches.isLoading || predictions.isLoading) {
    return (
      <section className="matches-screen matches-loading">
        <Loader />
      </section>
    );
  }

  return (
    <section className="matches-screen">
      <div className="match-tabs" aria-label="Fases da Copa">
        {PHASE_TABS.map((tab) => {
          const isAvailable =
            tab.phase === "group" ||
            (matches.data ?? []).some(
              (match) =>
                match.phase === tab.phase &&
                match.homeTeam !== null &&
                match.awayTeam !== null,
            );

          return (
            <button
              className={
                activePhase === tab.phase
                  ? "match-tab match-tab-active"
                  : "match-tab"
              }
              disabled={!isAvailable}
              key={tab.phase}
              onClick={() => setActivePhase(tab.phase)}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activePhase !== "group" ? (
        <KnockoutBracket
          matches={(matches.data ?? []).filter(
            (match) => match.phase !== "group",
          )}
          predictions={predictions.data ?? []}
        />
      ) : null}

      {activePhase === "group" && selectedGroup ? (
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
                if (!match.homeTeam || !match.awayTeam) return null;
                const prediction = predictionByMatchId.get(match.id);
                const current = scores[match.id] ?? getDefaultScore(prediction);
                const isLocked =
                  new Date(match.startsAt) <= new Date() ||
                  match.status !== "scheduled";
                const hasPrediction = Boolean(prediction);
                const isFinished = match.status === "finished";
                const isSaving =
                  saveAll.isPending &&
                  Boolean(scores[match.id]) &&
                  hasCompleteScore(current) &&
                  (!prediction ||
                    prediction.homeScore !== current.homeScore ||
                    prediction.awayScore !== current.awayScore);

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
                          : isSaving
                            ? "Salvando..."
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
                          <strong>{current.homeScore ?? "-"}</strong>
                          <button
                            aria-label={`Diminuir gols de ${match.homeTeam.name}`}
                            disabled={
                              isLocked ||
                              current.homeScore === null ||
                              current.homeScore <= 0
                            }
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
                          <strong>{current.awayScore ?? "-"}</strong>
                          <button
                            aria-label={`Diminuir gols de ${match.awayTeam.name}`}
                            disabled={
                              isLocked ||
                              current.awayScore === null ||
                              current.awayScore <= 0
                            }
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

                    {isFinished ? (
                      <div className="bet-result-summary">
                        {match.homeScore !== null &&
                        match.awayScore !== null ? (
                          <div className="bet-final-result">
                            <span>Resultado final:</span>
                            <strong>
                              {match.homeScore} x {match.awayScore}
                            </strong>
                          </div>
                        ) : null}
                        {prediction ? (
                          <div className="bet-points">
                            + {prediction.points} Pontos Conquistados
                          </div>
                        ) : (
                          <div className="bet-points">Sem palpite salvo</div>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : activePhase === "group" ? (
        <p className="home-empty-card">Nenhum jogo cadastrado.</p>
      ) : null}

      {activePhase === "group" ? (
        <button
          className="save-all-bets"
          disabled={!hasOpenDrafts || saveAll.isPending}
          onClick={() => saveAll.mutate()}
          type="button"
        >
          {saveAll.isPending ? "Salvando..." : "▣ Salvar Todos os Palpites"}
        </button>
      ) : null}
    </section>
  );
}
