#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactDomServerStaticOracle } from "../src/react-dom-server-static-oracle-generator.mjs";
import {
  stringifyReactDomServerStaticOracle
} from "../src/react-dom-server-static-oracle.mjs";
import {
  REACT_DOM_SERVER_STATIC_ORACLE_ARTIFACT_PATH
} from "../src/react-dom-server-static-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-server-static-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 server/static behavior surface oracle from
the checked runtime inventory, exact npm package artifacts, and local Fast
React DOM server/static placeholders. Generation uses temporary directories,
does not run lifecycle scripts, and does not claim Fast React DOM server
compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_SERVER_STATIC_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomServerStaticOracle();
const oracleText = stringifyReactDomServerStaticOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_SERVER_STATIC_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
