import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET,
  REACT_DOM_ROOT_RENDER_E2E_ORACLE_ARTIFACT_PATH,
  REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES,
  REACT_DOM_ROOT_RENDER_E2E_SUPPORTING_TARGETS,
  REACT_DOM_ROOT_RENDER_E2E_TARGET
} from "../src/react-dom-root-render-e2e-targets.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS,
  REACT_DOM_ROOT_RENDER_E2E_SCENARIOS
} from "../src/react-dom-root-render-e2e-scenarios.mjs";
import {
  findReactDomRootRenderE2EObservation,
  readCheckedReactDomRootRenderE2EOracle,
  readCheckedReactDomRootRenderE2EOracleText
} from "../src/react-dom-root-render-e2e-oracle.mjs";
import {
  evaluateReactDomRootRenderE2EConformanceGate,
  inspectReactDomRootRenderE2EPrivateHostOutputDiagnostics,
  inspectReactDomRootRenderE2EPrivateBridgeRequests,
  REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
  REACT_DOM_PORTAL_ROOT_RENDER_OBJECT_ACCEPTED_STATUS,
  REACT_DOM_PORTAL_ROOT_RENDER_RECONCILER_DIAGNOSTIC_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_BLOCKED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_BLOCKED_STATUS
} from "../src/react-dom-root-render-e2e-conformance-gate.mjs";

const oracle = readCheckedReactDomRootRenderE2EOracle();

test("checked React DOM root render e2e oracle artifact has expected schema and targets", () => {
  assert.equal(
    REACT_DOM_ROOT_RENDER_E2E_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-root-render-e2e-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-root-render-e2e-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.equal(oracle.generation.generatedTimestampIncluded, false);
  assert.equal(oracle.generation.lifecycleScriptsExecuted, false);
  assert.equal(oracle.generation.rootManifestsOrLockfilesMutated, false);
  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_ROOT_RENDER_E2E_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_ROOT_RENDER_E2E_SUPPORTING_TARGETS
  );
  assert.deepEqual(
    oracle.fastReactTarget,
    REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages["@fast-react/react-dom"].version, "0.0.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM root render e2e oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorCompared: true,
    fastReactComparedToReactDom: true,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(
    oracle.packages["@fast-react/react-dom"].behaviorCompatibilityClaimed,
    false
  );
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, true);
});

test("React DOM root render e2e oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_DOM_ROOT_RENDER_E2E_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "Root creation",
    "Initial render",
    "Update render",
    "Replacement render",
    "Render null",
    "Unmount",
    "Unmount error",
    "flushSync",
    "Warnings"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
    assert.equal(
      oracle.reactDomObservations[mode.id].length,
      REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length
    );

    assert.deepEqual(
      oracle.reactDomObservations[mode.id].map((observation) =>
        observation.scenarioId
      ),
      REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS
    );

    for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
      assert.equal(reactObservation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(fastReactObservation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(
        reactObservation(mode.id, scenarioId).result.result.status,
        "ok"
      );
    }
  }
});

test("React DOM createRoot no-render side effects are recorded without child mutation", () => {
  const value = reactValue(
    "default-node-development",
    "create-root-no-render"
  );
  assert.equal(value.createRoot.status, "ok");
  assert.equal(value.createRoot.value.ownPropertyNames[0], "_internalRoot");
  assert.equal(value.createRoot.value.prototype.constructorName, "ReactDOMRoot");
  assert.equal(value.beforeTree.textContent, "preserved");
  assert.equal(value.afterTree.textContent, "preserved");
  assert.equal(value.createRootMutations.length, 0);
  assert.deepEqual(value.afterMarker.reactContainerMarkerValueStates, ["object"]);
  assert.deepEqual(value.afterMarker.reactListeningMarkerValueStates, [
    "boolean:true"
  ]);
  assert.equal(value.listenerSummary.listenerCount, 138);
  assert.equal(value.ownerDocumentListenerSummary.listenerCount, 1);
});

test("React DOM initial render and update return undefined and mutate host output", () => {
  const initial = reactValue("default-node-development", "initial-host-render");
  assert.deepEqual(initial.renderReturn, { type: "undefined" });
  assert.deepEqual(initial.flushSync.value, { type: "undefined" });
  assert.equal(initial.afterTree.childCount, 1);
  assert.equal(initial.afterTree.children[0].nodeName, "DIV");
  assert.equal(initial.afterTree.children[0].textContent, "hello");
  assert.deepEqual(
    attrMap(initial.afterTree.children[0]),
    {
      class: "root-card",
      "data-phase": "initial",
      id: "message",
      title: "initial title"
    }
  );
  assert.ok(
    initial.renderMutations.some(
      (mutation) =>
        mutation.type === "insertBefore" && mutation.child?.id === "message"
    )
  );

  const update = reactValue("default-node-development", "update-host-render");
  assert.deepEqual(update.updateReturn, { type: "undefined" });
  assert.deepEqual(update.updateFlushSync.value, { type: "undefined" });
  assert.equal(update.treeAfterUpdate.children[0].textContent, "goodbye");
  assert.deepEqual(
    attrMap(update.treeAfterUpdate.children[0]),
    {
      class: "root-card updated",
      "data-phase": "updated",
      id: "message",
      title: "updated title"
    }
  );
  assert.ok(
    update.updateMutations.some(
      (mutation) =>
        mutation.type === "setNodeValue" && mutation.value === "goodbye"
    )
  );
});

test("React DOM replacement, render-null, unmount, and double-unmount cleanup are recorded", () => {
  const replace = reactValue("default-node-development", "replace-host-tree");
  assert.equal(replace.treeAfterInitialRender.children[0].nodeName, "SPAN");
  assert.equal(replace.treeAfterReplace.children[0].nodeName, "SECTION");
  assert.equal(replace.treeAfterReplace.children[0].children[0].nodeName, "B");
  assert.ok(
    replace.replaceMutations.some(
      (mutation) =>
        mutation.type === "removeChild" && mutation.child?.id === "replace-before"
    )
  );
  assert.ok(
    replace.replaceMutations.some(
      (mutation) =>
        mutation.type === "insertBefore" && mutation.child?.id === "replace-after"
    )
  );

  const renderNull = reactValue(
    "default-node-development",
    "render-null-clears-container"
  );
  assert.deepEqual(renderNull.renderNullReturn, { type: "undefined" });
  assert.equal(renderNull.treeAfterRenderNull.childCount, 0);
  assert.deepEqual(
    renderNull.markerAfterRenderNull.reactContainerMarkerValueStates,
    ["object"]
  );
  assert.deepEqual(
    renderNull.rootAfterRenderNull.internalRootSlot.value.type,
    "object"
  );

  const unmount = reactValue("default-node-development", "root-unmount");
  assert.deepEqual(unmount.unmount.value, { type: "undefined" });
  assert.equal(unmount.treeAfterUnmount.childCount, 0);
  assert.deepEqual(unmount.markerAfterUnmount.reactContainerMarkerValueStates, [
    "null"
  ]);
  assert.deepEqual(unmount.rootAfterUnmount.internalRootSlot.value, {
    type: "null"
  });

  const doubleUnmount = reactValue("default-node-development", "double-unmount");
  assert.deepEqual(doubleUnmount.secondUnmount.value, { type: "undefined" });
  assert.deepEqual(doubleUnmount.secondUnmountMutations, []);
  assert.deepEqual(doubleUnmount.afterSecond.marker.reactContainerMarkerValueStates, [
    "null"
  ]);
});

test("React DOM render-after-unmount and flushSync multi-root behavior are recorded", () => {
  const stale = reactValue("default-node-development", "render-after-unmount");
  assert.equal(stale.renderAfterUnmount.status, "throws");
  assert.equal(
    stale.renderAfterUnmount.thrown.message,
    "Cannot update an unmounted root."
  );
  assert.deepEqual(stale.renderAfterUnmountMutations, []);

  const crossRoot = reactValue(
    "default-node-development",
    "flush-sync-cross-root-render"
  );
  assert.deepEqual(crossRoot.firstRenderReturn, { type: "undefined" });
  assert.deepEqual(crossRoot.secondRenderReturn, { type: "undefined" });
  assert.deepEqual(crossRoot.flushSync.value, {
    type: "string",
    value: "two-root-flush-complete"
  });
  assert.equal(crossRoot.firstTreeAfterFlush.textContent, "A");
  assert.equal(crossRoot.secondTreeAfterFlush.textContent, "B");
  assert.ok(
    crossRoot.mutations.some(
      (mutation) =>
        mutation.type === "insertBefore" && mutation.child?.id === "cross-a"
    )
  );
  assert.ok(
    crossRoot.mutations.some(
      (mutation) =>
        mutation.type === "insertBefore" && mutation.child?.id === "cross-b"
    )
  );
});

test("React DOM focused warning boundaries are development-only", () => {
  const development = reactValue(
    "default-node-development",
    "development-warning-boundaries"
  );
  assert.match(
    firstConsoleString(development.callbackSecondArg),
    /second callback argument/u
  );
  assert.match(
    firstConsoleString(development.containerSecondArg),
    /passed a container/u
  );
  assert.match(
    firstConsoleString(development.genericSecondArg),
    /only accepts one argument/u
  );
  assert.match(
    firstConsoleString(development.unmountCallback),
    /callback argument/u
  );
  assert.match(
    firstConsoleString(development.duplicateSecond),
    /already been passed to createRoot/u
  );

  const production = reactValue(
    "default-node-production",
    "development-warning-boundaries"
  );
  assert.equal(production.callbackSecondArg.consoleCalls.length, 0);
  assert.equal(production.containerSecondArg.consoleCalls.length, 0);
  assert.equal(production.genericSecondArg.consoleCalls.length, 0);
  assert.equal(production.unmountCallback.consoleCalls.length, 0);
  assert.equal(production.duplicateSecond.consoleCalls.length, 0);
});

test("Fast React root render e2e comparisons stay explicit and non-compatible", () => {
  for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
    const comparisons = oracle.fastReactComparisons[mode.id];
    assert.equal(comparisons.length, REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length);
    for (const comparison of comparisons) {
      assert.equal(comparison.status, "unsupported-placeholder");
      assert.equal(comparison.compatibilityClaimed, false);
      assert.notEqual(comparison.firstDifferencePath, null);
      assert.equal(comparison.fastReactResultStatus, "ok");
    }
  }
});

test("root render e2e conformance gate records private bridge request rows separately from public blocked rows", () => {
  const result = evaluateReactDomRootRenderE2EConformanceGate({
    checkedOracle: oracle,
    currentOracle: oracle
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.admittedScenarioModeRowCount, 0);
  assert.equal(result.summary.blockedScenarioModeRowCount, 20);
  assert.equal(result.summary.privateBridgeComparableScenarioModeRowCount, 18);
  assert.equal(result.summary.privateBridgeBlockedScenarioModeRowCount, 2);
  assert.equal(
    result.summary.privateHostOutputDiagnosticScenarioModeRowCount,
    18
  );
  assert.equal(result.summary.privateHostOutputBlockedScenarioModeRowCount, 2);
  assert.equal(result.summary.portalRootRenderPrerequisiteRowCount, 4);
  assert.equal(result.summary.portalRootRenderBlockedRowCount, 5);
  assert.equal(result.summary.compatibilityClaimed, false);
  assert.equal(result.summary.privateBridgeCompatibilityClaimed, false);
  assert.equal(result.summary.privateHostOutputCompatibilityClaimed, false);
  assert.equal(result.summary.portalRootRenderCompatibilityClaimed, false);
  assert.equal(result.summary.compatibilityAdmitted, false);
  assert.deepEqual(result.privateBridgeGate.admittedPrivateRequestScenarioIds, [
    "create-root-no-render",
    "initial-host-render",
    "update-host-render",
    "replace-host-tree",
    "render-null-clears-container",
    "root-unmount",
    "double-unmount",
    "render-after-unmount",
    "flush-sync-cross-root-render"
  ]);
  assert.deepEqual(result.privateBridgeGate.unsupportedPrivateRequestScenarioIds, [
    "development-warning-boundaries"
  ]);
  assert.deepEqual(
    result.privateHostOutputGate.admittedPrivateHostOutputScenarioIds,
    [
      "create-root-no-render",
      "initial-host-render",
      "update-host-render",
      "replace-host-tree",
      "render-null-clears-container",
      "root-unmount",
      "double-unmount",
      "render-after-unmount",
      "flush-sync-cross-root-render"
    ]
  );

  for (const row of result.blockedScenarioModeRows) {
    assert.equal(row.oracleRowAccepted, true);
    assert.equal(row.surface, "public-react-dom-client-root-facade");
    assert.equal(row.comparisonStatus, "unsupported-placeholder");
  }

  const requestCounts = Object.fromEntries(
    result.privateBridgeComparableScenarioModeRows
      .filter((row) => row.modeId === "default-node-development")
      .map((row) => [row.scenarioId, row.requestRecordCount])
  );
  assert.deepEqual(requestCounts, {
    "create-root-no-render": 1,
    "initial-host-render": 2,
    "update-host-render": 3,
    "replace-host-tree": 3,
    "render-null-clears-container": 3,
    "root-unmount": 3,
    "double-unmount": 4,
    "render-after-unmount": 3,
    "flush-sync-cross-root-render": 4
  });

  for (const row of result.privateBridgeComparableScenarioModeRows) {
    assert.equal(row.gateStatus, REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS);
    assert.equal(row.oracleRowAccepted, true);
    assert.equal(row.comparedToReactDomOracle, false);
    assert.equal(row.compatibilityClaimed, false);
    assert.equal(row.publicFacadeGateStatus, "blocked-unsupported-root-e2e");
  }

  for (const row of result.privateBridgeBlockedScenarioModeRows) {
    assert.equal(row.scenarioId, "development-warning-boundaries");
    assert.equal(row.gateStatus, REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_BLOCKED_STATUS);
    assert.equal(row.comparedToReactDomOracle, false);
    assert.equal(row.compatibilityClaimed, false);
  }

  for (const row of result.privateHostOutputDiagnosticScenarioModeRows) {
    assert.equal(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS
    );
    assert.equal(row.oracleRowAccepted, true);
    assert.equal(row.comparedToReactDomOracle, false);
    assert.equal(row.compatibilityClaimed, false);
    assert.equal(row.publicRootCompatibilitySurface, false);
    assert.equal(row.publicFacadeGateStatus, "blocked-unsupported-root-e2e");
    assert.equal(row.diagnosticKind, "private-fake-dom-root-host-output");
    assert.equal(
      row.rootSideEffectEvidence.record.sideEffectStatus,
      "applied-private-root-create-mark-listen-gate"
    );
    assert.equal(
      row.rootSideEffectEvidence.cleanup.record.sideEffectStatus,
      "reverted-private-root-create-mark-listen-gate"
    );
  }

  assert.deepEqual(
    new Set(
      result.privateHostOutputBlockedScenarioModeRows.map(
        (row) => row.gateStatus
      )
    ),
    new Set([REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_BLOCKED_STATUS])
  );
  assert.ok(
    result.privateHostOutputBlockedScenarioModeRows.every(
      (row) =>
        row.publicRootCompatibilitySurface === false &&
        row.comparedToReactDomOracle === false &&
        row.compatibilityClaimed === false
    )
  );
  assert.deepEqual(
    Array.from(
      new Set(
        result.privateHostOutputBlockedScenarioModeRows.map(
          (row) => row.scenarioId
        )
      )
    ),
    ["development-warning-boundaries"]
  );

  assert.equal(result.portalRootRenderGate.ok, true);
  assert.deepEqual(
    result.portalRootRenderPrerequisiteRows.map((row) => row.gateStatus),
    [
      REACT_DOM_PORTAL_ROOT_RENDER_OBJECT_ACCEPTED_STATUS,
      REACT_DOM_PORTAL_ROOT_RENDER_OBJECT_ACCEPTED_STATUS,
      REACT_DOM_PORTAL_ROOT_RENDER_RECONCILER_DIAGNOSTIC_STATUS,
      REACT_DOM_PORTAL_ROOT_RENDER_RECONCILER_DIAGNOSTIC_STATUS
    ]
  );
  assert.deepEqual(
    result.portalRootRenderBlockedRows.map((row) => row.id),
    [
      "portal-public-root-render",
      "portal-mounting",
      "portal-listener-setup",
      "portal-dom-mutation",
      "portal-compatibility-claim"
    ]
  );
  for (const row of result.portalRootRenderBlockedRows) {
    assert.equal(row.gateStatus, REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS);
    assert.equal(row.compatibilityClaimed, false);
    assert.equal(row.publicRootCompatibilitySurface, false);
    assert.equal(row.rootRenderE2EScenarioModeRowCount, 20);
  }
});

test("private root bridge request observations stay inert and private", () => {
  const observations = inspectReactDomRootRenderE2EPrivateBridgeRequests();

  assert.equal(observations.loadError, null);
  assert.equal(observations.rows.length, 18);

  for (const row of observations.rows) {
    assert.equal(row.status, "ok");
    assert.equal(row.sideEffects.publicCreateRootEnabled, false);
    assert.equal(row.sideEffects.publicHydrateRootEnabled, false);
    assert.equal(row.sideEffects.domMutationObserved, false);
    assert.equal(row.sideEffects.listenerInstallationObserved, false);
    assert.equal(row.sideEffects.markerWriteObserved, false);
    assert.equal(row.sideEffects.hydrationRequested, false);
    assert.equal(row.sideEffects.nativeExecutionObserved, false);
    assert.equal(row.sideEffects.compatibilityClaimed, false);
    assert.equal(row.sideEffects.containerMutationCount, 0);
    assert.equal(row.sideEffects.containerListenerRegistrationCount, 0);
    assert.equal(row.sideEffects.containerMarkerPropertyCount, 0);
    assert.ok(row.requestRecords.length > 0);
    assert.ok(
      row.requestRecords.every((record) => record.nativeExecution === false)
    );
  }

  const staleRenderRow = observations.rows.find(
    (row) =>
      row.modeId === "default-node-development" &&
      row.scenarioId === "render-after-unmount"
  );
  assert.deepEqual(staleRenderRow.thrownOperations, [
    {
      operation: "root.render",
      error: {
        code: "FAST_REACT_DOM_UNMOUNTED_ROOT",
        message: "Cannot update an unmounted root."
      }
    }
  ]);
});

test("private host-output diagnostics admit only explicit fake-DOM evidence", () => {
  const observations =
    inspectReactDomRootRenderE2EPrivateHostOutputDiagnostics();

  assert.equal(observations.loadError, null);
  assert.equal(observations.rows.length, 18);

  for (const row of observations.rows) {
    assert.equal(row.status, "ok");
    assert.equal(row.evidence.comparedToReactDomOracle, false);
    assert.equal(row.evidence.compatibilityClaimed, false);
    assert.equal(row.evidence.publicRootCompatibilitySurface, false);
    assert.equal(
      row.evidence.rootSideEffectEvidence.record.sideEffectStatus,
      "applied-private-root-create-mark-listen-gate"
    );
    assert.equal(
      row.evidence.rootSideEffectEvidence.cleanup.record.sideEffectStatus,
      "reverted-private-root-create-mark-listen-gate"
    );
    assert.equal(
      row.evidence.rootSideEffectEvidence.afterApply
        .containerListenerRegistrationCount,
      138
    );
    assert.equal(
      row.evidence.rootSideEffectEvidence.afterApply
        .ownerDocumentListenerRegistrationCount,
      1
    );
    assert.equal(
      row.evidence.rootSideEffectEvidence.cleanup.afterCleanup
        .containerListenerRegistrationCount,
      0
    );
    assert.ok(
      row.evidence.rootBridgeEvidence.nativeHandoffs.every(
        (handoff) =>
          handoff.nativeExecution === false &&
          handoff.reconcilerExecution === false &&
          handoff.domMutation === false &&
          handoff.compatibilityClaimed === false
      )
    );
  }

  const initial = observations.rows.find(
    (row) =>
      row.modeId === "default-node-development" &&
      row.scenarioId === "initial-host-render"
  );
  assert.equal(initial.evidence.hostOutputEvidence.containerTextContent, "hello");
  assert.deepEqual(initial.evidence.hostOutputEvidence.attributes, [
    ["class", "root-card"],
    ["data-phase", "initial"],
    ["id", "message"],
    ["title", "initial title"]
  ]);
  assert.equal(initial.evidence.hostOutputEvidence.latestPropsPublished, true);

  const update = observations.rows.find(
    (row) =>
      row.modeId === "default-node-development" &&
      row.scenarioId === "update-host-render"
  );
  assert.equal(update.evidence.hostOutputEvidence.containerTextContent, "goodbye");
  assert.deepEqual(update.evidence.hostOutputEvidence.textWriteLog, [
    ["nodeValue", "goodbye"]
  ]);

  const replace = observations.rows.find(
    (row) =>
      row.modeId === "default-node-development" &&
      row.scenarioId === "replace-host-tree"
  );
  assert.equal(
    replace.evidence.hostOutputEvidence.initialContainerTextContent,
    "before"
  );
  assert.equal(
    replace.evidence.hostOutputEvidence.replaceContainerTextContent,
    "after"
  );
  assert.deepEqual(replace.evidence.hostOutputEvidence.replaceMutationLog, [
    ["removeChild", "SPAN"],
    ["appendChild", "SECTION"]
  ]);
  assert.equal(
    replace.evidence.hostOutputEvidence.removedHostDetachedFromLatestPropsMap,
    true
  );

  const renderNull = observations.rows.find(
    (row) =>
      row.modeId === "default-node-development" &&
      row.scenarioId === "render-null-clears-container"
  );
  assert.equal(
    renderNull.evidence.hostOutputEvidence.containerChildCountAfterRenderNull,
    0
  );
  assert.equal(
    renderNull.evidence.hostOutputEvidence.rootSideEffectStateAfterRenderNull
      .containerMarkerTruthyCount,
    1
  );

  const unmount = observations.rows.find(
    (row) =>
      row.modeId === "default-node-development" &&
      row.scenarioId === "root-unmount"
  );
  assert.equal(
    unmount.evidence.hostOutputEvidence.containerChildCountAfterUnmount,
    0
  );
  assert.equal(
    unmount.evidence.hostOutputEvidence.hostDetachedFromLatestPropsMap,
    true
  );

  const doubleUnmount = observations.rows.find(
    (row) =>
      row.modeId === "default-node-development" &&
      row.scenarioId === "double-unmount"
  );
  assert.equal(
    doubleUnmount.evidence.hostOutputEvidence.secondUnmountBridgeNoOp,
    true
  );
  assert.deepEqual(
    doubleUnmount.evidence.hostOutputEvidence.secondUnmountMutationLog,
    []
  );

  const renderAfterUnmount = observations.rows.find(
    (row) =>
      row.modeId === "default-node-development" &&
      row.scenarioId === "render-after-unmount"
  );
  assert.deepEqual(
    renderAfterUnmount.evidence.rootBridgeEvidence.thrownOperations,
    [
      {
        operation: "root.render",
        error: {
          code: "FAST_REACT_DOM_UNMOUNTED_ROOT",
          message: "Cannot update an unmounted root."
        }
      }
    ]
  );
  assert.deepEqual(
    renderAfterUnmount.evidence.hostOutputEvidence
      .renderAfterUnmountMutationLog,
    []
  );

  const crossRoot = observations.rows.find(
    (row) =>
      row.modeId === "default-node-development" &&
      row.scenarioId === "flush-sync-cross-root-render"
  );
  assert.equal(
    crossRoot.evidence.hostOutputEvidence.firstRoot.containerTextContent,
    "A"
  );
  assert.equal(
    crossRoot.evidence.hostOutputEvidence.secondRoot.containerTextContent,
    "B"
  );
  assert.deepEqual(
    crossRoot.evidence.hostOutputEvidence.flushSyncEvidence.callbackEvents,
    ["root.render:first", "root.render:second", "flushSyncWork"]
  );
  assert.equal(
    crossRoot.evidence.hostOutputEvidence.flushSyncEvidence
      .flushSyncWorkCallCount,
    1
  );
  assert.equal(
    crossRoot.evidence.hostOutputEvidence.flushSyncEvidence
      .committedRootCountAfterFlush,
    2
  );
  assert.equal(
    crossRoot.evidence.hostOutputEvidence.flushSyncEvidence
      .privateReconcilerDiagnostics.crossRootDiagnosticTestPresent,
    true
  );
  assert.equal(
    crossRoot.evidence.hostOutputEvidence.flushSyncEvidence
      .publicFlushSyncCompatibilityClaimed,
    false
  );
});

test("React DOM root render e2e oracle artifact does not leak paths or randomized markers", () => {
  const oracleText = readCheckedReactDomRootRenderE2EOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-root-render-e2e-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
  assert.doesNotMatch(oracleText, /__react(?:Container|Fiber|Props|Events)\$/u);
  assert.doesNotMatch(oracleText, /_reactListening[A-Za-z0-9]/u);
});

test("print React DOM root render e2e oracle CLI emits the checked-in artifact", () => {
  const checkedText = readCheckedReactDomRootRenderE2EOracleText();
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-root-render-e2e-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: checkedText.length + 1024
    }
  );

  assert.equal(output, checkedText);
});

function reactObservation(modeId, scenarioId) {
  return findReactDomRootRenderE2EObservation(
    oracle,
    modeId,
    oracle.reactDomTarget.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findReactDomRootRenderE2EObservation(
    oracle,
    modeId,
    oracle.fastReactTarget.packageName,
    scenarioId
  );
}

function reactValue(modeId, scenarioId) {
  const result = reactObservation(modeId, scenarioId).result.result;
  assert.equal(result.status, "ok", `${modeId}:${scenarioId} should be ok`);
  return result.value;
}

function attrMap(node) {
  return Object.fromEntries(node.attributes);
}

function firstConsoleString(operation) {
  const firstArg = operation.consoleCalls[0]?.args[0];
  assert.equal(firstArg?.type, "string");
  return firstArg.value;
}
