import type { Round } from "../generated/prisma/index.js";
import { idToString, matchToDto, teamToDto } from "../lib/serializers.js";
import type { CatalogRepository } from "../repositories/catalog.repository.js";

export class CatalogService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async listTeams() {
    const teams = await this.catalogRepository.listTeams();
    return teams.map(teamToDto);
  }

  async listRounds() {
    const rounds = await this.catalogRepository.listRounds();
    return rounds.map((round) => this.roundToDto(round));
  }

  async listMatches() {
    const matches = await this.catalogRepository.listMatches();
    return matches.map(matchToDto);
  }

  private roundToDto(round: Round) {
    return {
      id: idToString(round.id),
      name: round.name,
      kind: round.phase,
      order: round.sort_order,
    };
  }
}
