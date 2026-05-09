import { readFileSync } from "node:fs";

import { REACT_DOM_TYPE_INVENTORY_ARTIFACT_PATH } from "./react-dom-type-targets.mjs";

export function stringifyReactDomTypeInventory(inventory) {
  return `${JSON.stringify(inventory, null, 2)}\n`;
}

export function readCheckedReactDomTypeInventory(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedReactDomTypeInventoryText(baseUrl));
}

export function readCheckedReactDomTypeInventoryText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${REACT_DOM_TYPE_INVENTORY_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomTypeInventoryAsMarkdown(inventory) {
  const runtimeOnlyLines = inventory.gaps.runtimeOnlySubpaths.map(
    (subpath) => `- ${subpath}`
  );
  const declarationOnlyLines = inventory.gaps.declarationOnlySubpaths.map(
    (subpath) => `- ${subpath}`
  );
  const missingExportLines = inventory.gaps.missingRuntimeDeclarations.map(
    (gap) => `- ${gap.subpath}: ${gap.exportName}${gap.note ? ` (${gap.note})` : ""}`
  );
  const reactServerLines = inventory.gaps.reactServerConditionGaps.map(
    (gap) => `- ${gap.subpath}: ${gap.status}`
  );
  const claimLines = Object.entries(inventory.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Type Inventory",
    "",
    "Generated from the checked React DOM runtime inventory and exact @types tarballs. This artifact separates runtime package compatibility from TypeScript declaration compatibility.",
    "",
    "## Runtime-only Subpaths",
    "",
    ...runtimeOnlyLines,
    "",
    "## Declaration-only Subpaths",
    "",
    ...declarationOnlyLines,
    "",
    "## Missing Runtime Declarations",
    "",
    ...missingExportLines,
    "",
    "## React Server Condition Gaps",
    "",
    ...reactServerLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findReactDomTypeSubpathComparison(inventory, subpath) {
  const comparison = inventory.subpathComparisons.find(
    (candidate) => candidate.subpath === subpath
  );
  if (!comparison) {
    throw new Error(`Missing React DOM type subpath comparison: ${subpath}`);
  }
  return comparison;
}
