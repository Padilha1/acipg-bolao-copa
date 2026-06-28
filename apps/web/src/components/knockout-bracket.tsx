import type { MatchDto, PredictionDto, TeamDto } from "@bolao-acipg/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiClient } from "../lib/api";
import { TeamFlag } from "./team-flag";

type Draft = {
  homeScore: number | null;
  awayScore: number | null;
  qualifiedTeamId: string | null;
};

const STAGES = [
  { phase: "round_32", label: "16 avos" },
  { phase: "round_16", label: "Oitavas" },
  { phase: "quarter", label: "Quartas" },
  { phase: "semi", label: "Semifinais" },
  { phase: "final", label: "Final" },
] as const;

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  })
    .format(new Date(value))
    .replace(".", "");
}

function scoreWinner(draft: Draft) {
  if (draft.homeScore === null || draft.awayScore === null) return null;
  if (draft.homeScore === draft.awayScore) return null;
  return draft.homeScore > draft.awayScore ? "home" : "away";
}

export function KnockoutBracket({
  matches,
  predictions,
}: {
  matches: MatchDto[];
  predictions: PredictionDto[];
}) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [dragging, setDragging] = useState<{
    matchId: string;
    teamId: string;
  } | null>(null);
  const predictionByMatch = useMemo(
    () => new Map(predictions.map((item) => [item.matchId, item])),
    [predictions],
  );
  const matchById = useMemo(
    () => new Map(matches.map((match) => [match.id, match])),
    [matches],
  );

  function draftFor(match: MatchDto): Draft {
    const prediction = predictionByMatch.get(match.id);
    return (
      drafts[match.id] ?? {
        homeScore: prediction?.homeScore ?? null,
        awayScore: prediction?.awayScore ?? null,
        qualifiedTeamId: prediction?.qualifiedTeamId ?? null,
      }
    );
  }

  function sourcePreview(
    match: MatchDto,
    side: "home" | "away",
  ): TeamDto | null {
    const source = side === "home" ? match.homeSource : match.awaySource;
    if (!source) return null;
    const sourceMatch = matchById.get(source.matchId);
    if (!sourceMatch?.homeTeam || !sourceMatch.awayTeam) return null;
    const predictedId = draftFor(sourceMatch).qualifiedTeamId;
    if (!predictedId) return null;
    if (source.outcome === "winner") {
      return (
        [sourceMatch.homeTeam, sourceMatch.awayTeam].find(
          (team) => team.id === predictedId,
        ) ?? null
      );
    }
    return (
      [sourceMatch.homeTeam, sourceMatch.awayTeam].find(
        (team) => team.id !== predictedId,
      ) ?? null
    );
  }

  const save = useMutation({
    mutationFn: ({ match, draft }: { match: MatchDto; draft: Draft }) =>
      apiClient.savePrediction(
        match.id,
        draft.homeScore as number,
        draft.awayScore as number,
        draft.qualifiedTeamId,
      ),
    onSuccess: async (prediction) => {
      queryClient.setQueryData<PredictionDto[]>(["predictions"], (current) => {
        const next = new Map(
          (current ?? []).map((item) => [item.matchId, item]),
        );
        next.set(prediction.matchId, prediction);
        return [...next.values()];
      });
      setDrafts((current) => {
        const next = { ...current };
        delete next[prediction.matchId];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
  });

  function update(match: MatchDto, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [match.id]: { ...draftFor(match), ...patch },
    }));
  }

  function selectTeam(match: MatchDto, team: TeamDto) {
    if (new Date(match.startsAt) <= new Date() || match.status === "finished")
      return;
    const current = draftFor(match);
    const winner = scoreWinner(current);
    if (winner && match.homeTeam && match.awayTeam) {
      update(match, {
        qualifiedTeamId:
          winner === "home" ? match.homeTeam.id : match.awayTeam.id,
      });
      return;
    }
    update(match, { qualifiedTeamId: team.id });
  }

  function renderMatchCard(match: MatchDto) {
    const actualHome = match.homeTeam;
    const actualAway = match.awayTeam;
    const home = actualHome ?? sourcePreview(match, "home");
    const away = actualAway ?? sourcePreview(match, "away");
    const storedDraft = draftFor(match);
    const winnerByScore = scoreWinner(storedDraft);
    const automaticQualifiedTeamId =
      winnerByScore === "home"
        ? actualHome?.id
        : winnerByScore === "away"
          ? actualAway?.id
          : null;
    const draft = automaticQualifiedTeamId
      ? { ...storedDraft, qualifiedTeamId: automaticQualifiedTeamId }
      : storedDraft;
    const prediction = predictionByMatch.get(match.id);
    const isDefined = Boolean(actualHome && actualAway);
    const isLocked =
      !isDefined ||
      new Date(match.startsAt) <= new Date() ||
      match.status === "locked" ||
      match.status === "finished";
    const complete =
      draft.homeScore !== null &&
      draft.awayScore !== null &&
      Boolean(draft.qualifiedTeamId);
    const changed =
      !prediction ||
      prediction.homeScore !== draft.homeScore ||
      prediction.awayScore !== draft.awayScore ||
      prediction.qualifiedTeamId !== draft.qualifiedTeamId;

    function setScore(side: "homeScore" | "awayScore", value: number | null) {
      const next = { ...storedDraft, [side]: value };
      const winner = scoreWinner(next);
      update(match, {
        ...next,
        qualifiedTeamId:
          winner === "home"
            ? (actualHome?.id ?? null)
            : winner === "away"
              ? (actualAway?.id ?? null)
              : null,
      });
    }

    const TeamRow = ({
      team,
      side,
    }: { team: TeamDto | null; side: "home" | "away" }) => {
      const selected = draft.qualifiedTeamId === team?.id;
      return (
        <button
          aria-pressed={selected}
          className={`bracket-team ${selected ? "is-advancing" : ""} ${!isDefined ? "is-preview" : ""}`}
          disabled={isLocked || !team}
          onClick={() => team && selectTeam(match, team)}
          onPointerDown={(event) => {
            if (isLocked || !team) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging({ matchId: match.id, teamId: team.id });
          }}
          onPointerUp={() => {
            if (team && dragging?.matchId === match.id) selectTeam(match, team);
            setDragging(null);
          }}
          type="button"
        >
          {team ? (
            <TeamFlag team={team} />
          ) : (
            <span className="bracket-team-tbd">?</span>
          )}
          <span>{team?.name ?? "A definir"}</span>
          {isDefined ? (
            <b>
              {side === "home"
                ? (draft.homeScore ?? "–")
                : (draft.awayScore ?? "–")}
            </b>
          ) : null}
          {!isLocked ? <i>⋮⋮</i> : null}
        </button>
      );
    };

    return (
      <article
        className={`bracket-match ${isLocked ? "is-locked" : ""}`}
        key={match.id}
      >
        <header>
          <span>Jogo {match.bracketPosition ?? "–"}</span>
          <time>{timeLabel(match.startsAt)}</time>
        </header>
        <TeamRow team={home} side="home" />
        <TeamRow team={away} side="away" />

        {!isLocked && actualHome && actualAway ? (
          <div className="bracket-score-controls">
            <label>
              <span>Placar {actualHome.fifaCode}</span>
              <input
                inputMode="numeric"
                min="0"
                onChange={(event) =>
                  setScore(
                    "homeScore",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                type="number"
                value={draft.homeScore ?? ""}
              />
            </label>
            <b>×</b>
            <label>
              <span>Placar {actualAway.fifaCode}</span>
              <input
                inputMode="numeric"
                min="0"
                onChange={(event) =>
                  setScore(
                    "awayScore",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                type="number"
                value={draft.awayScore ?? ""}
              />
            </label>
          </div>
        ) : null}

        {!isLocked ? (
          <>
            <p className="bracket-help">
              {winnerByScore
                ? `Classificado pelo placar: ${winnerByScore === "home" ? actualHome?.name : actualAway?.name}`
                : draft.homeScore !== null && draft.awayScore !== null
                  ? "Empate: toque em quem avança nos pênaltis"
                  : "Informe o placar para definir o classificado"}
            </p>
            <button
              className="bracket-save"
              disabled={!complete || !changed || save.isPending}
              onClick={() => save.mutate({ match, draft })}
              type="button"
            >
              {save.isPending && save.variables?.match.id === match.id
                ? "Salvando..."
                : prediction
                  ? "Atualizar palpite"
                  : "Salvar palpite"}
            </button>
          </>
        ) : null}

        {match.status === "finished" ? (
          <footer>
            <span>
              Final: {match.homeScore} × {match.awayScore}
            </span>
            <strong>
              {prediction ? `+${prediction.points} pontos` : "Sem palpite"}
            </strong>
          </footer>
        ) : !isDefined ? (
          <p className="bracket-waiting">Aguardando definição do confronto</p>
        ) : prediction ? (
          <p className="bracket-saved">✓ Palpite salvo</p>
        ) : null}
      </article>
    );
  }

  const phaseMatches = (phase: MatchDto["phase"]) =>
    matches
      .filter((match) => match.phase === phase)
      .sort(
        (left, right) =>
          new Date(left.startsAt).getTime() -
            new Date(right.startsAt).getTime() ||
          (left.bracketPosition ?? 0) - (right.bracketPosition ?? 0),
      );
  const definedPhaseMatches = (phase: MatchDto["phase"]) =>
    phaseMatches(phase).filter(
      (match) => match.homeTeam !== null && match.awayTeam !== null,
    );
  const visibleStages = STAGES.filter(
    (stage) => definedPhaseMatches(stage.phase).length > 0,
  );
  const thirdPlace = definedPhaseMatches("third_place")[0];

  return (
    <section className="knockout-section">
      <div className="knockout-intro">
        <div>
          <span>Mata-mata</span>
          <h2>Seu caminho até a taça</h2>
        </div>
        <strong>2× pontos</strong>
      </div>
      <p className="knockout-instruction">
        Informe o placar e escolha quem avança. Deslize para ver as próximas
        fases.
      </p>
      <div className="bracket-scroll" aria-label="Árvore do mata-mata">
        {visibleStages.map((stage) => (
          <section className="bracket-stage" key={stage.phase}>
            <h3>{stage.label}</h3>
            <div className="bracket-stage-matches">
              {definedPhaseMatches(stage.phase).map((match) =>
                renderMatchCard(match),
              )}
            </div>
          </section>
        ))}
      </div>
      {thirdPlace ? (
        <section className="third-place-card">
          <h3>Disputa de 3º lugar</h3>
          {renderMatchCard(thirdPlace)}
        </section>
      ) : null}
    </section>
  );
}
