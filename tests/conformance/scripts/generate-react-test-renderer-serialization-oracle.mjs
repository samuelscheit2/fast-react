#!/usr/bin/env node

import { writeFileSync } from "node:fs";

import { generateReactTestRendererSerializationOracle } from "../src/react-test-renderer-serialization-oracle-generator.mjs";
import { stringifyReactTestRendererSerializationOracle } from "../src/react-test-renderer-serialization-oracle.mjs";
import { REACT_TEST_RENDERER_SERIALIZATION_ORACLE_ARTIFACT_PATH } from "../src/react-test-renderer-serialization-targets.mjs";

if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== "--write")) {
  process.stderr.write(`Usage: node scripts/generate-react-test-renderer-serialization-oracle.mjs [--write]

Generate the pinned react-test-renderer 19.2.6 serialization oracle from exact
npm tarballs. Without --write, JSON is printed to stdout.
`);
  process.exit(1);
}

const oracle = await generateReactTestRendererSerializationOracle();
const oracleText = stringifyReactTestRendererSerializationOracle(oracle);

if (process.argv[2] === "--write") {
  writeFileSync(
    new URL(`../${REACT_TEST_RENDERER_SERIALIZATION_ORACLE_ARTIFACT_PATH}`, import.meta.url),
    oracleText
  );
} else {
  process.stdout.write(oracleText);
}
