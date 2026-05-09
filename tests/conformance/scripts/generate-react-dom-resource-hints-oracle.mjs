#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactDomResourceHintsOracle } from "../src/react-dom-resource-hints-oracle-generator.mjs";
import { stringifyReactDomResourceHintsOracle } from "../src/react-dom-resource-hints-oracle.mjs";
import { REACT_DOM_RESOURCE_HINT_ORACLE_ARTIFACT_PATH } from "../src/react-dom-resource-hints-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-resource-hints-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 resource hint oracle from the checked
runtime inventory and exact npm tarballs. The generator probes prefetchDNS,
preconnect, preload, preloadModule, preinit, and preinitModule public outcomes
and separately records private dispatcher normalization evidence.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_RESOURCE_HINT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomResourceHintsOracle();
const oracleText = stringifyReactDomResourceHintsOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_RESOURCE_HINT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
