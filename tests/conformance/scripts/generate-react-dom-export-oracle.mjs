#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { REACT_DOM_EXPORT_ORACLE_ARTIFACT_PATH } from "../src/react-dom-export-targets.mjs";
import { generateReactDomExportOracle } from "../src/react-dom-export-oracle-generator.mjs";
import { stringifyReactDomExportOracle } from "../src/react-dom-export-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-export-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 export oracle from the checked runtime
inventory and exact npm tarballs. The generator probes runtime export keys,
property descriptors, condition resolution, and blocked physical .js/CJS
subpaths. It does not run lifecycle scripts or claim Fast React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_EXPORT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomExportOracle();
const oracleText = stringifyReactDomExportOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_EXPORT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
