#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { DOM_NAMESPACE_SVG_ORACLE_ARTIFACT_PATH } from "../src/dom-namespace-svg-targets.mjs";
import { generateDomNamespaceSvgOracle } from "../src/dom-namespace-svg-oracle-generator.mjs";
import { stringifyDomNamespaceSvgOracle } from "../src/dom-namespace-svg-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-dom-namespace-svg-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 namespace/SVG/MathML host output oracle
from the checked runtime inventory and exact npm tarballs. The generator probes
server string output and a deterministic fake-DOM client host environment for
createElement/createElementNS and attribute operations. It does not run package
lifecycle scripts or claim Fast React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${DOM_NAMESPACE_SVG_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateDomNamespaceSvgOracle();
const oracleText = stringifyDomNamespaceSvgOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${DOM_NAMESPACE_SVG_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
