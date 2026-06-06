import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api";

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ["me"],
    queryFn: apiClient.me,
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: apiClient.matches,
  });
}

export function usePredictions() {
  return useQuery({
    queryKey: ["predictions"],
    queryFn: apiClient.predictions,
  });
}

export function useRanking() {
  return useQuery({
    queryKey: ["ranking"],
    queryFn: apiClient.ranking,
  });
}

export function useRounds() {
  return useQuery({
    queryKey: ["rounds"],
    queryFn: apiClient.rounds,
  });
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: apiClient.teams,
  });
}
