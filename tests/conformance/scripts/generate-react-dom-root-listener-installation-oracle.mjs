#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import {
  stringifyReactDomRootListenerInstallationOracle
} from "../src/react-dom-root-listener-installation-oracle.mjs";
import {
  generateReactDomRootListenerInstallationOracle
} from "../src/react-dom-root-listener-installation-oracle-generator.mjs";
import {
  REACT_DOM_ROOT_LISTENER_INSTALLATION_ORACLE_ARTIFACT_PATH
} from "../src/react-dom-root-listener-installation-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-dom-root-listener-installation-oracle.mjs [--write]

Generate the pinned React DOM 19.2.6 root and portal listener installation
oracle from the checked runtime inventory and exact npm tarballs. The generator
probes createRoot root listener registration, owner-document selectionchange,
non-delegated capture-only events, listener marker dedupe, and deterministic
portal listener setup. It does not run package lifecycle scripts, dispatch
native events, or claim Fast React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_DOM_ROOT_LISTENER_INSTALLATION_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactDomRootListenerInstallationOracle();
const oracleText = stringifyReactDomRootListenerInstallationOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_DOM_ROOT_LISTENER_INSTALLATION_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
