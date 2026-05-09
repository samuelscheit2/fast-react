#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactActOracle } from "../src/react-act-oracle-generator.mjs";
import { stringifyReactActOracle } from "../src/react-act-oracle.mjs";
import { REACT_ACT_ORACLE_ARTIFACT_PATH } from "../src/react-act-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-act-oracle.mjs [--write]

Generate the pinned React 19.2.6 public React.act behavior oracle from exact
npm package artifacts and compare local Fast React package entrypoints as
explicit matches, mismatches, or placeholders. Generation uses temporary
directories, does not run lifecycle scripts, and does not claim Fast React
behavior compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_ACT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactActOracle();
const oracleText = stringifyReactActOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_ACT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
