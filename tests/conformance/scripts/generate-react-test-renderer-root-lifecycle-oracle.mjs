#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { generateReactTestRendererRootLifecycleOracle } from "../src/react-test-renderer-root-lifecycle-oracle-generator.mjs";
import { stringifyReactTestRendererRootLifecycleOracle } from "../src/react-test-renderer-root-lifecycle-oracle.mjs";
import { REACT_TEST_RENDERER_ROOT_LIFECYCLE_ORACLE_ARTIFACT_PATH } from "../src/react-test-renderer-root-lifecycle-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/generate-react-test-renderer-root-lifecycle-oracle.mjs [--write]

Generate the pinned React Test Renderer 19.2.6 create/update/unmount root
lifecycle oracle from the checked runtime inventory plus exact npm tarballs.
The generator probes create(), update(), unmount(), getInstance(), .root,
createNodeMock, strict/concurrent options, and post-unmount errors without
claiming Fast React compatibility.

Without --write, the generated JSON is printed to stdout.
With --write, ${REACT_TEST_RENDERER_ROOT_LIFECYCLE_ORACLE_ARTIFACT_PATH} is refreshed.
`);
  process.exit(0);
}

const oracle = await generateReactTestRendererRootLifecycleOracle();
const oracleText = stringifyReactTestRendererRootLifecycleOracle(oracle);

if (args.has("--write")) {
  const artifactUrl = new URL(
    `../${REACT_TEST_RENDERER_ROOT_LIFECYCLE_ORACLE_ARTIFACT_PATH}`,
    import.meta.url
  );
  mkdirSync(dirname(artifactUrl.pathname), { recursive: true });
  writeFileSync(artifactUrl, oracleText);
} else {
  process.stdout.write(oracleText);
}
