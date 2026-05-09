#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactTestRendererActOracle } from "../src/react-test-renderer-act-oracle-generator.mjs";
import { stringifyReactTestRendererActOracle } from "../src/react-test-renderer-act-oracle.mjs";
import { REACT_TEST_RENDERER_ACT_ORACLE_ARTIFACT_PATH } from "../src/react-test-renderer-act-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-test-renderer-act-oracle.mjs [--write]

Generate the pinned react-test-renderer 19.2.6 act, mock Scheduler, and
unstable_flushSync behavior oracle from exact npm tarballs. The generator
probes exported act, deterministic async act warning surfaces, update flushing,
Scheduler exposure, unstable_flushSync, and thrown error aggregation without
reading React private internals or asserting wall-clock timing.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_TEST_RENDERER_ACT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactTestRendererActOracle();
const oracleText = stringifyReactTestRendererActOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_TEST_RENDERER_ACT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
