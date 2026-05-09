#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateSchedulerMockOracle } from "../src/scheduler-mock-oracle-generator.mjs";
import { stringifySchedulerMockOracle } from "../src/scheduler-mock-oracle.mjs";
import { SCHEDULER_MOCK_ORACLE_ARTIFACT_PATH } from "../src/scheduler-mock-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-scheduler-mock-oracle.mjs [--write]

Generate the pinned scheduler@0.27.0 scheduler/unstable_mock behavior oracle
from exact npm package artifacts and the current local scheduler implementation.
Generation uses temporary directories, does not run lifecycle scripts, omits
local filesystem paths, and does not claim broad Fast React scheduler compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${SCHEDULER_MOCK_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateSchedulerMockOracle();
const oracleText = stringifySchedulerMockOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${SCHEDULER_MOCK_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
