#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import {
  generateReactDomContainerRootMarkersOracle
} from "../src/react-dom-container-root-markers-oracle-generator.mjs";
import {
  stringifyReactDomContainerRootMarkersOracle
} from "../src/react-dom-container-root-markers-oracle.mjs";
import {
  REACT_DOM_CONTAINER_ROOT_MARKERS_ORACLE_ARTIFACT_PATH
} from "../src/react-dom-container-root-markers-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-container-root-markers-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 createRoot container/root-marker oracle
from the checked runtime inventory and exact npm tarballs. The generator probes
container validation, duplicate-root diagnostics, marker cleanup, and no DOM
child mutation before render. It does not run lifecycle scripts or claim Fast
React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_CONTAINER_ROOT_MARKERS_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomContainerRootMarkersOracle();
const oracleText = stringifyReactDomContainerRootMarkersOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_CONTAINER_ROOT_MARKERS_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
