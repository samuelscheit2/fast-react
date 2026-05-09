#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import {
  generateReactDomClientRootOracle
} from "../src/react-dom-client-root-oracle-generator.mjs";
import {
  stringifyReactDomClientRootOracle
} from "../src/react-dom-client-root-oracle.mjs";
import {
  REACT_DOM_CLIENT_ROOT_ORACLE_ARTIFACT_PATH
} from "../src/react-dom-client-root-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-client-root-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 client-root public behavior oracle from
exact npm package artifacts and compare the local Fast React React DOM
placeholder as explicit mismatches/placeholders. Generation uses temporary
directories, does not run lifecycle scripts, and does not claim Fast React
behavior compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_CLIENT_ROOT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomClientRootOracle();
const oracleText = stringifyReactDomClientRootOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_CLIENT_ROOT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
