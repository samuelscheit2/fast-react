#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { INVENTORY_ARTIFACT_PATH } from "../src/inventory-targets.mjs";
import { generateRuntimeInventory } from "../src/runtime-inventory-generator.mjs";
import { stringifyRuntimeInventory } from "../src/runtime-inventory.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-runtime-inventory.mjs [--write]

Generate the pinned React 19.2.6 runtime/package inventory from npm registry
metadata and exact package tarballs. Generation uses temporary directories,
does not run lifecycle scripts, and does not compare Fast React behavior.

Without --write, the generated JSON is printed to stdout.
With --write, ${INVENTORY_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const inventory = await generateRuntimeInventory();
const inventoryText = stringifyRuntimeInventory(inventory);

if (args.has("--write")) {
  const artifactUrl = new URL(`../${INVENTORY_ARTIFACT_PATH}`, import.meta.url);
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, inventoryText);
} else {
  process.stdout.write(inventoryText);
}
