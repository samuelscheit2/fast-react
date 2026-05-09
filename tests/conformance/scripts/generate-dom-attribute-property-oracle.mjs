#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateDomAttributePropertyOracle } from "../src/dom-attribute-property-oracle-generator.mjs";
import { stringifyDomAttributePropertyOracle } from "../src/dom-attribute-property-oracle.mjs";
import { DOM_ATTRIBUTE_PROPERTY_ORACLE_ARTIFACT_PATH } from "../src/dom-attribute-property-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-dom-attribute-property-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 DOM attribute/property oracle from the
checked runtime inventory and exact npm tarballs. The generator probes
react-dom/server serialization plus react-dom/client mutation behavior against
a deterministic fake DOM. It does not run lifecycle scripts or claim Fast
React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${DOM_ATTRIBUTE_PROPERTY_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateDomAttributePropertyOracle();
const oracleText = stringifyDomAttributePropertyOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${DOM_ATTRIBUTE_PROPERTY_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
