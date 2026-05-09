#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { stringifyReactDomTestUtilsActOracle } from "../src/react-dom-test-utils-act-oracle.mjs";
import { generateReactDomTestUtilsActOracle } from "../src/react-dom-test-utils-act-oracle-generator.mjs";
import { REACT_DOM_TEST_UTILS_ACT_ORACLE_ARTIFACT_PATH } from "../src/react-dom-test-utils-act-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-test-utils-act-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 react-dom/test-utils.act oracle from the
checked runtime inventory and exact npm tarballs. The generator probes export
shape, descriptor behavior, sync and async callback returns, thrown errors,
warnings, thenable behavior, and observable relationship to React.act.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_TEST_UTILS_ACT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomTestUtilsActOracle();
const oracleText = stringifyReactDomTestUtilsActOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_TEST_UTILS_ACT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
