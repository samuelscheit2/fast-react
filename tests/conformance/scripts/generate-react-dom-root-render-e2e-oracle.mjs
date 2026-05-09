#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import {
  generateReactDomRootRenderE2EOracle
} from "../src/react-dom-root-render-e2e-oracle-generator.mjs";
import {
  stringifyReactDomRootRenderE2EOracle
} from "../src/react-dom-root-render-e2e-oracle.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_ORACLE_ARTIFACT_PATH
} from "../src/react-dom-root-render-e2e-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-root-render-e2e-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 root render/update/unmount e2e oracle from
exact npm package artifacts and compare the local Fast React React DOM
placeholder as explicit mismatches/placeholders. Generation uses temporary
directories, does not run lifecycle scripts, and does not claim Fast React
behavior compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_ROOT_RENDER_E2E_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomRootRenderE2EOracle();
const oracleText = stringifyReactDomRootRenderE2EOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_ROOT_RENDER_E2E_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
