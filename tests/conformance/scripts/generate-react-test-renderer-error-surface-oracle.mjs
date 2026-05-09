#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactTestRendererErrorSurfaceOracle } from "../src/react-test-renderer-error-surface-oracle-generator.mjs";
import { stringifyReactTestRendererErrorSurfaceOracle } from "../src/react-test-renderer-error-surface-oracle.mjs";
import { REACT_TEST_RENDERER_ERROR_SURFACE_ORACLE_ARTIFACT_PATH } from "../src/react-test-renderer-error-surface-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-test-renderer-error-surface-oracle.mjs [--write]

Generate the pinned React 19.2.6 react-test-renderer public error surface
oracle from exact npm tarballs. The generator probes invalid find/findBy
results, unmounted root access, deterministic invalid create/update inputs,
removed shallow renderer behavior, and unsupported use() messages. It does not
run lifecycle scripts or claim Fast React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_TEST_RENDERER_ERROR_SURFACE_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactTestRendererErrorSurfaceOracle();
const oracleText = stringifyReactTestRendererErrorSurfaceOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_TEST_RENDERER_ERROR_SURFACE_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
