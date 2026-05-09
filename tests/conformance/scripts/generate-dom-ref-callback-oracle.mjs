#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { DOM_REF_CALLBACK_ORACLE_ARTIFACT_PATH } from "../src/dom-ref-callback-targets.mjs";
import { generateDomRefCallbackOracle } from "../src/dom-ref-callback-oracle-generator.mjs";
import { stringifyDomRefCallbackOracle } from "../src/dom-ref-callback-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-dom-ref-callback-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 ref callback oracle from the checked
runtime inventory and exact npm tarballs. The generator probes synchronous
createRoot ref attach/detach, callback cleanup returns, object refs,
StrictMode-relevant behavior, updates, unmounts, and error propagation. It does
not run lifecycle scripts or claim Fast React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${DOM_REF_CALLBACK_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateDomRefCallbackOracle();
const oracleText = stringifyDomRefCallbackOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${DOM_REF_CALLBACK_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
