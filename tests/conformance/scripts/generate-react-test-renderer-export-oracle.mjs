#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactTestRendererExportOracle } from "../src/react-test-renderer-export-oracle-generator.mjs";
import { stringifyReactTestRendererExportOracle } from "../src/react-test-renderer-export-oracle.mjs";
import { REACT_TEST_RENDERER_EXPORT_ORACLE_ARTIFACT_PATH } from "../src/react-test-renderer-export-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-test-renderer-export-oracle.mjs [--write]

Generate the pinned react-test-renderer 19.2.6 export oracle from exact npm
tarballs. The generator probes runtime export keys, property descriptors,
package metadata, shallow removal, deprecation warnings, and deterministic
condition differences. It does not run lifecycle scripts or claim Fast React
compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_TEST_RENDERER_EXPORT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactTestRendererExportOracle();
const oracleText = stringifyReactTestRendererExportOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_TEST_RENDERER_EXPORT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
