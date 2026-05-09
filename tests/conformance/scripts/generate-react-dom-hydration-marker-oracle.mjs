#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactDomHydrationMarkerOracle } from "../src/react-dom-hydration-marker-oracle-generator.mjs";
import { stringifyReactDomHydrationMarkerOracle } from "../src/react-dom-hydration-marker-oracle.mjs";
import { REACT_DOM_HYDRATION_MARKER_ORACLE_ARTIFACT_PATH } from "../src/react-dom-hydration-marker-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-hydration-marker-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 hydration marker and mismatch evidence
oracle from the checked runtime inventory, exact npm tarball, accepted worker
reports, and React source pinned to the v19.2.6 commit. Generation does not
execute React DOM rendering or claim Fast React hydration compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_HYDRATION_MARKER_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomHydrationMarkerOracle();
const oracleText = stringifyReactDomHydrationMarkerOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_HYDRATION_MARKER_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
