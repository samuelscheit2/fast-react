import { readFileSync } from "node:fs";

import { INVENTORY_ARTIFACT_PATH } from "./inventory-targets.mjs";

export function stringifyRuntimeInventory(inventory) {
  return `${JSON.stringify(inventory, null, 2)}\n`;
}

export function readCheckedRuntimeInventory(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedRuntimeInventoryText(baseUrl));
}

export function readCheckedRuntimeInventoryText(baseUrl = import.meta.url) {
  return readFileSync(new URL(`../${INVENTORY_ARTIFACT_PATH}`, baseUrl), "utf8");
}

export function formatRuntimeInventoryAsMarkdown(inventory) {
  const targetLines = inventory.runtimeTargets.map((target) => {
    const packageEvidence = inventory.packages[target.packageName];
    return `- ${target.packageName}@${target.version}: ${target.role}; files: ${packageEvidence.tarball.fileCount}; public subpaths: ${packageEvidence.publicSubpaths.join(", ")}`;
  });

  const runtimeProbeLines = inventory.runtimeProbeModes.map((mode) => {
    const probes = inventory.runtimeProbes[mode.id] ?? [];
    const okCount = probes.filter((probe) => probe.require.status === "ok")
      .length;
    const thrownCount = probes.filter((probe) => probe.require.status === "throws")
      .length;
    return `- ${mode.id}: ${okCount} require probes loaded, ${thrownCount} require probes threw expected package errors`;
  });

  const manualLines = inventory.manualInventoryFields.map(
    (field) =>
      `- ${field.id}: ${field.status}; packages: ${field.packages.join(", ")}`
  );

  const conformanceLines = Object.entries(inventory.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React Runtime Package Inventory",
    "",
    "Generated from pinned React package artifacts. This is package evidence only and does not claim Fast React behavior compatibility.",
    "",
    "## Runtime Targets",
    "",
    ...targetLines,
    "",
    "## Runtime Probe Modes",
    "",
    ...runtimeProbeLines,
    "",
    "## Manual / Ungenerated Fields",
    "",
    ...manualLines,
    "",
    "## Conformance Claims",
    "",
    ...conformanceLines,
    ""
  ].join("\n");
}

export function packageSpecifier(packageName, subpath) {
  if (subpath === ".") {
    return packageName;
  }

  if (!subpath.startsWith("./")) {
    throw new Error(`Unsupported package export subpath: ${subpath}`);
  }

  return `${packageName}/${subpath.slice(2)}`;
}

export function runtimeProbeId(packageName, subpath) {
  return `${packageName}:${subpath}`;
}
