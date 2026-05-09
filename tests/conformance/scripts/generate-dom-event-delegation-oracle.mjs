#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { DOM_EVENT_DELEGATION_ORACLE_ARTIFACT_PATH } from "../src/dom-event-delegation-targets.mjs";
import { generateDomEventDelegationOracle } from "../src/dom-event-delegation-oracle-generator.mjs";
import { stringifyDomEventDelegationOracle } from "../src/dom-event-delegation-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-dom-event-delegation-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 delegated event oracle from the checked
runtime inventory and exact npm tarballs. The generator probes createRoot root
listener installation, capture/bubble dispatch order, stopPropagation,
preventDefault, synthetic event shape, target/currentTarget handling, and
selected delegated discrete/continuous event examples. It does not run package
lifecycle scripts or claim Fast React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${DOM_EVENT_DELEGATION_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateDomEventDelegationOracle();
const oracleText = stringifyDomEventDelegationOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${DOM_EVENT_DELEGATION_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
