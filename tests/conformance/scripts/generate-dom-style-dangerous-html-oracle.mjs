#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateDomStyleDangerousHtmlOracle } from "../src/dom-style-dangerous-html-oracle-generator.mjs";
import { stringifyDomStyleDangerousHtmlOracle } from "../src/dom-style-dangerous-html-oracle.mjs";
import { DOM_STYLE_DANGEROUS_HTML_ORACLE_ARTIFACT_PATH } from "../src/dom-style-dangerous-html-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-dom-style-dangerous-html-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 DOM style and dangerouslySetInnerHTML oracle from the
checked runtime inventory and exact npm tarballs. The generator probes
react-dom/server serialization plus react-dom/client mutation behavior against
a deterministic fake DOM. It does not run lifecycle scripts or claim Fast
React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${DOM_STYLE_DANGEROUS_HTML_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateDomStyleDangerousHtmlOracle();
const oracleText = stringifyDomStyleDangerousHtmlOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${DOM_STYLE_DANGEROUS_HTML_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
