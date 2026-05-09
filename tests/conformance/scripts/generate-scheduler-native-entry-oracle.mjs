#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateSchedulerNativeEntryOracle } from "../src/scheduler-native-entry-oracle-generator.mjs";
import { stringifySchedulerNativeEntryOracle } from "../src/scheduler-native-entry-oracle.mjs";
import { SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH } from "../src/scheduler-native-entry-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-scheduler-native-entry-oracle.mjs [--write]

Generate the pinned scheduler@0.27.0 native entrypoint behavior oracle from
exact npm package artifacts. Generation uses temporary directories, does not
run lifecycle scripts, and does not claim Fast React scheduler compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateSchedulerNativeEntryOracle();
const oracleText = stringifySchedulerNativeEntryOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
