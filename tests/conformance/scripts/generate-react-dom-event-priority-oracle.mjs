#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactDomEventPriorityOracle } from "../src/react-dom-event-priority-oracle-generator.mjs";
import { stringifyReactDomEventPriorityOracle } from "../src/react-dom-event-priority-oracle.mjs";
import { REACT_DOM_EVENT_PRIORITY_ORACLE_ARTIFACT_PATH } from "../src/react-dom-event-priority-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-event-priority-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 event-name and update-priority oracle from
the immutable React source commit, the checked runtime inventory npm tarballs,
and local Fast React placeholder boundary probes.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_EVENT_PRIORITY_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomEventPriorityOracle();
const oracleText = stringifyReactDomEventPriorityOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_EVENT_PRIORITY_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
