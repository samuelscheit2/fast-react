import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  findReactDomContainerRootMarkersObservation,
  findReactDomContainerValidationCase,
  readCheckedReactDomContainerRootMarkersOracle,
  readCheckedReactDomContainerRootMarkersOracleText
} from "../src/react-dom-container-root-markers-oracle.mjs";
import {
  REACT_DOM_CONTAINER_ROOT_MARKERS_INVALID_CONTAINER_CASES,
  REACT_DOM_CONTAINER_ROOT_MARKERS_ORACLE_ARTIFACT_PATH,
  REACT_DOM_CONTAINER_ROOT_MARKERS_PROBE_MODES,
  REACT_DOM_CONTAINER_ROOT_MARKERS_SUPPORTING_TARGETS,
  REACT_DOM_CONTAINER_ROOT_MARKERS_TARGET,
  REACT_DOM_CONTAINER_ROOT_MARKERS_VALID_CONTAINER_CASES
} from "../src/react-dom-container-root-markers-targets.mjs";

const oracle = readCheckedReactDomContainerRootMarkersOracle();

test("checked React DOM container root markers oracle has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_CONTAINER_ROOT_MARKERS_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-container-root-markers-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-container-root-markers-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.equal(
    oracle.generation.method,
    "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree and probed through a deterministic minimal DOM host"
  );
  assert.equal(
    oracle.generation.probeIsolation,
    "one Node child process per React DOM container root marker mode"
  );
  assert.equal(oracle.generation.probeTimeoutMs, 15000);
  assert.equal(oracle.generation.generatedTimestampIncluded, false);
  assert.deepEqual(
    oracle.reactDomTarget,
    REACT_DOM_CONTAINER_ROOT_MARKERS_TARGET
  );
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_CONTAINER_ROOT_MARKERS_SUPPORTING_TARGETS
  );
  assert.deepEqual(
    oracle.probeModes,
    REACT_DOM_CONTAINER_ROOT_MARKERS_PROBE_MODES
  );
  assert.deepEqual(
    oracle.validContainerCases,
    REACT_DOM_CONTAINER_ROOT_MARKERS_VALID_CONTAINER_CASES
  );
  assert.deepEqual(
    oracle.invalidContainerCases,
    REACT_DOM_CONTAINER_ROOT_MARKERS_INVALID_CONTAINER_CASES
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM container root markers oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(oracle.evidenceClaims.containerValidationProbed, true);
  assert.equal(oracle.evidenceClaims.duplicateRootWarningProbed, true);
  assert.equal(oracle.evidenceClaims.legacyRootWarningProbed, true);
  assert.equal(oracle.evidenceClaims.markerCleanupAfterUnmountProbed, true);
  assert.equal(
    oracle.evidenceClaims.noDirectDomChildMutationBeforeRenderProbed,
    true
  );
  assert.equal(
    oracle.evidenceClaims.randomizedReactMarkerSuffixesSerialized,
    false
  );
});

test("React DOM createRoot accepts only element, document, and document fragments", () => {
  for (const mode of REACT_DOM_CONTAINER_ROOT_MARKERS_PROBE_MODES) {
    const observation = observationFor(mode.id);
    assert.equal(observation.result.containerValidation.length, 9, mode.id);

    for (const caseId of ["element", "document", "document-fragment"]) {
      const validationCase = validationCaseFor(mode.id, caseId);
      assert.equal(validationCase.createRoot.result.status, "ok", caseId);
      assert.deepEqual(validationCase.createRoot.consoleCalls, []);
      assert.deepEqual(validationCase.createRoot.mutations, []);
      assertRootMarkerState(validationCase.beforeMarker, 0, 0, 0);
      assertRootMarkerState(validationCase.afterCreateMarker, 1, 1, 0);
      assert.equal(validationCase.unmount.status, "ok", caseId);
      assert.deepEqual(validationCase.unmount.consoleCalls, []);
      assert.deepEqual(
        validationCase.unmountMutations,
        caseId === "element" ? emptyDivTextContentMutation() : []
      );
      assertRootMarkerState(validationCase.afterUnmountMarker, 1, 0, 1);
    }

    for (const caseId of [
      "null",
      "undefined",
      "plain-object",
      "text-node",
      "comment-mount-point",
      "comment-other"
    ]) {
      const validationCase = validationCaseFor(mode.id, caseId);
      assert.equal(validationCase.createRoot.result.status, "throws", caseId);
      assert.equal(validationCase.createRoot.result.error.name, "Error");
      assert.deepEqual(validationCase.createRoot.consoleCalls, []);
      assert.deepEqual(validationCase.createRoot.mutations, []);
      assertNoRootMarker(validationCase.afterCreateMarker);
      assert.equal(validationCase.unmount, null);
      assert.equal(validationCase.afterUnmountMarker, null);
    }
  }
});

test("React DOM createRoot invalid container messages differ by development mode", () => {
  for (const caseId of [
    "null",
    "undefined",
    "plain-object",
    "text-node",
    "comment-mount-point",
    "comment-other"
  ]) {
    assert.equal(
      validationCaseFor("default-node-development", caseId).createRoot.result
        .error.message,
      "Target container is not a DOM element.",
      caseId
    );
    assert.match(
      validationCaseFor("default-node-production", caseId).createRoot.result
        .error.message,
      /^Minified React error #299;/u,
      caseId
    );
  }
});

test("React DOM duplicate root diagnostics are development-only public marker evidence", () => {
  const development = observationFor("default-node-development").result;
  assert.equal(development.duplicateRootWarning.firstCreate.result.status, "ok");
  assert.deepEqual(development.duplicateRootWarning.firstCreate.consoleCalls, []);
  assert.equal(development.duplicateRootWarning.secondCreate.result.status, "ok");
  assert.deepEqual(development.duplicateRootWarning.secondCreate.consoleCalls, [
    {
      method: "error",
      args: [
        {
          type: "string",
          value:
            "You are calling ReactDOMClient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it."
        }
      ]
    }
  ]);
  assertRootMarkerState(development.duplicateRootWarning.afterFirstMarker, 1, 1, 0);
  assertRootMarkerState(development.duplicateRootWarning.afterSecondMarker, 1, 1, 0);

  assert.deepEqual(
    development.legacyDuplicateRootWarning.secondCreate.consoleCalls,
    [
      {
        method: "error",
        args: [
          {
            type: "string",
            value:
              "You are calling ReactDOMClient.createRoot() on a container that was previously passed to ReactDOM.render(). This is not supported."
          }
        ]
      }
    ]
  );
  assert.equal(
    development.legacyDuplicateRootWarning.legacyMarkerInjected,
    true
  );

  const production = observationFor("default-node-production").result;
  assert.deepEqual(production.duplicateRootWarning.secondCreate.consoleCalls, []);
  assert.deepEqual(
    production.legacyDuplicateRootWarning.secondCreate.consoleCalls,
    []
  );
});

test("React DOM root unmount clears the root marker enough for recreate without warning", () => {
  for (const mode of REACT_DOM_CONTAINER_ROOT_MARKERS_PROBE_MODES) {
    const cleanup = observationFor(mode.id).result.unmountMarkerCleanup;
    assert.equal(cleanup.firstCreate.result.status, "ok", mode.id);
    assertRootMarkerState(cleanup.afterCreateMarker, 1, 1, 0);
    assert.equal(cleanup.unmount.result.status, "ok", mode.id);
    assert.deepEqual(cleanup.unmount.consoleCalls, []);
    assert.deepEqual(cleanup.unmount.mutations, emptyDivTextContentMutation());
    assertRootMarkerState(cleanup.afterUnmountMarker, 1, 0, 1);
    assert.equal(cleanup.recreate.result.status, "ok", mode.id);
    assert.deepEqual(cleanup.recreate.consoleCalls, []);
    assert.deepEqual(cleanup.recreate.mutations, []);
    assertRootMarkerState(cleanup.afterRecreateMarker, 1, 1, 0);
  }
});

test("React DOM createRoot does not mutate container children before render", () => {
  for (const mode of REACT_DOM_CONTAINER_ROOT_MARKERS_PROBE_MODES) {
    const noRender = observationFor(mode.id).result.noRenderSideEffects;
    assert.equal(noRender.createRoot.result.status, "ok", mode.id);
    assert.deepEqual(noRender.createRoot.consoleCalls, []);
    assert.deepEqual(noRender.createRoot.mutations, []);
    assert.deepEqual(noRender.afterTree, noRender.beforeTree);
    assertRootMarkerState(noRender.afterCreateMarker, 1, 1, 0);
  }
});

test("React DOM container root marker oracle artifact has no temp or local path leaks", () => {
  const oracleText = readCheckedReactDomContainerRootMarkersOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-container-root-markers-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
  assert.doesNotMatch(oracleText, /__reactContainer\$[A-Za-z0-9]/u);
});

test("print React DOM container root markers oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    [
      "scripts/print-react-dom-container-root-markers-oracle.mjs",
      "--format=json"
    ],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer:
        readCheckedReactDomContainerRootMarkersOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedReactDomContainerRootMarkersOracleText());
});

function observationFor(modeId) {
  return findReactDomContainerRootMarkersObservation(oracle, modeId);
}

function validationCaseFor(modeId, caseId) {
  return findReactDomContainerValidationCase(observationFor(modeId), caseId);
}

function assertRootMarkerState(marker, propertyCount, truthyCount, nullCount) {
  assert.equal(marker.inspectable, true);
  assert.equal(marker.propertyCount, propertyCount);
  assert.equal(marker.truthyCount, truthyCount);
  assert.equal(marker.nullCount, nullCount);
  assert.equal(marker.sanitizedProperties.length, propertyCount);
  for (const property of marker.sanitizedProperties) {
    assert.equal(property.keyPrefix, "__reactContainer$");
    assert.equal(property.enumerable, true);
  }
}

function assertNoRootMarker(marker) {
  assert.equal(marker.propertyCount, 0);
  assert.equal(marker.truthyCount, 0);
  assert.equal(marker.nullCount, 0);
  assert.deepEqual(marker.sanitizedProperties, []);
}

function emptyDivTextContentMutation() {
  return [
    {
      type: "setTextContent",
      target: "DIV",
      value: ""
    }
  ];
}
