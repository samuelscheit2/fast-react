#!/usr/bin/env node

import {
  generateChildrenHelperOracle,
  stringifyGeneratedChildrenHelperOracle
} from "../src/children-helper-oracle-generator.mjs";
import { CHILDREN_HELPER_ORACLE_ARTIFACT_PATH } from "../src/children-helper-targets.mjs";
import { mkdir, writeFile } from "node:fs/promises";

const write = process.argv.includes("--write");
const oracle = await generateChildrenHelperOracle();
const output = stringifyGeneratedChildrenHelperOracle(oracle);

if (write) {
  const artifactUrl = new URL(`../${CHILDREN_HELPER_ORACLE_ARTIFACT_PATH}`, import.meta.url);
  await mkdir(new URL(".", artifactUrl), { recursive: true });
  await writeFile(artifactUrl, output);
} else {
  process.stdout.write(output);
}
