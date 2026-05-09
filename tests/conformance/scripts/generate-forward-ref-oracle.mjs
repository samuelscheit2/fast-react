#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateForwardRefOracle } from "../src/forward-ref-oracle-generator.mjs";
import { stringifyForwardRefOracle } from "../src/forward-ref-oracle.mjs";
import { FORWARD_REF_ORACLE_ARTIFACT_PATH } from "../src/forward-ref-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-forward-ref-oracle.mjs [--write]

Generate the pinned React 19.2.6 forwardRef wrapper-object oracle from exact npm
package artifacts and compare local Fast React package entrypoints as explicit
matches/mismatches/placeholders. Generation uses temporary directories, does
not run lifecycle scripts, and does not claim Fast React behavior compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${FORWARD_REF_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateForwardRefOracle();
const oracleText = stringifyForwardRefOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${FORWARD_REF_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
