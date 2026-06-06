import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const apiRoot = resolve(repoRoot, "apps/api");
const sharedRoot = resolve(repoRoot, "packages/shared");
const deployRoot = resolve(repoRoot, "deploy");
const deploySharedRoot = resolve(deployRoot, "packages/shared");

await rm(deployRoot, { recursive: true, force: true });
await mkdir(deployRoot, { recursive: true });

await cp(resolve(apiRoot, "dist"), resolve(deployRoot, "dist"), {
  recursive: true,
});
await cp(resolve(apiRoot, "prisma"), resolve(deployRoot, "prisma"), {
  recursive: true,
});

const apiPackage = JSON.parse(
  await readFile(resolve(apiRoot, "package.json"), "utf8"),
);
const deployPackage = {
  name: apiPackage.name,
  version: apiPackage.version,
  private: true,
  type: apiPackage.type,
  engines: apiPackage.engines,
  scripts: {
    start: apiPackage.scripts.start,
  },
  dependencies: {
    ...apiPackage.dependencies,
    "@bolao-acipg/shared": "file:packages/shared",
  },
};

await writeFile(
  resolve(deployRoot, "package.json"),
  `${JSON.stringify(deployPackage, null, 2)}\n`,
);

const sharedPackage = JSON.parse(
  await readFile(resolve(sharedRoot, "package.json"), "utf8"),
);
const deploySharedPackage = {
  name: sharedPackage.name,
  version: sharedPackage.version,
  private: true,
  type: sharedPackage.type,
  main: sharedPackage.main,
  types: sharedPackage.types,
  exports: sharedPackage.exports,
  dependencies: sharedPackage.dependencies,
};

await mkdir(deploySharedRoot, { recursive: true });
await writeFile(
  resolve(deploySharedRoot, "package.json"),
  `${JSON.stringify(deploySharedPackage, null, 2)}\n`,
);
await cp(resolve(sharedRoot, "dist"), resolve(deploySharedRoot, "dist"), {
  recursive: true,
});
