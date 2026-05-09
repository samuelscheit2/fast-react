#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactDomTypeInventory } from "../src/react-dom-type-inventory-generator.mjs";
import { stringifyReactDomTypeInventory } from "../src/react-dom-type-inventory.mjs";
import { REACT_DOM_TYPE_INVENTORY_ARTIFACT_PATH } from "../src/react-dom-type-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-type-inventory.mjs [--write]

Generate the pinned React DOM declaration/runtime type-gap inventory from the
checked React DOM 19.2.6 runtime inventory and exact @types/react-dom@19.2.3
plus @types/react@19.2.14 tarballs. Generation uses temporary directories,
does not run lifecycle scripts, and does not compare Fast React behavior.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_TYPE_INVENTORY_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const inventory = await generateReactDomTypeInventory();
const inventoryText = stringifyReactDomTypeInventory(inventory);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_TYPE_INVENTORY_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, inventoryText);
} else {
  process.stdout.write(inventoryText);
}
