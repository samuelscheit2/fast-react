#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { ELEMENT_OBJECT_ORACLE_ARTIFACT_PATH } from "../src/element-object-targets.mjs";
import { generateElementObjectOracle } from "../src/element-object-oracle-generator.mjs";
import { stringifyElementObjectOracle } from "../src/element-object-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-element-object-oracle.mjs [--write]

Generate the pinned React 19.2.6 element-object oracle from exact npm package
artifacts and compare local Fast React package entrypoints as explicit
mismatches/placeholders. Generation uses temporary directories, does not run
lifecycle scripts, and does not claim Fast React behavior compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${ELEMENT_OBJECT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateElementObjectOracle();
const oracleText = stringifyElementObjectOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${ELEMENT_OBJECT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
