#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateSchedulerVariantOracle } from "../src/scheduler-variant-oracle-generator.mjs";
import { stringifySchedulerVariantOracle } from "../src/scheduler-variant-oracle.mjs";
import { SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH } from "../src/scheduler-variant-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-scheduler-variant-oracle.mjs [--write]

Generate the pinned scheduler@0.27.0 variant and physical deep-import oracle
from exact npm package artifacts. Generation uses temporary directories, does
not run lifecycle scripts, and does not claim Fast React scheduler behavior
compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateSchedulerVariantOracle();
const oracleText = stringifySchedulerVariantOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
