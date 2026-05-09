#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { REACT_DOM_FORM_ACTIONS_ORACLE_ARTIFACT_PATH } from "../src/react-dom-form-actions-targets.mjs";
import { generateReactDomFormActionsOracle } from "../src/react-dom-form-actions-oracle-generator.mjs";
import { stringifyReactDomFormActionsOracle } from "../src/react-dom-form-actions-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-form-actions-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 form-actions oracle from the checked
runtime inventory and exact npm tarballs. The generator probes public form API
descriptors, requestFormReset invalid-input errors, hook boundary errors,
server-render observable return shapes, and DOM/form dependency boundaries.
It does not run lifecycle scripts or claim Fast React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_FORM_ACTIONS_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomFormActionsOracle();
const oracleText = stringifyReactDomFormActionsOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_FORM_ACTIONS_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
