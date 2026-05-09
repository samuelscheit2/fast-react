import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createInventoryPlaceholder,
  stringifyInventoryPlaceholder
} from "../src/inventory-targets.mjs";

const expectedInventoryUrl = new URL(
  "../inventory/react-19.2.6-target-placeholder.json",
  import.meta.url
);

function readExpectedInventoryText() {
  return `${readFileSync(expectedInventoryUrl, "utf8").trimEnd()}\n`;
}

test("inventory placeholder is byte-stable against the checked-in artifact", () => {
  assert.equal(stringifyInventoryPlaceholder(), readExpectedInventoryText());
});

test("inventory placeholder describes pinned package targets", () => {
  const inventory = createInventoryPlaceholder();
  const compatibilityTargets = new Map(
    inventory.compatibilityTargets.map((target) => [
      target.packageName,
      target
    ])
  );
  const supportingTargets = new Map(
    inventory.supportingTargets.map((target) => [target.packageName, target])
  );

  assert.equal(compatibilityTargets.get("react")?.version, "19.2.6");
  assert.equal(compatibilityTargets.get("react-dom")?.version, "19.2.6");
  assert.equal(compatibilityTargets.get("@types/react")?.version, "19.2.14");
  assert.equal(supportingTargets.get("@types/react-dom")?.version, "19.2.3");
  assert.equal(supportingTargets.get("scheduler")?.version, "0.27.0");

  assert.deepEqual(compatibilityTargets.get("react")?.publicSubpaths, [
    ".",
    "./compiler-runtime",
    "./jsx-dev-runtime",
    "./jsx-runtime",
    "./package.json"
  ]);
  assert.ok(
    compatibilityTargets.get("react-dom")?.publicSubpaths.includes(
      "./profiling"
    )
  );
  assert.ok(
    compatibilityTargets.get("react-dom")?.publicSubpaths.includes(
      "./test-utils"
    )
  );
});

test("inventory placeholder refuses to imply real conformance", () => {
  const inventory = createInventoryPlaceholder();

  assert.equal(inventory.generatedArtifacts, false);
  assert.deepEqual(inventory.conformanceClaims, {
    realReactBehaviorCompared: false,
    tarballsDownloaded: false,
    runtimeExportsProbed: false,
    typeDeclarationsParsed: false,
    fastReactComparedToReact: false
  });
  assert.ok(
    inventory.futureInventoryStages.every(
      (stage) => stage.status === "not-generated"
    )
  );
});

test("inventory placeholder references only declared future stages", () => {
  const inventory = createInventoryPlaceholder();
  const stageIds = new Set(
    inventory.futureInventoryStages.map((stage) => stage.id)
  );
  const targets = [
    ...inventory.compatibilityTargets,
    ...inventory.supportingTargets
  ];

  for (const target of targets) {
    assert.equal(
      new Set(target.futureInventoryStageIds).size,
      target.futureInventoryStageIds.length,
      `${target.packageName} has duplicate future stage references`
    );

    for (const stageId of target.futureInventoryStageIds) {
      assert.ok(
        stageIds.has(stageId),
        `${target.packageName} references unknown future stage ${stageId}`
      );
    }
  }
});

test("print-inventory CLI emits the checked-in JSON placeholder", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-inventory.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readExpectedInventoryText());
});
