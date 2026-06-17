import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/api";
import {
  useLeaderboardPodiumPrediction,
  useLeaderboardPodiumVoteRanking,
  useRanking,
} from "../lib/queries";

type PodiumDraft = {
  firstEntryId: string;
  secondEntryId: string;
  thirdEntryId: string;
};

const EMPTY_DRAFT: PodiumDraft = {
  firstEntryId: "",
  secondEntryId: "",
  thirdEntryId: "",
};

const POSITIONS = [
  { key: "firstEntryId", label: "1º lugar" },
  { key: "secondEntryId", label: "2º lugar" },
  { key: "thirdEntryId", label: "3º lugar" },
] as const;

const POSITION_LABELS = {
  1: "1º lugar",
  2: "2º lugar",
  3: "3º lugar",
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function GeneralPredictionPage() {
  const ranking = useRanking();
  const prediction = useLeaderboardPodiumPrediction();
  const voteRanking = useLeaderboardPodiumVoteRanking();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PodiumDraft>(EMPTY_DRAFT);

  useEffect(() => {
    if (!prediction.data) return;

    setDraft({
      firstEntryId: prediction.data.firstEntryId,
      secondEntryId: prediction.data.secondEntryId,
      thirdEntryId: prediction.data.thirdEntryId,
    });
  }, [prediction.data]);

  const selectedIds = useMemo(
    () =>
      new Set(
        Object.values(draft).filter((entryId): entryId is string =>
          Boolean(entryId),
        ),
      ),
    [draft],
  );
  const isComplete = Object.values(draft).every(Boolean);
  const selectedCount = Object.values(draft).filter(Boolean).length;
  const hasDuplicates = selectedIds.size !== selectedCount;
  const hasChanges =
    draft.firstEntryId !== (prediction.data?.firstEntryId ?? "") ||
    draft.secondEntryId !== (prediction.data?.secondEntryId ?? "") ||
    draft.thirdEntryId !== (prediction.data?.thirdEntryId ?? "");

  const save = useMutation({
    mutationFn: () => apiClient.saveLeaderboardPodiumPrediction(draft),
    onSuccess: async (savedPrediction) => {
      queryClient.setQueryData(
        ["leaderboard-podium-prediction"],
        savedPrediction,
      );
      await queryClient.invalidateQueries({
        queryKey: ["leaderboard-podium-prediction"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["leaderboard-podium-vote-ranking"],
      });
    },
  });

  return (
    <section className="home-screen">
      <h1 className="section-title">Palpite Geral</h1>

      <section className="general-votes-card">
        <div className="general-votes-head">
          <span>Mais votados por posição</span>
          <strong>Top 3</strong>
        </div>

        {(voteRanking.data ?? []).length > 0 ? (
          <div className="general-votes-podium">
            {(voteRanking.data ?? []).map((row) => (
              <div
                className={`general-vote-player general-vote-player-${row.position}`}
                key={row.entryId}
              >
                <div className="general-vote-avatar">
                  {initials(row.name)}
                  <span>{row.position}</span>
                </div>
                <small>
                  {POSITION_LABELS[
                    row.position as keyof typeof POSITION_LABELS
                  ] ?? `${row.position}º lugar`}
                </small>
                <strong>{row.name}</strong>
                <em>
                  {row.votes} {row.votes === 1 ? "voto" : "votos"}
                </em>
              </div>
            ))}
          </div>
        ) : (
          <p className="home-empty-card">Nenhum voto computado ainda.</p>
        )}
      </section>

      <div className="general-prediction-card">
        <div className="general-prediction-head">
          <span>Bolão geral</span>
          <strong>Top 3</strong>
        </div>

        <div className="podium-prediction-list">
          {POSITIONS.map((position) => (
            <label className="podium-prediction-field" key={position.key}>
              <span>{position.label}</span>
              <select
                disabled={ranking.isLoading || save.isPending}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    [position.key]: event.target.value,
                  }))
                }
                value={draft[position.key]}
              >
                <option value="">Selecionar participante</option>
                {(ranking.data ?? []).map((row) => {
                  const isSelectedElsewhere =
                    selectedIds.has(row.entryId) &&
                    draft[position.key] !== row.entryId;

                  return (
                    <option
                      disabled={isSelectedElsewhere}
                      key={row.entryId}
                      value={row.entryId}
                    >
                      {row.name}
                    </option>
                  );
                })}
              </select>
            </label>
          ))}
        </div>

        {ranking.data?.length === 0 ? (
          <p className="home-empty-card">Nenhum participante encontrado.</p>
        ) : null}

        {hasDuplicates ? (
          <p className="form-error">
            Escolha participantes diferentes para cada posicao.
          </p>
        ) : null}

        <button
          className="general-prediction-save"
          disabled={
            !isComplete || hasDuplicates || !hasChanges || save.isPending
          }
          onClick={() => save.mutate()}
          type="button"
        >
          {save.isPending ? "Salvando..." : "Salvar Palpite Geral"}
        </button>
      </div>
    </section>
  );
}
