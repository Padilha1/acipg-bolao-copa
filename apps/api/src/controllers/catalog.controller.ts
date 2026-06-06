import type { CatalogService } from "../services/catalog.service.js";

export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  teams = () => this.catalogService.listTeams();
  rounds = () => this.catalogService.listRounds();
  matches = () => this.catalogService.listMatches();
}
