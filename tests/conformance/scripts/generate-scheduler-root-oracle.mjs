#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateSchedulerRootOracle } from "../src/scheduler-root-oracle-generator.mjs";
import { stringifySchedulerRootOracle } from "../src/scheduler-root-oracle.mjs";
import { SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH } from "../src/scheduler-root-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-scheduler-root-oracle.mjs [--write]

Generate the pinned scheduler 0.27.0 public root behavior oracle from exact npm
package artifacts. Generation uses temporary directories, does not run lifecycle
scripts, omits raw wall-clock timestamps, and does not claim Fast React
scheduler compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateSchedulerRootOracle();
const oracleText = stringifySchedulerRootOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
