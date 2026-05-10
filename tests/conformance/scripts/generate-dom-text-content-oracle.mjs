#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateDomTextContentOracle } from "../src/dom-text-content-oracle-generator.mjs";
import { stringifyDomTextContentOracle } from "../src/dom-text-content-oracle.mjs";
import { DOM_TEXT_CONTENT_ORACLE_ARTIFACT_PATH } from "../src/dom-text-content-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-dom-text-content-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 DOM text-content oracle from the checked
runtime inventory and exact npm tarballs. The generator evaluates
shouldSetTextContent from the extracted React DOM client development bundle,
probes react-dom/server serialization, and probes react-dom/client mutation
behavior against a deterministic fake DOM. It does not run lifecycle scripts
or claim Fast React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${DOM_TEXT_CONTENT_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateDomTextContentOracle();
const oracleText = stringifyDomTextContentOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${DOM_TEXT_CONTENT_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
