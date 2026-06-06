import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { config } from "dotenv";

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

config({ path: resolve(apiRoot, ".env") });
config({ path: resolve(apiRoot, ".env.local"), override: true });

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

const prisma = new PrismaClient();

const TEAM_OVERRIDES = new Map([
  ["4", { name: "Czechia", fifaCode: "CZE", iso2: "cz", group: "A" }],
  [
    "6",
    { name: "Bosnia and Herzegovina", fifaCode: "BIH", iso2: "ba", group: "B" },
  ],
  ["16", { name: "Turkiye", fifaCode: "TUR", iso2: "tr", group: "D" }],
  ["23", { name: "Sweden", fifaCode: "SWE", iso2: "se", group: "F" }],
  ["35", { name: "Iraq", fifaCode: "IRQ", iso2: "iq", group: "I" }],
  ["42", { name: "DR Congo", fifaCode: "COD", iso2: "cd", group: "K" }],
]);

const TEAM_NAMES_PT_BR = new Map([
  ["MEX", "México"],
  ["RSA", "África do Sul"],
  ["KOR", "Coreia do Sul"],
  ["CZE", "República Tcheca"],
  ["CAN", "Canadá"],
  ["BIH", "Bósnia e Herzegovina"],
  ["QAT", "Catar"],
  ["SUI", "Suíça"],
  ["BRA", "Brasil"],
  ["MAR", "Marrocos"],
  ["HAI", "Haiti"],
  ["SCO", "Escócia"],
  ["USA", "Estados Unidos"],
  ["PAR", "Paraguai"],
  ["AUS", "Austrália"],
  ["TUR", "Turquia"],
  ["GER", "Alemanha"],
  ["CUW", "Curaçao"],
  ["CIV", "Costa do Marfim"],
  ["ECU", "Equador"],
  ["NED", "Países Baixos"],
  ["JPN", "Japão"],
  ["SWE", "Suécia"],
  ["TUN", "Tunísia"],
  ["BEL", "Bélgica"],
  ["EGY", "Egito"],
  ["IRN", "Irã"],
  ["NZL", "Nova Zelândia"],
  ["ESP", "Espanha"],
  ["CPV", "Cabo Verde"],
  ["KSA", "Arábia Saudita"],
  ["URU", "Uruguai"],
  ["FRA", "França"],
  ["SEN", "Senegal"],
  ["IRQ", "Iraque"],
  ["NOR", "Noruega"],
  ["ARG", "Argentina"],
  ["ALG", "Argélia"],
  ["AUT", "Áustria"],
  ["JOR", "Jordânia"],
  ["POR", "Portugal"],
  ["COD", "RD Congo"],
  ["UZB", "Uzbequistão"],
  ["COL", "Colômbia"],
  ["ENG", "Inglaterra"],
  ["CRO", "Croácia"],
  ["GHA", "Gana"],
  ["PAN", "Panamá"],
]);

const STADIUM_TIME_ZONES = new Map([
  ["1", "America/Mexico_City"],
  ["2", "America/Mexico_City"],
  ["3", "America/Monterrey"],
  ["4", "America/Chicago"],
  ["5", "America/Chicago"],
  ["6", "America/Chicago"],
  ["7", "America/New_York"],
  ["8", "America/New_York"],
  ["9", "America/New_York"],
  ["10", "America/New_York"],
  ["11", "America/New_York"],
  ["12", "America/Toronto"],
  ["13", "America/Vancouver"],
  ["14", "America/Los_Angeles"],
  ["15", "America/Los_Angeles"],
  ["16", "America/Los_Angeles"],
]);

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(value);
      value = "";
      continue;
    }

    value += char;
  }

  values.push(value);
  return values;
}

async function readCsv(path) {
  return parseCsv(await readFile(resolve(apiRoot, path), "utf8"));
}

function parseLocalDateTime(value) {
  const match = value.match(
    /^(?<month>\d{2})\/(?<day>\d{2})\/(?<year>\d{4}) (?<hour>\d{2}):(?<minute>\d{2})$/,
  );

  if (!match?.groups) {
    throw new Error(`Invalid local_date: ${value}`);
  }

  return {
    year: Number(match.groups.year),
    month: Number(match.groups.month),
    day: Number(match.groups.day),
    hour: Number(match.groups.hour),
    minute: Number(match.groups.minute),
  };
}

function getTimeZoneParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const get = (type) => Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === 24 ? 0 : get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function zonedTimeToUtcDate(localDateTime, timeZone) {
  const expected = Date.UTC(
    localDateTime.year,
    localDateTime.month - 1,
    localDateTime.day,
    localDateTime.hour,
    localDateTime.minute,
    0,
  );
  let utc = expected;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getTimeZoneParts(new Date(utc), timeZone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const diff = expected - actualAsUtc;

    if (diff === 0) break;
    utc += diff;
  }

  return new Date(utc);
}

function getMatchStartsAt(row) {
  const timeZone = STADIUM_TIME_ZONES.get(row.stadium_id);

  if (!timeZone) {
    throw new Error(`Missing timezone for stadium_id ${row.stadium_id}.`);
  }

  return zonedTimeToUtcDate(parseLocalDateTime(row.local_date), timeZone);
}

async function ensurePool() {
  const existing = await prisma.pool.findFirst({
    where: { status: "active" },
    orderBy: { id: "asc" },
  });

  if (existing) return existing;

  return prisma.pool.create({
    data: {
      name: "Bolao ACIPG Copa 2026",
      status: "active",
    },
  });
}

async function ensureRound(poolId, matchday) {
  const sortOrder = Number(matchday);
  const existing = await prisma.round.findFirst({
    where: {
      pool_id: poolId,
      phase: "group",
      sort_order: sortOrder,
    },
  });

  if (existing) return existing;

  return prisma.round.create({
    data: {
      pool_id: poolId,
      name: `Fase de grupos - Rodada ${sortOrder}`,
      phase: "group",
      sort_order: sortOrder,
    },
  });
}

async function seedTeams() {
  const rows = await readCsv("prisma/data/worldcup2026.teams.csv");
  const bySourceId = new Map();

  for (const row of rows) {
    const override = TEAM_OVERRIDES.get(row.id);
    const code = override?.fifaCode ?? row.fifa_code;
    const name = TEAM_NAMES_PT_BR.get(code) ?? override?.name ?? row.name_en;
    const group = override?.group ?? row.groups;

    const team = await prisma.team.upsert({
      where: { code },
      update: {
        name,
        group_code: group || null,
      },
      create: {
        name,
        code,
        group_code: group || null,
      },
    });

    bySourceId.set(row.id, team);
  }

  return bySourceId;
}

async function seedMatches(poolId, teamsBySourceId) {
  const rows = await readCsv("prisma/data/worldcup2026.games.csv");
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const homeTeam = teamsBySourceId.get(row.home_team_id);
    const awayTeam = teamsBySourceId.get(row.away_team_id);

    if (!homeTeam || !awayTeam) {
      console.warn(`Skipping match ${row.id}: team not found.`);
      continue;
    }

    const round = await ensureRound(poolId, row.matchday);
    const startsAt = getMatchStartsAt(row);
    const existing = await prisma.match.findFirst({
      where: {
        pool_id: poolId,
        roundId: round.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
      },
    });

    if (existing) {
      await prisma.match.update({
        where: { id: existing.id },
        data: {
          startsAt,
          status: row.finished === "TRUE" ? "finished" : "scheduled",
          homeScore: row.finished === "TRUE" ? Number(row.home_score) : null,
          awayScore: row.finished === "TRUE" ? Number(row.away_score) : null,
        },
      });
      updated += 1;
      continue;
    }

    await prisma.match.create({
      data: {
        pool_id: poolId,
        roundId: round.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startsAt,
        status: row.finished === "TRUE" ? "finished" : "scheduled",
        homeScore: row.finished === "TRUE" ? Number(row.home_score) : null,
        awayScore: row.finished === "TRUE" ? Number(row.away_score) : null,
      },
    });
    created += 1;
  }

  return { created, updated };
}

try {
  const pool = await ensurePool();
  const teamsBySourceId = await seedTeams();
  const matches = await seedMatches(pool.id, teamsBySourceId);

  console.log(
    `World Cup seed complete: ${teamsBySourceId.size} teams, ${matches.created} matches created, ${matches.updated} matches updated.`,
  );
} finally {
  await prisma.$disconnect();
}
