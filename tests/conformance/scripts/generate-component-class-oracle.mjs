#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateComponentClassOracle } from "../src/component-class-oracle-generator.mjs";
import { stringifyComponentClassOracle } from "../src/component-class-oracle.mjs";
import { COMPONENT_CLASS_ORACLE_ARTIFACT_PATH } from "../src/component-class-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-component-class-oracle.mjs [--write]

Generate the pinned React 19.2.6 Component/PureComponent direct-behavior oracle
from exact npm package artifacts and compare local Fast React package
entrypoints as explicit matches/mismatches/placeholders. Generation uses
temporary directories, does not run lifecycle scripts, and does not claim Fast
React behavior compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${COMPONENT_CLASS_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateComponentClassOracle();
const oracleText = stringifyComponentClassOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${COMPONENT_CLASS_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
