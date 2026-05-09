#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactDomPortalOracle } from "../src/react-dom-portal-oracle-generator.mjs";
import { stringifyReactDomPortalOracle } from "../src/react-dom-portal-oracle.mjs";
import { REACT_DOM_PORTAL_ORACLE_ARTIFACT_PATH } from "../src/react-dom-portal-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-portal-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 createPortal oracle from the checked
runtime inventory and exact npm tarballs. The generator probes export
descriptors, accepted and rejected containers, key coercion, portal object
shape, and unsupported createPortal boundaries. It does not run lifecycle
scripts or claim Fast React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_PORTAL_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomPortalOracle();
const oracleText = stringifyReactDomPortalOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_PORTAL_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
