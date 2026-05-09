#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateSchedulerPostTaskOracle } from "../src/scheduler-post-task-oracle-generator.mjs";
import { stringifySchedulerPostTaskOracle } from "../src/scheduler-post-task-oracle.mjs";
import { SCHEDULER_POST_TASK_ORACLE_ARTIFACT_PATH } from "../src/scheduler-post-task-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-scheduler-post-task-oracle.mjs [--write]

Generate the pinned scheduler 0.27.0 scheduler/unstable_post_task behavior
oracle from exact npm package artifacts. Generation uses temporary directories,
does not run lifecycle scripts, uses controlled Task Scheduling API shims for
stable Node observations, omits raw wall-clock timestamps, and does not claim
Fast React scheduler compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${SCHEDULER_POST_TASK_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateSchedulerPostTaskOracle();
const oracleText = stringifySchedulerPostTaskOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${SCHEDULER_POST_TASK_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
