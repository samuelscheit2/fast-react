import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  findReactDomTypeSubpathComparison,
  readCheckedReactDomTypeInventory,
  readCheckedReactDomTypeInventoryText
} from "../src/react-dom-type-inventory.mjs";
import {
  REACT_DECLARATION_TARGET,
  REACT_DOM_DECLARATION_TARGET,
  REACT_DOM_TYPE_COMPATIBILITY_POLICY,
  REACT_DOM_TYPE_INVENTORY_ARTIFACT_PATH,
  REACT_DOM_TYPE_RUNTIME_TARGET
} from "../src/react-dom-type-targets.mjs";

const inventory = readCheckedReactDomTypeInventory();

test("checked React DOM type inventory artifact has expected schema and targets", () => {
  assert.equal(
    REACT_DOM_TYPE_INVENTORY_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-type-inventory.json"
  );
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(
    inventory.inventoryKind,
    "react-19.2.6-react-dom-type-inventory"
  );
  assert.equal(inventory.generatedArtifacts, true);
  assert.equal(inventory.deterministic, true);
  assert.deepEqual(inventory.targets.runtime, REACT_DOM_TYPE_RUNTIME_TARGET);
  assert.deepEqual(
    inventory.targets.reactDomDeclarations,
    REACT_DOM_DECLARATION_TARGET
  );
  assert.deepEqual(inventory.targets.reactDeclarations, REACT_DECLARATION_TARGET);
  assert.equal(inventory.packages["react-dom"].version, "19.2.6");
  assert.equal(inventory.packages["@types/react-dom"].version, "19.2.3");
  assert.equal(inventory.packages["@types/react"].version, "19.2.14");
});

test("React DOM type inventory separates runtime and TypeScript compatibility", () => {
  assert.deepEqual(inventory.compatibilityPolicy, REACT_DOM_TYPE_COMPATIBILITY_POLICY);
  assert.deepEqual(inventory.conformanceClaims, {
    realReactRuntimeComparedToDeclarations: true,
    fastReactComparedToReact: false,
    fastReactRuntimeCompatible: false,
    fastReactTypeDeclarationsCompatible: false,
    compatibilityClaimed: false
  });
  assert.equal(
    inventory.evidenceClaims.runtimePackageCompatibilitySeparatedFromTypeScriptDeclarations,
    true
  );
  assert.equal(inventory.evidenceClaims.fastReactComparedToReact, false);
});

test("React DOM declaration package subpaths are inventoried", () => {
  assert.deepEqual(inventory.packages["@types/react-dom"].publicSubpaths, [
    ".",
    "./canary",
    "./client",
    "./experimental",
    "./server",
    "./server.browser",
    "./server.bun",
    "./server.edge",
    "./server.node",
    "./static",
    "./static.browser",
    "./static.edge",
    "./static.node",
    "./test-utils",
    "./package.json"
  ]);
  assert.deepEqual(inventory.gaps.runtimeOnlySubpaths, ["./profiling"]);
  assert.deepEqual(inventory.gaps.declarationOnlySubpaths, [
    "./canary",
    "./experimental"
  ]);

  const canary = findReactDomTypeSubpathComparison(inventory, "./canary");
  assert.equal(canary.status, "declaration-only-subpath");
  assert.equal(canary.declarations.declarationFile, "canary.d.ts");
  assert.deepEqual(canary.declarations.valueExportNames, []);
});

test("inventory captures runtime exports missing from declarations", () => {
  assertMissingDeclaration("./client", "version", "string");
  assertMissingDeclaration("./server.node", "version", "string");
  assertMissingDeclaration("./server.browser", "version", "string");
  assertMissingDeclaration("./server.browser", "resume", "function");
  assertMissingDeclaration("./server.edge", "version", "string");
  assertMissingDeclaration("./server.bun", "version", "string");
  assertMissingDeclaration("./server.bun", "resume", "undefined");
  assertMissingDeclaration("./static.browser", "resumeAndPrerender", "function");

  const profiling = findReactDomTypeSubpathComparison(inventory, "./profiling");
  assert.equal(profiling.status, "runtime-subpath-missing-declarations");
  assert.ok(
    profiling.missingDeclarationExports.some(
      (gap) => gap.exportName === "createRoot"
    )
  );
  assert.ok(
    profiling.missingDeclarationExports.some((gap) => gap.exportName === "version")
  );
});

test("inventory captures react-server condition declaration gaps", () => {
  const rootGap = inventory.gaps.reactServerConditionGaps.find(
    (gap) => gap.subpath === "."
  );
  assert.ok(rootGap, "root react-server gap should be recorded");
  assert.equal(
    rootGap.status,
    "react-server-root-narrower-than-default-declarations"
  );
  assert.ok(rootGap.declaredButAbsentInReactServer.includes("createPortal"));
  assert.ok(rootGap.declaredButAbsentInReactServer.includes("flushSync"));

  for (const subpath of ["./client", "./server", "./static", "./profiling"]) {
    const gap = inventory.gaps.reactServerConditionGaps.find(
      (candidate) => candidate.subpath === subpath
    );
    assert.ok(gap, `${subpath} react-server gap should be recorded`);
    assert.equal(
      gap.status,
      "react-server-runtime-throws-but-declarations-are-default"
    );
    assert.match(
      gap.runtimeMessage,
      /is not supported in React Server Components\./u
    );
  }
});

test("print React DOM type inventory CLI emits the checked artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-type-inventory.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readCheckedReactDomTypeInventoryText());
});

test("React DOM type inventory artifact does not leak temporary paths", () => {
  const inventoryText = readCheckedReactDomTypeInventoryText();
  assert.doesNotMatch(inventoryText, /\/private\/var\/folders/u);
  assert.doesNotMatch(inventoryText, /\/var\/folders/u);
  assert.doesNotMatch(inventoryText, /fast-react-dom-type-inventory-[A-Za-z0-9]/u);
});

function assertMissingDeclaration(subpath, exportName, runtimeType) {
  const comparison = findReactDomTypeSubpathComparison(inventory, subpath);
  const missing = comparison.missingDeclarationExports.find(
    (gap) => gap.exportName === exportName
  );
  assert.ok(missing, `${subpath} should miss declaration for ${exportName}`);
  assert.equal(missing.runtimeValue.type, runtimeType);
}
