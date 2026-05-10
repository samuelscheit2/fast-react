import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DOM_REF_CALLBACK_ORACLE_ARTIFACT_PATH,
  DOM_REF_CALLBACK_PROBE_MODES,
  DOM_REF_CALLBACK_REACT_DOM_TARGET,
  DOM_REF_CALLBACK_SUPPORTING_TARGETS
} from "../src/dom-ref-callback-targets.mjs";
import {
  DOM_REF_CALLBACK_SCENARIO_IDS,
  DOM_REF_CALLBACK_SCENARIOS
} from "../src/dom-ref-callback-scenarios.mjs";
import {
  formatDomRefCallbackOracleAsMarkdown,
  findDomRefCallbackObservation,
  readCheckedDomRefCallbackOracle,
  readCheckedDomRefCallbackOracleText
} from "../src/dom-ref-callback-oracle.mjs";

const oracle = readCheckedDomRefCallbackOracle();
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const componentTree = require(
  path.join(repoRoot, "packages/react-dom/src/client/component-tree.js")
);
const refCallbackGate = require(
  path.join(repoRoot, "packages/react-dom/src/client/ref-callback-gate.js")
);
const rootBridge = require(
  path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
);

test("checked React DOM ref callback oracle artifact has expected schema and targets", () => {
  assert.equal(
    DOM_REF_CALLBACK_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-dom-ref-callback-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-dom-ref-callback-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact React, React DOM, and scheduler npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactDomTarget, DOM_REF_CALLBACK_REACT_DOM_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    DOM_REF_CALLBACK_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM ref callback oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-fast-react-react-dom-comparison"
    ),
    true
  );
  assert.equal(
    oracle.intentionalGaps.some((gap) => gap.id === "synchronous-flushsync-only"),
    true
  );
});

test("React DOM ref callback oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, DOM_REF_CALLBACK_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, DOM_REF_CALLBACK_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "host callback ref ordering",
    "callback ref updates",
    "callback ref cleanup return",
    "object refs",
    "StrictMode ref behavior",
    "error propagation"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of DOM_REF_CALLBACK_PROBE_MODES) {
    assert.equal(
      oracle.observations[mode.id].length,
      DOM_REF_CALLBACK_SCENARIO_IDS.length
    );

    for (const scenarioId of DOM_REF_CALLBACK_SCENARIO_IDS) {
      const observation = observationFor(mode.id, scenarioId);
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.nodeEnv, mode.nodeEnv);
      assert.equal(observation.condition, mode.condition);
      assert.equal(observation.result.scenarioId, scenarioId);
      assert.equal(observation.result.result.status, "ok");
      assert.deepEqual(observation.result.consoleCalls, []);
    }
  }
});

test("nested host callback refs attach child before parent and detach parent before child", () => {
  for (const mode of modeIds()) {
    const value = resultValue(mode, "nested-host-callback-ref-mount-unmount");

    assert.deepEqual(operationStatuses(value), {
      mount: "ok",
      unmount: "ok"
    });
    assert.deepEqual(eventSignatures(value.events), [
      "callback-ref:child:attach:div",
      "callback-ref:parent:attach:section",
      "callback-ref:parent:detach:null",
      "callback-ref:child:detach:null"
    ]);
    assert.deepEqual(value.finalContainer, {
      childCount: 0,
      children: []
    });
  }
});

test("stable and replaced callback ref updates record deterministic attach/detach ordering", () => {
  for (const mode of modeIds()) {
    const stable = resultValue(mode, "stable-callback-ref-update");
    assert.deepEqual(eventSignatures(stable.events), [
      "callback-ref:stable:attach:div",
      "callback-ref:stable:detach:null"
    ]);
    assert.equal(stable.operations[1].label, "update");
    assert.equal(stable.operations[1].status, "ok");

    const identity = resultValue(mode, "callback-ref-identity-update");
    assert.deepEqual(eventSignatures(identity.events), [
      "callback-ref:first:attach:div",
      "callback-ref:first:detach:null",
      "callback-ref:second:attach:div",
      "callback-ref:second:detach:null"
    ]);
    assert.equal(
      identity.events[0].node.id,
      identity.events[2].node.id,
      "host node identity should be reused when only the callback ref changes"
    );

    const replacement = resultValue(mode, "host-type-replacement-update");
    assert.deepEqual(eventSignatures(replacement.events), [
      "callback-ref:host:attach:div",
      "callback-ref:host:detach:null",
      "callback-ref:host:attach:span",
      "callback-ref:host:detach:null"
    ]);
    assert.notEqual(
      replacement.events[0].node.id,
      replacement.events[2].node.id,
      "host type replacement should attach a new host node"
    );
  }
});

test("callback cleanup returns replace null detach calls on update and unmount", () => {
  for (const mode of modeIds()) {
    const value = resultValue(mode, "callback-cleanup-return-update-unmount");

    assert.deepEqual(eventSignatures(value.events), [
      "callback-ref:first-cleanup:attach:div",
      "callback-cleanup:first-cleanup::div",
      "callback-ref:second-cleanup:attach:div",
      "callback-cleanup:second-cleanup::div"
    ]);
    assert.equal(
      value.events.some((event) => event.phase === "detach"),
      false,
      "cleanup-return refs should not receive null detach calls here"
    );
  }
});

test("object ref current is set before sibling callback attach and cleared before detach", () => {
  for (const mode of modeIds()) {
    const value = resultValue(mode, "object-ref-relative-order-and-replacement");

    assert.equal(value.events[0].label, "observer");
    assert.equal(value.events[0].phase, "attach");
    assert.equal(value.events[0].node.localName, "span");
    assert.equal(value.events[0].objectRefCurrent.localName, "div");

    assert.equal(operationByLabel(value, "after-mount").value.current.localName, "div");
    assert.equal(
      operationByLabel(value, "after-replace").value.current.localName,
      "section"
    );
    assert.equal(value.events[3].label, "observer");
    assert.equal(value.events[3].phase, "detach");
    assert.deepEqual(value.events[3].objectRefCurrent, {
      type: "null"
    });
    assert.deepEqual(operationByLabel(value, "after-unmount").value.current, {
      type: "null"
    });
  }
});

test("StrictMode ref replay is captured only in development", () => {
  const nullDetachDevelopment = resultValue(
    "default-node-development",
    "strict-mode-callback-null-detach-cycle"
  );
  assert.deepEqual(eventSignatures(nullDetachDevelopment.events), [
    "callback-ref:strict-null:attach:div",
    "callback-ref:strict-null:detach:null",
    "callback-ref:strict-null:attach:div",
    "callback-ref:strict-null:detach:null"
  ]);

  const nullDetachProduction = resultValue(
    "default-node-production",
    "strict-mode-callback-null-detach-cycle"
  );
  assert.deepEqual(eventSignatures(nullDetachProduction.events), [
    "callback-ref:strict-null:attach:div",
    "callback-ref:strict-null:detach:null"
  ]);

  const cleanupDevelopment = resultValue(
    "default-node-development",
    "strict-mode-callback-cleanup-cycle"
  );
  assert.deepEqual(eventSignatures(cleanupDevelopment.events), [
    "callback-ref:strict-cleanup:attach:div",
    "callback-cleanup:strict-cleanup::div",
    "callback-ref:strict-cleanup:attach:div",
    "callback-cleanup:strict-cleanup::div"
  ]);

  const cleanupProduction = resultValue(
    "default-node-production",
    "strict-mode-callback-cleanup-cycle"
  );
  assert.deepEqual(eventSignatures(cleanupProduction.events), [
    "callback-ref:strict-cleanup:attach:div",
    "callback-cleanup:strict-cleanup::div"
  ]);
});

test("callback ref attach and cleanup errors propagate through root onUncaughtError", () => {
  for (const mode of modeIds()) {
    const attachError = resultValue(
      mode,
      "callback-ref-attach-error-propagation"
    );
    assert.deepEqual(eventSignatures(attachError.events), [
      "callback-ref:throwing-attach:attach:div",
      "callback-ref:throwing-attach:detach:null",
      "root-error:onUncaughtError::"
    ]);
    assert.deepEqual(rootErrorMessages(attachError), [
      "throwing-attach attach error"
    ]);

    const cleanupError = resultValue(
      mode,
      "callback-ref-cleanup-error-propagation"
    );
    assert.deepEqual(eventSignatures(cleanupError.events), [
      "callback-ref:throwing-cleanup:attach:div",
      "callback-cleanup:throwing-cleanup::div",
      "root-error:onUncaughtError::"
    ]);
    assert.deepEqual(rootErrorMessages(cleanupError), [
      "throwing-cleanup cleanup error"
    ]);
  }
});

test("private DOM ref callback attach/detach gate records callback and object refs without side effects", () => {
  const rootOwner = {kind: "PrivateAttachDetachRoot"};
  const hostOwner = {kind: "PrivateAttachDetachHost"};
  const node = createElement("DIV");
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  let callbackCallCount = 0;
  function callbackRef() {
    callbackCallCount++;
    throw new Error("private gate must not invoke callback refs");
  }
  const objectRef = {current: "unchanged"};
  const latestProps = {id: "next", ref: objectRef};

  componentTree.attachHostInstanceNode(node, token, latestProps);

  const detachRecord = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "current-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "callback-ref-handle"},
    ref: callbackRef,
    expectedLatestRef: objectRef,
    sourceToken: "deletion-token:callback-ref",
    tokenPhase: refCallbackGate.REF_TOKEN_PHASE_DELETION,
    tokenTarget: refCallbackGate.REF_TOKEN_TARGET_INSTANCE,
    detachReason: refCallbackGate.REF_DETACH_REASON_REF_CHANGED
  });
  const attachRecord = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "finished-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "object-ref-handle"},
    ref: objectRef,
    sourceToken: "commit-token:object-ref",
    tokenPhase: refCallbackGate.REF_TOKEN_PHASE_COMMIT,
    tokenTarget: refCallbackGate.REF_TOKEN_TARGET_INSTANCE
  });

  const snapshot =
    refCallbackGate.createRefCallbackAttachDetachGateSnapshot({
      rootCommitRefMetadata: {
        detach: [detachRecord],
        attach: [attachRecord]
      }
    });

  assert.equal(
    snapshot.$$typeof,
    refCallbackGate.privateDomRefCallbackAttachDetachGateSnapshotType
  );
  assert.equal(
    snapshot.status,
    refCallbackGate.REF_CALLBACK_ATTACH_DETACH_GATE_STATUS
  );
  assert.equal(snapshot.recordCount, 2);
  assert.equal(snapshot.callbackRefRecordCount, 1);
  assert.equal(snapshot.objectRefRecordCount, 1);
  assert.equal(snapshot.callbackRefsInvoked, false);
  assert.equal(snapshot.objectRefsMutated, false);
  assert.equal(snapshot.rootErrorsReported, false);
  assert.equal(
    snapshot.errorPropagationStatus,
    refCallbackGate.REF_CALLBACK_ERROR_PROPAGATION_STATUS
  );
  assert.equal(snapshot.errorPropagation.willReportRootErrors, false);
  assert.equal(
    snapshot.blockedCapabilities.some(
      (capability) => capability.id === "root-error-propagation"
    ),
    true
  );
  assert.deepEqual(
    snapshot.records.map((record) => [
      record.sequence,
      record.action,
      record.refKind,
      record.operation,
      record.ordering.phase,
      record.hostNodeRecordKind,
      record.errorPropagationStatus,
      record.callbackRefsInvoked,
      record.objectRefsMutated
    ]),
    [
      [
        0,
        refCallbackGate.REF_ACTION_DETACH,
        refCallbackGate.REF_KIND_CALLBACK,
        refCallbackGate.REF_OPERATION_CALLBACK_DETACH,
        "mutation-ref-detach",
        componentTree.HOST_INSTANCE_NODE_RECORD_KIND,
        refCallbackGate.REF_CALLBACK_ERROR_PROPAGATION_STATUS,
        false,
        false
      ],
      [
        1,
        refCallbackGate.REF_ACTION_ATTACH,
        refCallbackGate.REF_KIND_OBJECT,
        refCallbackGate.REF_OPERATION_OBJECT_ATTACH,
        "layout-ref-attach",
        componentTree.HOST_INSTANCE_NODE_RECORD_KIND,
        refCallbackGate.REF_CALLBACK_ERROR_PROPAGATION_STATUS,
        false,
        false
      ]
    ]
  );

  for (const record of snapshot.records) {
    assert.equal(
      refCallbackGate.isPrivateRefCallbackAttachDetachGateRecord(record),
      true
    );
    assert.equal(Object.hasOwn(record, "ref"), false);
    assert.equal(Object.hasOwn(record, "node"), false);
    assert.equal(Object.hasOwn(record, "latestProps"), false);
    assert.equal(record.hostNodeRecord.exposesHostNode, false);
    assert.equal(record.hostNodeRecord.exposesLatestProps, false);
  }

  const attachPayload =
    refCallbackGate.getPrivateRefCallbackAttachDetachGateRecordPayload(
      snapshot.records[1]
    );
  assert.equal(attachPayload.hostNode.node, node);
  assert.equal(attachPayload.hostNode.latestProps, latestProps);
  assert.equal(attachPayload.ref, objectRef);
  assert.equal(callbackCallCount, 0);
  assert.equal(objectRef.current, "unchanged");
  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("private controlled DOM ref callback invocation gate records fake host callbacks and cleanup returns", () => {
  const rootOwner = {kind: "PrivateControlledInvocationRoot"};
  const hostOwner = {kind: "PrivateControlledInvocationHost"};
  const node = createElement("DIV");
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const callbackArguments = [];
  let cleanupCallCount = 0;

  function cleanupReturn() {
    cleanupCallCount++;
    return "cleanup-result";
  }

  function callbackRef(value) {
    callbackArguments.push(value);
    return cleanupReturn;
  }

  const latestProps = {id: "controlled", ref: callbackRef};
  componentTree.attachHostInstanceNode(node, token, latestProps);

  const attachRecord = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "controlled-attach-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "callback-ref-handle"},
    ref: callbackRef,
    sourceToken: "commit-token:controlled-callback",
    tokenPhase: refCallbackGate.REF_TOKEN_PHASE_COMMIT,
    tokenTarget: refCallbackGate.REF_TOKEN_TARGET_INSTANCE
  });
  const attachSnapshot =
    refCallbackGate.createRefCallbackControlledInvocationGateSnapshot({
      rootCommitRefMetadata: {
        detach: [],
        attach: [attachRecord]
      }
    });

  assert.equal(
    attachSnapshot.$$typeof,
    refCallbackGate.privateDomRefCallbackControlledInvocationGateSnapshotType
  );
  assert.equal(
    attachSnapshot.status,
    refCallbackGate.REF_CALLBACK_CONTROLLED_INVOCATION_GATE_STATUS
  );
  assert.equal(attachSnapshot.recordCount, 1);
  assert.equal(attachSnapshot.callbackRefRecordCount, 1);
  assert.equal(attachSnapshot.objectRefRecordCount, 0);
  assert.equal(attachSnapshot.callbackInvocationAttemptCount, 1);
  assert.equal(attachSnapshot.callbackCleanupReturnCount, 1);
  assert.equal(attachSnapshot.cleanupInvocationAttemptCount, 0);
  assert.equal(attachSnapshot.fakeHostNodeRecordCount, 1);
  assert.equal(attachSnapshot.callbackRefsInvoked, true);
  assert.equal(attachSnapshot.objectRefsMutated, false);
  assert.equal(attachSnapshot.publicRootsTouched, false);
  assert.equal(attachSnapshot.rootErrorsReported, false);
  assert.equal(attachSnapshot.compatibilityClaimed, false);
  assert.equal(
    attachSnapshot.publicRefCompatibilityStatus,
    refCallbackGate.REF_CALLBACK_PUBLIC_REF_COMPATIBILITY_STATUS
  );
  assert.deepEqual(
    attachSnapshot.blockedCapabilities.map((capability) => capability.id),
    [
      "object-ref-mutation",
      "layout-effect-execution",
      "dom-mutation",
      "public-root-integration",
      "root-error-propagation",
      "react-dom-ref-compatibility-claim"
    ]
  );
  assert.equal(callbackArguments.length, 1);
  assert.notEqual(callbackArguments[0], node);
  assert.deepEqual(callbackArguments[0], {
    isConnected: true,
    localName: "div",
    namespaceURI: null,
    nodeName: "DIV",
    nodeType: 1,
    tagName: "DIV"
  });
  assert.equal(Object.isFrozen(callbackArguments[0]), true);
  assert.equal(cleanupCallCount, 0);

  const attachGateRecord = attachSnapshot.records[0];
  assert.equal(
    refCallbackGate.isPrivateRefCallbackControlledInvocationGateRecord(
      attachGateRecord
    ),
    true
  );
  assert.equal(
    componentTree.isPrivateRefCallbackFakeHostNodeRecord(
      attachGateRecord.fakeHostNodeRecord
    ),
    true
  );
  assert.equal(
    attachGateRecord.invocationKind,
    refCallbackGate.REF_CALLBACK_INVOCATION_ATTACH
  );
  assert.equal(
    attachGateRecord.invocationStatus,
    refCallbackGate.REF_CALLBACK_INVOCATION_STATUS_OK
  );
  assert.equal(
    attachGateRecord.callbackReturnStatus,
    refCallbackGate.REF_CALLBACK_RETURN_CLEANUP
  );
  assert.equal(attachGateRecord.callbackCleanupReturnRecorded, true);
  assert.equal(attachGateRecord.exposesRefValue, false);
  assert.equal(attachGateRecord.exposesRefCleanup, false);
  assert.equal(attachGateRecord.exposesHostNode, false);
  assert.equal(attachGateRecord.exposesFakeHostNode, false);
  assert.equal(Object.hasOwn(attachGateRecord, "ref"), false);
  assert.equal(Object.hasOwn(attachGateRecord, "node"), false);
  assert.equal(Object.hasOwn(attachGateRecord, "latestProps"), false);

  const attachPayload =
    refCallbackGate.getPrivateRefCallbackControlledInvocationGateRecordPayload(
      attachGateRecord
    );
  assert.equal(attachPayload.hostNode.node, node);
  assert.equal(attachPayload.fakeHostNode, callbackArguments[0]);
  assert.equal(attachPayload.callbackReturn, cleanupReturn);
  assert.equal(attachPayload.cleanupReturn, cleanupReturn);
  assert.equal(attachPayload.error, null);

  const detachRecord = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "controlled-detach-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "callback-ref-handle"},
    ref: callbackRef,
    refCleanup: cleanupReturn,
    sourceToken: "deletion-token:controlled-cleanup",
    tokenPhase: refCallbackGate.REF_TOKEN_PHASE_DELETION,
    tokenTarget: refCallbackGate.REF_TOKEN_TARGET_INSTANCE,
    detachReason: refCallbackGate.REF_DETACH_REASON_DELETED
  });
  const detachSnapshot =
    refCallbackGate.createRefCallbackControlledInvocationGateSnapshot({
      rootCommitRefMetadata: {
        detach: [detachRecord],
        attach: []
      }
    });

  assert.equal(detachSnapshot.callbackInvocationAttemptCount, 0);
  assert.equal(detachSnapshot.cleanupInvocationAttemptCount, 1);
  assert.equal(detachSnapshot.callbackCleanupReturnsInvoked, true);
  assert.equal(detachSnapshot.callbackRefsInvoked, false);
  assert.equal(detachSnapshot.publicRootsTouched, false);
  assert.equal(detachSnapshot.compatibilityClaimed, false);
  assert.equal(cleanupCallCount, 1);
  assert.equal(
    callbackArguments.length,
    1,
    "cleanup detach must replace the callback(null) detach call"
  );
  assert.equal(
    detachSnapshot.records[0].invocationKind,
    refCallbackGate.REF_CALLBACK_INVOCATION_CLEANUP_RETURN
  );
  assert.equal(
    detachSnapshot.records[0].cleanupReturnStatus,
    refCallbackGate.REF_CALLBACK_RETURN_VALUE
  );
  assert.equal(detachSnapshot.records[0].callbackRefsInvoked, false);
  assert.equal(detachSnapshot.records[0].callbackCleanupReturnsInvoked, true);
  const detachPayload =
    refCallbackGate.getPrivateRefCallbackControlledInvocationGateRecordPayload(
      detachSnapshot.records[0]
    );
  assert.equal(detachPayload.refCleanup, cleanupReturn);
  assert.equal(detachPayload.cleanupReturn, cleanupReturn);
  assert.equal(detachPayload.error, null);

  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("private root-commit ref callback execution handoff proves cleanup detach before changed attach without public roots", () => {
  const rootOwner = {kind: "PrivateRootCommitRefExecutionHandoffRoot"};
  const hostOwner = {kind: "PrivateRootCommitRefExecutionHandoffHost"};
  const node = createElement("DIV");
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const events = [];

  function firstCleanup() {
    events.push("first:cleanup");
  }

  function secondCleanup() {
    events.push("second:cleanup");
  }

  function firstRef(value) {
    events.push(`first:attach:${value.localName}`);
    return firstCleanup;
  }

  function secondRef(value) {
    events.push(`second:attach:${value.localName}`);
    return secondCleanup;
  }

  const updateProps = {id: "changed-ref", ref: secondRef};
  componentTree.attachHostInstanceNode(node, token, updateProps);

  const detachRecord = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "changed-current-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "first-ref-handle"},
    ref: firstRef,
    refCleanup: firstCleanup,
    expectedLatestRef: secondRef,
    sourceToken: "deletion-token:first-cleanup",
    tokenPhase: refCallbackGate.REF_TOKEN_PHASE_DELETION,
    tokenTarget: refCallbackGate.REF_TOKEN_TARGET_INSTANCE,
    detachReason: refCallbackGate.REF_DETACH_REASON_REF_CHANGED
  });
  const attachRecord = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "changed-finished-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "second-ref-handle"},
    ref: secondRef,
    sourceToken: "commit-token:second-attach",
    tokenPhase: refCallbackGate.REF_TOKEN_PHASE_COMMIT,
    tokenTarget: refCallbackGate.REF_TOKEN_TARGET_INSTANCE
  });

  const handoff = refCallbackGate.createRefCallbackExecutionHandoffRecord({
    rootCommitRefMetadata: {
      detach: [detachRecord],
      attach: [attachRecord]
    }
  });

  assert.equal(
    handoff.$$typeof,
    refCallbackGate.privateDomRefCallbackExecutionHandoffRecordType
  );
  assert.equal(
    handoff.status,
    refCallbackGate.REF_CALLBACK_EXECUTION_HANDOFF_STATUS
  );
  assert.equal(
    refCallbackGate.isPrivateRefCallbackExecutionHandoffRecord(handoff),
    true
  );
  assert.equal(handoff.recordCount, 2);
  assert.equal(handoff.detachCount, 1);
  assert.equal(handoff.attachCount, 1);
  assert.equal(handoff.callbackRefRecordCount, 2);
  assert.equal(handoff.objectRefRecordCount, 0);
  assert.equal(handoff.callbackInvocationAttemptCount, 1);
  assert.equal(handoff.cleanupInvocationAttemptCount, 1);
  assert.equal(handoff.callbackCleanupReturnCount, 1);
  assert.equal(handoff.cleanupReturnDetachCount, 1);
  assert.equal(handoff.callbackAttachInvocationCount, 1);
  assert.equal(handoff.callbackNullDetachAttemptCount, 0);
  assert.equal(handoff.changedRefDetachBeforeAttach, true);
  assert.equal(handoff.changedRefDetachSequence, 0);
  assert.equal(handoff.changedRefAttachSequence, 1);
  assert.equal(handoff.callbackRefsInvoked, true);
  assert.equal(handoff.callbackCleanupReturnsInvoked, true);
  assert.equal(handoff.objectRefsMutated, false);
  assert.equal(handoff.publicRootsTouched, false);
  assert.equal(handoff.rootErrorsReported, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.equal(handoff.executionSnapshot.publicRootsTouched, false);
  assert.equal(handoff.executionSnapshot.rootErrorsReported, false);
  assert.deepEqual(events, ["first:cleanup", "second:attach:div"]);
  assert.deepEqual(
    handoff.executionRecords.map((record) => [
      record.sequence,
      record.action,
      record.detachReason,
      record.invocationKind,
      record.cleanupReturnInvocationAttempted,
      record.callbackRefInvocationAttempted
    ]),
    [
      [
        0,
        refCallbackGate.REF_ACTION_DETACH,
        refCallbackGate.REF_DETACH_REASON_REF_CHANGED,
        refCallbackGate.REF_CALLBACK_INVOCATION_CLEANUP_RETURN,
        true,
        false
      ],
      [
        1,
        refCallbackGate.REF_ACTION_ATTACH,
        null,
        refCallbackGate.REF_CALLBACK_INVOCATION_ATTACH,
        false,
        true
      ]
    ]
  );
  assert.equal(
    handoff.blockedCapabilities.some(
      (capability) => capability.id === "object-ref-mutation"
    ),
    true
  );
  assert.equal(
    handoff.blockedCapabilities.some(
      (capability) => capability.id === "root-error-propagation"
    ),
    true
  );
  assert.equal(
    handoff.blockedCapabilities.some(
      (capability) => capability.id === "react-dom-ref-compatibility-claim"
    ),
    true
  );
  assert.equal(Object.hasOwn(handoff, "ref"), false);
  assert.equal(Object.hasOwn(handoff, "node"), false);
  assert.equal(Object.hasOwn(handoff, "latestProps"), false);

  const payload =
    refCallbackGate.getPrivateRefCallbackExecutionHandoffRecordPayload(
      handoff
    );
  assert.equal(payload.controlledInvocationSnapshot, handoff.executionSnapshot);
  assert.equal(
    payload.controlledInvocationPayload.invocationResults[0].metadata.ref,
    firstRef
  );
  assert.equal(
    payload.controlledInvocationPayload.invocationResults[0].metadata.refCleanup,
    firstCleanup
  );
  assert.equal(
    payload.controlledInvocationPayload.invocationResults[1].cleanupReturn,
    secondCleanup
  );

  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("private root bridge ref ordering diagnostic proves update identity and unmount cleanup without public roots", () => {
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const container = createContainer("DIV");
  const create = bridge.createClientRoot(container);
  const initialRender = bridge.renderContainer(create.handle, {
    props: {children: "initial"},
    type: "div"
  });
  const updateRender = bridge.renderContainer(create.handle, {
    props: {children: "updated"},
    type: "div"
  });
  const unmount = bridge.unmountContainer(create.handle);
  const rootOwner = rootBridge.getRootOwnerFromHandle(create.handle);
  const hostOwner = {kind: "PrivateHostOutputRefDiagnosticHost"};
  const node = createElement("DIV");
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const events = [];

  function firstCleanup() {
    events.push("first:cleanup");
  }
  function secondCleanup() {
    events.push("second:cleanup");
  }
  function firstRef(value) {
    events.push(`first:attach:${value.localName}`);
    return firstCleanup;
  }
  function secondRef(value) {
    events.push(`second:attach:${value.localName}`);
    return secondCleanup;
  }

  const initialProps = {id: "message", ref: firstRef};
  const updateProps = {id: "message", ref: secondRef};
  componentTree.attachHostInstanceNode(node, token, initialProps);

  const initialAttach = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "initial-finished-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "first-ref-handle"},
    ref: firstRef,
    sourceToken: "commit-token:first-attach"
  });

  const updateDetach = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "update-current-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "first-ref-handle"},
    ref: firstRef,
    refCleanup: firstCleanup,
    expectedLatestRef: secondRef,
    sourceToken: "deletion-token:first-cleanup",
    detachReason: refCallbackGate.REF_DETACH_REASON_REF_CHANGED
  });
  const updateAttach = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "update-finished-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "second-ref-handle"},
    ref: secondRef,
    sourceToken: "commit-token:second-attach"
  });
  const unmountDetach = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "unmount-current-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "second-ref-handle"},
    ref: secondRef,
    refCleanup: secondCleanup,
    sourceToken: "deletion-token:second-cleanup",
    detachReason: refCallbackGate.REF_DETACH_REASON_DELETED
  });

  const diagnostic =
    bridge.createRefCallbackHostOutputOrderingDiagnostic(
      [create, initialRender, updateRender, unmount],
      {
        steps: [
          {
            hostOutputCanary: "initial-host-output",
            label: "initial-ref-attach",
            rootCommitRefMetadata: {
              detach: [],
              attach: [initialAttach]
            }
          },
          {
            hostOutputCanary: "update-host-output",
            latestPropsUpdates: [
              {
                hostInstanceToken: token,
                latestProps: updateProps
              }
            ],
            label: "update-ref-change",
            rootCommitRefMetadata: {
              detach: [updateDetach],
              attach: [updateAttach]
            }
          },
          {
            hostOutputCanary: "unmount-host-output",
            label: "unmount-ref-cleanup",
            rootCommitRefMetadata: {
              detach: [unmountDetach],
              attach: []
            }
          }
        ]
      }
    );

  assert.equal(
    diagnostic.$$typeof,
    rootBridge.privateRootRefCallbackHostOutputOrderingDiagnosticRecordType
  );
  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC_ADMITTED
  );
  assert.equal(
    rootBridge.isPrivateRootRefCallbackHostOutputOrderingDiagnosticRecord(
      diagnostic
    ),
    true
  );
  assert.deepEqual(diagnostic.sourceOperations, [
    "create",
    "render",
    "render",
    "unmount"
  ]);
  assert.deepEqual(diagnostic.sourceRequestTypes, [
    "createRoot",
    "root.render",
    "root.render",
    "root.unmount"
  ]);
  assert.equal(diagnostic.updateRenderRequestCount, 1);
  assert.equal(diagnostic.unmountRequestCount, 1);
  assert.equal(diagnostic.updateBeforeUnmount, true);
  assert.equal(diagnostic.refOrderingStepCount, 3);
  assert.equal(diagnostic.refOrderingRecordCount, 4);
  assert.equal(diagnostic.callbackIdentityChangedCount, 1);
  assert.equal(diagnostic.callbackIdentityStableCount, 2);
  assert.equal(diagnostic.callbackCleanupReturnCount, 2);
  assert.equal(diagnostic.cleanupReturnMatchedCount, 2);
  assert.equal(diagnostic.cleanupInvocationAttemptCount, 2);
  assert.equal(diagnostic.callbackNullDetachAttemptCount, 0);
  assert.equal(diagnostic.hostIdentityReusedAfterDetachCount, 1);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.domMutation, false);
  assert.equal(diagnostic.rootErrorsReported, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(container.__mutationLog.length, 0);
  assert.deepEqual(events, [
    "first:attach:div",
    "first:cleanup",
    "second:attach:div",
    "second:cleanup"
  ]);

  const diagnosticPayload =
    rootBridge.getPrivateRootRefCallbackHostOutputOrderingDiagnosticPayload(
      diagnostic
    );
  assert.equal(diagnosticPayload.rootRequestRecords[0], create);
  assert.equal(diagnosticPayload.rootRequestRecords[2], updateRender);
  assert.equal(diagnosticPayload.rootRequestRecords[3], unmount);
  assert.equal(
    diagnosticPayload.refOrderingSnapshot,
    diagnostic.refOrderingSnapshot
  );

  const snapshot = diagnostic.refOrderingSnapshot;
  assert.equal(
    snapshot.$$typeof,
    refCallbackGate
      .privateDomRefCallbackHostOutputOrderingDiagnosticSnapshotType
  );
  assert.equal(
    refCallbackGate.isPrivateRefCallbackHostOutputOrderingDiagnosticSnapshot(
      snapshot
    ),
    true
  );
  assert.deepEqual(
    snapshot.records.map((record) => [
      record.sequence,
      record.hostOutputCanary,
      record.action,
      record.callbackIdentityStatus,
      record.hostIdentityStatus,
      record.cleanupReturnMatchesPreviousAttach,
      record.cleanupReturnInvoked,
      record.callbackCleanupReturnRecorded
    ]),
    [
      [
        0,
        "initial-host-output",
        refCallbackGate.REF_ACTION_ATTACH,
        "new-active-ref",
        "new-host",
        null,
        false,
        true
      ],
      [
        1,
        "update-host-output",
        refCallbackGate.REF_ACTION_DETACH,
        "matches-active-ref",
        "matches-active-host",
        true,
        true,
        false
      ],
      [
        2,
        "update-host-output",
        refCallbackGate.REF_ACTION_ATTACH,
        "changed-from-detached-ref",
        "reused-from-detach",
        null,
        false,
        true
      ],
      [
        3,
        "unmount-host-output",
        refCallbackGate.REF_ACTION_DETACH,
        "matches-active-ref",
        "matches-active-host",
        true,
        true,
        false
      ]
    ]
  );

  const updateAttachPayload =
    refCallbackGate
      .getPrivateRefCallbackHostOutputOrderingDiagnosticRecordPayload(
        snapshot.records[2]
      );
  assert.equal(updateAttachPayload.metadata.ref, secondRef);
  assert.equal(updateAttachPayload.detachedRefBeforeRecord.ref, firstRef);
  assert.equal(
    updateAttachPayload.controlledRecordPayload.cleanupReturn,
    secondCleanup
  );
  for (const record of snapshot.records) {
    assert.equal(Object.hasOwn(record, "ref"), false);
    assert.equal(Object.hasOwn(record, "node"), false);
    assert.equal(Object.hasOwn(record, "latestProps"), false);
    assert.equal(record.publicRootsTouched, false);
    assert.equal(record.compatibilityClaimed, false);
  }

  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("private controlled DOM ref callback invocation gate records errors without root reporting", () => {
  const rootOwner = {kind: "PrivateControlledErrorRoot"};
  const hostOwner = {kind: "PrivateControlledErrorHost"};
  const node = createElement("SPAN");
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const thrownError = new Error("private controlled ref error");

  function throwingRef() {
    throw thrownError;
  }

  componentTree.attachHostInstanceNode(node, token, {ref: throwingRef});
  const attachRecord = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: "throwing-attach-fiber"},
    stateNode: {id: "state-node"},
    refHandle: {id: "throwing-ref-handle"},
    ref: throwingRef,
    sourceToken: "commit-token:throwing-callback"
  });
  const snapshot =
    refCallbackGate.createRefCallbackControlledInvocationGateSnapshot({
      rootCommitRefMetadata: {
        detach: [],
        attach: [attachRecord]
      }
    });

  assert.equal(snapshot.callbackInvocationAttemptCount, 1);
  assert.equal(snapshot.callbackInvocationErrorCount, 1);
  assert.equal(snapshot.rootErrorsReported, false);
  assert.equal(
    snapshot.errorPropagationStatus,
    refCallbackGate.REF_CALLBACK_ERROR_PROPAGATION_STATUS
  );
  assert.equal(
    snapshot.records[0].invocationStatus,
    refCallbackGate.REF_CALLBACK_INVOCATION_STATUS_THROWN
  );
  assert.equal(snapshot.records[0].invocationErrorCaptured, true);
  const payload =
    refCallbackGate.getPrivateRefCallbackControlledInvocationGateRecordPayload(
      snapshot.records[0]
    );
  assert.equal(payload.error, thrownError);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("React DOM ref callback oracle artifact has no temp or local path leaks", () => {
  const oracleText = readCheckedDomRefCallbackOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-dom-ref-callback-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-dom-ref-callback-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-dom-ref-callback-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedDomRefCallbackOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedDomRefCallbackOracleText());
});

test("DOM ref callback oracle markdown summarizes observed root errors", () => {
  const markdown = formatDomRefCallbackOracleAsMarkdown(oracle);
  assert.match(
    markdown,
    /default-node-development: 10 observations, 2 root error reports/u
  );
  assert.match(
    markdown,
    /default-node-production: 10 observations, 2 root error reports/u
  );
});

function modeIds() {
  return DOM_REF_CALLBACK_PROBE_MODES.map((mode) => mode.id);
}

function observationFor(modeId, scenarioId) {
  return findDomRefCallbackObservation(oracle, modeId, scenarioId);
}

function resultValue(modeId, scenarioId) {
  const result = observationFor(modeId, scenarioId).result.result;
  assert.equal(result.status, "ok", `${modeId}:${scenarioId}`);
  return result.value;
}

function eventSignatures(events) {
  return events.map((event) => {
    const node = event.node?.type === "element" ? event.node.localName : event.node?.type ?? "";
    return `${event.event}:${event.label ?? event.channel}:${event.phase ?? ""}:${node}`;
  });
}

function operationStatuses(value) {
  return Object.fromEntries(
    value.operations.map((operation) => [operation.label, operation.status])
  );
}

function operationByLabel(value, label) {
  const operation = value.operations.find((candidate) => candidate.label === label);
  assert.ok(operation, `missing operation ${label}`);
  assert.equal(operation.status, "ok", label);
  return operation;
}

function rootErrorMessages(value) {
  return value.rootErrors.map((error) => error.error.message);
}

function createElement(localName) {
  return {
    localName: localName.toLowerCase(),
    nodeType: 1,
    parentNode: null
  };
}

function createContainer(nodeName) {
  return {
    __mutationLog: [],
    addEventListener() {},
    nodeName,
    nodeType: 1,
    ownerDocument: null
  };
}
