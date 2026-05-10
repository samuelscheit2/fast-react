import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";

import { DOM_CONTROLLED_INPUT_SCENARIOS } from "../src/dom-controlled-input-scenarios.mjs";
import {
  DOM_CONTROLLED_INPUT_ORACLE_ARTIFACT_PATH,
  DOM_CONTROLLED_INPUT_PROBE_MODES,
  DOM_CONTROLLED_INPUT_REACT_DOM_TARGET,
  DOM_CONTROLLED_INPUT_SUPPORTING_TARGETS
} from "../src/dom-controlled-input-targets.mjs";
import {
  findDomControlledInputClientObservation,
  findDomControlledInputPhase,
  findDomControlledInputServerObservation,
  readCheckedDomControlledInputOracle,
  readCheckedDomControlledInputOracleText
} from "../src/dom-controlled-input-oracle.mjs";
import {
  assertFastReactControlledFormUnsupportedGate
} from "../src/dom-controlled-input-unsupported-gates.mjs";

const require = createRequire(import.meta.url);
const resourceFormGate = require(
  "../../../packages/react-dom/src/resource-form-internals-gate.js"
);
const controlledRestoreQueue = require(
  "../../../packages/react-dom/src/client/controlled-restore-queue.js"
);
const componentTree = require(
  "../../../packages/react-dom/src/client/component-tree.js"
);
const eventListener = require(
  "../../../packages/react-dom/src/events/react-dom-event-listener.js"
);
const pluginEventSystem = require(
  "../../../packages/react-dom/src/events/plugin-event-system.js"
);

const oracle = readCheckedDomControlledInputOracle();

test("checked DOM controlled input oracle artifact has expected schema and targets", () => {
  assert.equal(
    DOM_CONTROLLED_INPUT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-dom-controlled-input-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-dom-controlled-input-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact React, React DOM, and scheduler npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per mode, scenario, and probe kind",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    pathNormalization:
      "temporary roots, package roots, file URLs, and local workspace paths are normalized before artifact serialization"
  });

  assert.deepEqual(oracle.reactDomTarget, DOM_CONTROLLED_INPUT_REACT_DOM_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    DOM_CONTROLLED_INPUT_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("DOM controlled input oracle keeps Fast React compatibility claims false", () => {
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
});

test("Fast React controlled form behavior stays unsupported until DOM adapters exist", () => {
  assertFastReactControlledFormUnsupportedGate(oracle);
});

test("private controlled restore queue diagnostic records fake-DOM intent without compatibility claims", () => {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: "controlled-oracle-restore"
  });
  const fakeInput = createPrivateControlledInputFakeDomTarget({
    value: "alpha"
  });
  const descriptorBefore = Object.getOwnPropertyDescriptor(fakeInput, "value");
  const install = gate.installFakeDomTracker(
    {
      scenarioId: "input-text-controlled-value-update",
      phaseId: "update",
      hostTag: "input",
      inputType: "text",
      props: {
        type: "text",
        value: "alpha",
        onChange() {}
      }
    },
    {
      explicitAdmission: true,
      adapterKind: "deterministic-fake-dom",
      targetKind: "controlled-input-value-tracker",
      fakeTarget: fakeInput
    }
  );

  fakeInput.value = "beta";
  const observation = gate.observeFakeDomTracker(install);
  const intent = gate.recordPostEventRestoreIntentFromFakeDomObservation(
    observation,
    {
      explicitAdmission: true,
      queueKind: "deterministic-fake-dom-post-event-restore-queue",
      queueId: "controlled-oracle-restore-queue",
      eventName: "input",
      targetKind: "controlled-input-restore-queue"
    }
  );

  assert.equal(
    intent.status,
    resourceFormGate.controlledInputPrivateRestoreQueueIntentRecordedStatus
  );
  assert.equal(intent.restoreIntent.sourceChanged, true);
  assert.equal(intent.restoreIntent.intentRecorded, true);
  assert.equal(intent.restoreIntent.restoreTargetWouldBeQueued, true);
  assert.equal(intent.restoreIntent.latestPropsLookupRequired, true);
  assert.equal(intent.restoreIntent.latestPropsLookupPerformed, false);
  assert.equal(intent.restoreIntent.eventPluginDispatchRequired, true);
  assert.equal(intent.restoreIntent.eventPluginDispatchPerformed, false);
  assert.equal(intent.restoreIntent.restoreQueueWritten, false);
  assert.equal(intent.restoreIntent.restoreStateIfNeededInvoked, false);
  assert.equal(intent.restoreIntent.restoreControlledStateInvoked, false);
  assert.equal(intent.restoreIntent.restoreFlushed, false);
  assert.equal(intent.postEventRestoreBoundary.restoreQueued, false);
  assert.equal(intent.postEventRestoreBoundary.restoreFlushed, false);
  assert.equal(intent.sideEffects.postEventRestoreQueued, false);
  assert.equal(intent.sideEffects.changeEventsObserved, false);
  assert.equal(intent.sideEffects.propertyDescriptorInstalled, false);
  assert.equal(intent.sideEffects.latestPropsLookup, false);
  assert.equal(intent.sideEffects.eventPluginDispatch, false);
  assert.equal(intent.sideEffects.restoreQueueWritten, false);
  assert.equal(intent.sideEffects.publicControlledBehaviorEnabled, false);
  assert.equal(intent.sideEffects.compatibilityClaimed, false);
  assert.equal(
    intent.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(Object.hasOwn(fakeInput, "_valueTracker"), false);
  assert.equal(descriptorBefore.get, undefined);
  assert.equal(descriptorBefore.set, undefined);
  assert.equal(
    Object.getOwnPropertyDescriptor(fakeInput, "value").get,
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(fakeInput, "value").set,
    undefined
  );
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);
});

test("private controlled post-event restore queue consumes event latest-props evidence only", () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: "controlled-oracle-event-restore"
    });
  const eventDispatch = createPrivateControlledEventDispatch({
    domEventName: "click",
    latestProps: {
      type: "checkbox",
      checked: true,
      onChange() {},
      onClick() {}
    },
    nodeName: "INPUT",
    value: "browser-mutated"
  });
  const descriptorBefore = Object.getOwnPropertyDescriptor(
    eventDispatch.targetNode,
    "value"
  );
  const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    eventDispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        "deterministic-event-latest-props-post-event-restore-queue",
      queueId: "controlled-oracle-event-restore-queue",
      eventName: "click",
      targetKind: "controlled-input-post-event-restore-queue"
    }
  );

  assert.equal(
    intent.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus
  );
  assert.equal(intent.hostTag, "input");
  assert.equal(intent.controlKind, "checked");
  assert.equal(intent.trackedField, "checked");
  assert.equal(
    intent.checkableRestoreMetadata.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus
  );
  assert.equal(intent.checkableRestoreMetadata.inputType, "checkbox");
  assert.equal(intent.checkableRestoreMetadata.checkedProp.present, true);
  assert.equal(intent.checkableRestoreMetadata.nameProp.present, false);
  assert.equal(
    intent.checkableRestoreMetadata.radioGroupRestoreRequired,
    false
  );
  assert.deepEqual(
    intent.groupIntentRecords.map((record) => ({
      status: record.status,
      groupKind: record.groupKind,
      skipReason: record.skipReason,
      groupLookupRequired: record.groupLookupRequired,
      groupLookupPerformed: record.groupLookupPerformed,
      siblingInputRestorePerformed: record.siblingInputRestorePerformed,
      valueTrackerRefreshed: record.valueTrackerRefreshed,
      realDomQueried: record.realDomQueried,
      browserInputMutated: record.browserInputMutated,
      compatibilityClaimed: record.compatibilityClaimed
    })),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioGroupIntentSkippedStatus,
        groupKind: "single-checkable",
        skipReason: "checkboxes-do-not-restore-radio-groups",
        groupLookupRequired: false,
        groupLookupPerformed: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        realDomQueried: false,
        browserInputMutated: false,
        compatibilityClaimed: false
      }
    ]
  );
  assert.equal(intent.restoreIntent.intentRecorded, true);
  assert.equal(intent.restoreIntent.restoreTargetWouldBeQueued, true);
  assert.equal(intent.restoreIntent.latestPropsEvidenceAccepted, true);
  assert.equal(intent.restoreIntent.latestPropsLookupPerformed, true);
  assert.equal(intent.restoreIntent.eventDispatchRecordAccepted, true);
  assert.equal(intent.restoreIntent.eventPluginDispatchPerformed, false);
  assert.equal(intent.restoreIntent.restoreQueueWritten, false);
  assert.equal(intent.restoreIntent.restoreQueueWriteOrderRecorded, true);
  assert.equal(intent.restoreIntent.restoreQueueFlushOrderRecorded, true);
  assert.equal(intent.restoreIntent.hostWrapperRestoreOrderRecorded, true);
  assert.equal(intent.restoreIntent.controlledStateRestoreInvoked, false);
  assert.equal(intent.restoreIntent.restoreFlushed, false);
  assert.equal(intent.restoreIntent.liveValueTrackerInstalled, false);
  assert.equal(intent.restoreIntent.valueTrackerFieldWritten, false);
  assert.equal(intent.restoreIntent.propertyDescriptorInstalled, false);
  assert.equal(intent.restoreIntent.hostValueRead, false);
  assert.equal(intent.restoreIntent.hostValueWritten, false);
  assert.equal(
    intent.restoreQueueOrdering.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWriteFlushOrderingStatus
  );
  assert.equal(
    intent.restoreQueueOrdering.acceptedRestoreKind,
    "input-checkbox-checked"
  );
  assert.equal(intent.restoreQueueOrdering.writeOrder.queueSlot, "primary");
  assert.equal(
    intent.restoreQueueOrdering.flushOrder.flushWouldBeRequiredAfterWrite,
    true
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.wrapperOperation,
    "input-checked-sync"
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.primaryHostWrapperRan,
    false
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.wrapperWritePerformed,
    false
  );
  assert.equal(intent.restoreQueueOrdering.hostValueWritten, false);
  assert.equal(intent.restoreQueueOrdering.browserInputMutated, false);
  assert.equal(intent.postEventRestoreBoundary.restoreQueued, false);
  assert.equal(intent.postEventRestoreBoundary.restoreFlushed, false);
  assert.equal(intent.sideEffects.restoreQueueWritten, false);
  assert.equal(intent.sideEffects.restoreQueueFlushed, false);
  assert.equal(intent.sideEffects.controlledStateRestoreScheduled, false);
  assert.equal(intent.sideEffects.controlledStateRestoreInvoked, false);
  assert.equal(intent.sideEffects.propertyDescriptorInstalled, false);
  assert.equal(intent.sideEffects.hostValueRead, false);
  assert.equal(intent.sideEffects.hostValueWritten, false);
  assert.equal(intent.sideEffects.publicControlledBehaviorEnabled, false);
  assert.equal(intent.sideEffects.compatibilityClaimed, false);
  assert.equal(
    intent.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(Object.hasOwn(eventDispatch.targetNode, "_valueTracker"), false);
  assert.equal(descriptorBefore.get, undefined);
  assert.equal(descriptorBefore.set, undefined);
  assert.equal(
    Object.getOwnPropertyDescriptor(eventDispatch.targetNode, "value").get,
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(eventDispatch.targetNode, "value").set,
    undefined
  );
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);

  componentTree.detachHostInstanceToken(eventDispatch.token);
});

test("private controlled radio post-event restore queue records group intent without DOM lookup", () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: "controlled-oracle-radio-restore"
    });
  const latestProps = {
    type: "radio",
    name: "choice",
    checked: true,
    onChange() {},
    onClick() {}
  };
  const eventDispatch = createPrivateControlledEventDispatch({
    domEventName: "click",
    latestProps,
    nodeName: "INPUT"
  });
  const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    eventDispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        "deterministic-event-latest-props-post-event-restore-queue",
      queueId: "controlled-oracle-radio-restore-queue",
      eventName: "click",
      targetKind: "controlled-input-post-event-restore-queue",
      radioGroupFormKey: "form:choice",
      radioGroupSiblingProps: [
        {
          formKey: "form:choice",
          props: {
            type: "radio",
            name: "choice",
            checked: false,
            defaultChecked: false,
            onChange() {}
          }
        },
        {
          formKey: "form:other",
          props: {
            type: "radio",
            name: "choice",
            checked: false,
            onChange() {}
          }
        }
      ]
    }
  );

  assert.equal(intent.inputType, "radio");
  assert.equal(intent.controlKind, "checked");
  assert.equal(intent.restoreIntent.intentRecorded, true);
  assert.equal(
    intent.checkableRestoreMetadata.radioGroupRestoreRequired,
    true
  );
  assert.equal(
    intent.checkableRestoreMetadata.radioGroupIntentRecorded,
    true
  );
  assert.equal(
    intent.restoreQueueOrdering.acceptedRestoreKind,
    "input-radio-checked"
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder
      .radioGroupRestoreWouldFollowPrimaryInputRestore,
    true
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder
      .radioValueTrackerRefreshWouldFollowSiblingRestore,
    true
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.radioGroupLookupPerformed,
    false
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.radioValueTrackerRefreshed,
    false
  );
  assert.deepEqual(
    intent.groupIntentRecords.map((record) => ({
      status: record.status,
      groupKind: record.groupKind,
      skipReason: record.skipReason,
      groupRestoreRequired: record.groupRestoreRequired,
      groupRestoreIntentRecorded: record.groupRestoreIntentRecorded,
      groupLookupRequired: record.groupLookupRequired,
      groupLookupPerformed: record.groupLookupPerformed,
      siblingLatestPropsLookupPerformed:
        record.siblingLatestPropsLookupPerformed,
      siblingInputRestorePerformed: record.siblingInputRestorePerformed,
      siblingPropsLookupStatus: record.siblingPropsLookup.status,
      siblingPropsCandidateCount: record.siblingPropsLookup.candidateCount,
      acceptedSameNameSameFormCount:
        record.siblingPropsLookup.acceptedSameNameSameFormCount,
      siblingPropsLiveLookupPerformed:
        record.siblingPropsLookup.livePropsLookupPerformed,
      siblingPropsFormTraversalPerformed:
        record.siblingPropsLookup.formTraversalPerformed,
      siblingPropsWrapperExecuted: record.siblingPropsLookup.wrapperExecuted,
      valueTrackerRefreshed: record.valueTrackerRefreshed,
      realDomQueried: record.realDomQueried,
      rawGroupNodesCaptured: record.rawGroupNodesCaptured,
      rawNameRetained: record.rawNameRetained,
      compatibilityClaimed: record.compatibilityClaimed
    })),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioGroupIntentRecordedStatus,
        groupKind: "radio-group",
        skipReason: null,
        groupRestoreRequired: true,
        groupRestoreIntentRecorded: true,
        groupLookupRequired: true,
        groupLookupPerformed: false,
        siblingLatestPropsLookupPerformed: false,
        siblingInputRestorePerformed: false,
        siblingPropsLookupStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsLookupRecordedStatus,
        siblingPropsCandidateCount: 2,
        acceptedSameNameSameFormCount: 1,
        siblingPropsLiveLookupPerformed: false,
        siblingPropsFormTraversalPerformed: false,
        siblingPropsWrapperExecuted: false,
        valueTrackerRefreshed: false,
        realDomQueried: false,
        rawGroupNodesCaptured: false,
        rawNameRetained: false,
        compatibilityClaimed: false
      }
    ]
  );
  assert.deepEqual(
    intent.radioGroupSiblingPropsLookup.records.map((record) => ({
      status: record.status,
      sameName: record.sameName,
      sameForm: record.sameForm,
      skipReason: record.skipReason,
      siblingWouldReceiveRestore: record.siblingWouldReceiveRestore,
      siblingLatestPropsLookupPerformed:
        record.siblingLatestPropsLookupPerformed,
      formTraversalPerformed: record.formTraversalPerformed,
      wrapperExecuted: record.wrapperExecuted,
      realDomQueried: record.realDomQueried,
      rawLatestPropsRetained: record.rawLatestPropsRetained,
      compatibilityClaimed: record.compatibilityClaimed
    })),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceAcceptedStatus,
        sameName: true,
        sameForm: true,
        skipReason: null,
        siblingWouldReceiveRestore: true,
        siblingLatestPropsLookupPerformed: false,
        formTraversalPerformed: false,
        wrapperExecuted: false,
        realDomQueried: false,
        rawLatestPropsRetained: false,
        compatibilityClaimed: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceSkippedStatus,
        sameName: true,
        sameForm: false,
        skipReason: "sibling-radio-form-does-not-match",
        siblingWouldReceiveRestore: false,
        siblingLatestPropsLookupPerformed: false,
        formTraversalPerformed: false,
        wrapperExecuted: false,
        realDomQueried: false,
        rawLatestPropsRetained: false,
        compatibilityClaimed: false
      }
    ]
  );
  assert.equal(intent.sideEffects.radioGroupRestoreIntentRecorded, true);
  assert.equal(intent.sideEffects.radioGroupSiblingMetadataRead, true);
  assert.equal(intent.sideEffects.radioGroupSiblingPropsEvidenceAccepted, true);
  assert.equal(intent.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(intent.sideEffects.radioGroupMembersEnumerated, false);
  assert.equal(intent.sideEffects.radioGroupLivePropsLookupPerformed, false);
  assert.equal(intent.sideEffects.radioGroupFormTraversalPerformed, false);
  assert.equal(intent.sideEffects.radioGroupValueTrackerRefreshed, false);
  assert.equal(intent.sideEffects.hostValueRead, false);
  assert.equal(intent.sideEffects.hostValueWritten, false);
  assert.equal(intent.sideEffects.browserInputMutated, false);
  assert.equal(Object.hasOwn(eventDispatch.targetNode, "_valueTracker"), false);
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);

  componentTree.detachHostInstanceToken(eventDispatch.token);
});

test("private controlled restore queue write preflight records intent rows without live writes", () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: "controlled-oracle-write-preflight"
    });
  const rows = [
    {
      domEventName: "input",
      latestProps: {
        type: "text",
        value: "alpha",
        onChange() {},
        onInput() {}
      },
      nodeName: "INPUT",
      queueId: "oracle-text-write-preflight",
      value: "browser-mutated"
    },
    {
      domEventName: "click",
      latestProps: {
        type: "radio",
        name: "choice",
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: "INPUT",
      queueId: "oracle-radio-write-preflight"
    }
  ];
  const records = rows.map((row) => {
    const dispatch = createPrivateControlledEventDispatch(row);
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          "deterministic-event-latest-props-post-event-restore-queue",
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: "controlled-input-post-event-restore-queue"
      }
    );
    return {dispatch, intent};
  });
  const preflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    {
      explicitAdmission: true,
      queueKind:
        "deterministic-controlled-input-post-event-restore-queue-write-preflight",
      queueId: "oracle-controlled-write-preflight-queue",
      targetKind: "controlled-input-post-event-restore-queue-write-preflight"
    }
  );

  assert.equal(
    preflight.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWritePreflightStatus
  );
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueWritePreflightRecord(
      preflight
    ),
    true
  );
  assert.deepEqual(
    preflight.writeIntentRows.map((row) => ({
      rowId: row.rowId,
      sourceRequestId: row.sourceRequestId,
      queueSlot: row.queueSlot,
      acceptedRestoreKind: row.acceptedRestoreKind,
      writeWouldRun: row.writeWouldRun,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      radioGroupLookupRequired: row.radioGroupLookupRequired,
      radioGroupLookupPerformed: row.radioGroupLookupPerformed,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: "controlled-oracle-write-preflight:3:row:1",
        sourceRequestId: "controlled-oracle-write-preflight:1",
        queueSlot: "restore-target",
        acceptedRestoreKind: "input-text-value",
        writeWouldRun: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        browserInputMutated: false
      },
      {
        rowId: "controlled-oracle-write-preflight:3:row:2",
        sourceRequestId: "controlled-oracle-write-preflight:2",
        queueSlot: "restore-queue",
        acceptedRestoreKind: "input-radio-checked",
        writeWouldRun: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        radioGroupLookupRequired: true,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        browserInputMutated: false
      }
    ]
  );
  assert.equal(preflight.writePlan.restoreQueueWritten, false);
  assert.equal(preflight.writePlan.restoreQueueFlushed, false);
  assert.equal(preflight.writePlan.hostWrapperInvoked, false);
  assert.equal(preflight.writePlan.radioGroupLookupPerformed, false);
  assert.equal(preflight.sideEffects.restoreQueueWritePreflightRecorded, true);
  assert.equal(preflight.sideEffects.restoreQueueWriteIntentRowCount, 2);
  assert.equal(preflight.sideEffects.restoreQueueWritten, false);
  assert.equal(preflight.sideEffects.restoreQueueFlushed, false);
  assert.equal(preflight.sideEffects.hostWrapperInvoked, false);
  assert.equal(preflight.sideEffects.radioGroupLookupRequired, true);
  assert.equal(preflight.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(preflight.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(preflight.sideEffects.browserInputMutated, false);

  const flushBlocker = gate.recordRestoreQueueFlushBlocker(preflight, {
    explicitAdmission: true,
    queueKind:
      "deterministic-controlled-input-post-event-restore-queue-flush-blocker",
    queueId: "oracle-controlled-flush-blocker-queue",
    targetKind: "controlled-input-post-event-restore-queue-flush-blocker"
  });

  assert.equal(
    flushBlocker.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueFlushBlockerStatus
  );
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueFlushBlockerRecord(
      flushBlocker
    ),
    true
  );
  assert.equal(flushBlocker.requestId, "controlled-oracle-write-preflight:4");
  assert.deepEqual(flushBlocker.queueSnapshot.wrapperOperationNames, [
    "input-value-sync",
    "input-checked-sync"
  ]);
  assert.deepEqual(
    flushBlocker.queueSnapshot.entries.map((entry) => ({
      sourceRequestId: entry.sourceRequestId,
      acceptedRestoreKind: entry.acceptedRestoreKind,
      queueSlot: entry.queueSlot,
      hostWrapperOperation: entry.hostWrapperOperation,
      restoreQueueWritten: entry.restoreQueueWritten,
      restoreQueueFlushed: entry.restoreQueueFlushed,
      hostWrapperInvoked: entry.hostWrapperInvoked,
      radioGroupLookupPerformed: entry.radioGroupLookupPerformed,
      browserInputMutated: entry.browserInputMutated
    })),
    [
      {
        sourceRequestId: "controlled-oracle-write-preflight:1",
        acceptedRestoreKind: "input-text-value",
        queueSlot: "restore-target",
        hostWrapperOperation: "input-value-sync",
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        sourceRequestId: "controlled-oracle-write-preflight:2",
        acceptedRestoreKind: "input-radio-checked",
        queueSlot: "restore-queue",
        hostWrapperOperation: "input-checked-sync",
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(flushBlocker.intendedFlushOrder.flushSequence, [
    "event-batch-exit",
    "pending-restore-check",
    "synchronous-work-flush",
    "snapshot-and-clear-private-queue",
    "restore-primary-target",
    "restore-additional-targets-in-order",
    "host-wrapper-restore-dispatch"
  ]);
  assert.deepEqual(
    flushBlocker.wrapperRestoreBlocker.wrapperRows.map((row) => ({
      acceptedRestoreKind: row.acceptedRestoreKind,
      hostWrapperOperation: row.hostWrapperOperation,
      wrapperInvocationBlocked: row.wrapperInvocationBlocked,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      radioGroupLookupPerformed: row.radioGroupLookupPerformed,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      hostValueWritten: row.hostValueWritten,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        acceptedRestoreKind: "input-text-value",
        hostWrapperOperation: "input-value-sync",
        wrapperInvocationBlocked: true,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        hostValueWritten: false,
        browserInputMutated: false
      },
      {
        acceptedRestoreKind: "input-radio-checked",
        hostWrapperOperation: "input-checked-sync",
        wrapperInvocationBlocked: true,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        hostValueWritten: false,
        browserInputMutated: false
      }
    ]
  );
  assert.equal(
    flushBlocker.wrapperRestoreBlocker.actualWrapperRestoreBlockedReason,
    "controlled-restore-flush-execution-remains-blocked"
  );
  assert.equal(flushBlocker.sideEffects.restoreQueueFlushBlockerRecorded, true);
  assert.equal(flushBlocker.sideEffects.restoreQueueWritten, false);
  assert.equal(flushBlocker.sideEffects.restoreQueueFlushed, false);
  assert.equal(flushBlocker.sideEffects.hostWrapperInvoked, false);
  assert.equal(flushBlocker.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(flushBlocker.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(flushBlocker.sideEffects.browserInputMutated, false);
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, "_valueTracker"), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
});

test("private input/change controlled restore bridge links latest props without live writes", () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: "controlled-oracle-input-change-bridge"
    });
  const eventDispatch = createPrivateControlledEventDispatch({
    domEventName: "input",
    latestProps: {
      type: "text",
      value: "alpha",
      onChange() {},
      onInput() {}
    },
    nodeName: "INPUT",
    value: "browser-mutated"
  });
  const inputPreflight =
    pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
      eventDispatch.dispatchRecord
    );
  const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    eventDispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        "deterministic-event-latest-props-post-event-restore-queue",
      queueId: "oracle-input-change-bridge-restore",
      eventName: "input",
      targetKind: "controlled-input-post-event-restore-queue"
    }
  );
  const writePreflight = gate.preflightRestoreQueueWrites([intent], {
    explicitAdmission: true,
    queueKind:
      "deterministic-controlled-input-post-event-restore-queue-write-preflight",
    queueId: "oracle-input-change-bridge-write-preflight",
    targetKind: "controlled-input-post-event-restore-queue-write-preflight"
  });
  const bridge = gate.recordInputChangeEventControlledRestoreBridge(
    inputPreflight,
    intent,
    writePreflight,
    {
      explicitAdmission: true,
      queueKind:
        "deterministic-input-change-event-controlled-restore-bridge",
      queueId: "oracle-input-change-controlled-restore-bridge",
      targetKind: "controlled-input-change-event-restore-queue-bridge"
    }
  );

  assert.equal(
    bridge.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueInputChangeBridgeStatus
  );
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecord(
      bridge
    ),
    true
  );
  assert.equal(bridge.requestId, "controlled-oracle-input-change-bridge:3");
  assert.equal(
    bridge.latestPropsEvidenceBridge.latestPropsEvidenceLinked,
    true
  );
  assert.equal(
    bridge.latestPropsEvidenceBridge.latestPropsEvidenceMatch,
    true
  );
  assert.deepEqual(
    bridge.bridgeRows.map((row) => ({
      sourceRestoreRequestId: row.sourceRestoreRequestId,
      sourceWriteIntentRowId: row.sourceWriteIntentRowId,
      domEventName: row.domEventName,
      hostTag: row.hostTag,
      inputType: row.inputType,
      controlKind: row.controlKind,
      acceptedRestoreKind: row.acceptedRestoreKind,
      queueSlot: row.queueSlot,
      eventDispatch: row.eventDispatch,
      syntheticEventCreated: row.syntheticEventCreated,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        sourceRestoreRequestId: "controlled-oracle-input-change-bridge:1",
        sourceWriteIntentRowId:
          "controlled-oracle-input-change-bridge:2:row:1",
        domEventName: "input",
        hostTag: "input",
        inputType: "text",
        controlKind: "value",
        acceptedRestoreKind: "input-text-value",
        queueSlot: "restore-target",
        eventDispatch: false,
        syntheticEventCreated: false,
        valueTrackerFieldWritten: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      }
    ]
  );
  assert.equal(bridge.sideEffects.inputChangeControlledRestoreBridgeRecorded, true);
  assert.equal(bridge.sideEffects.restoreQueueWritten, false);
  assert.equal(bridge.sideEffects.restoreQueueFlushed, false);
  assert.equal(bridge.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(bridge.sideEffects.browserInputMutated, false);
  assert.equal(Object.hasOwn(eventDispatch.targetNode, "_valueTracker"), false);
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);

  componentTree.detachHostInstanceToken(eventDispatch.token);
});

test("private controlled restore queue write execution records deterministic mutation intent", () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: "controlled-oracle-write-execution"
    });
  const rows = [
    {
      domEventName: "input",
      latestProps: {
        type: "text",
        value: "alpha",
        onChange() {},
        onInput() {}
      },
      nodeName: "INPUT",
      queueId: "oracle-text-write-execution",
      value: "browser-mutated"
    },
    {
      domEventName: "click",
      latestProps: {
        type: "radio",
        name: "choice",
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: "INPUT",
      queueId: "oracle-radio-write-execution"
    }
  ];
  const records = rows.map((row) => {
    const dispatch = createPrivateControlledEventDispatch(row);
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          "deterministic-event-latest-props-post-event-restore-queue",
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: "controlled-input-post-event-restore-queue"
      }
    );
    return {dispatch, intent};
  });
  const preflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    {
      explicitAdmission: true,
      queueKind:
        "deterministic-controlled-input-post-event-restore-queue-write-preflight",
      queueId: "oracle-controlled-write-execution-preflight",
      targetKind: "controlled-input-post-event-restore-queue-write-preflight"
    }
  );
  const execution = gate.recordRestoreQueueWriteExecution(preflight, {
    explicitAdmission: true,
    queueKind:
      "deterministic-controlled-input-post-event-restore-queue-write-execution",
    queueId: "oracle-controlled-write-execution-queue",
    targetKind: "controlled-input-post-event-restore-queue-write-execution"
  });

  assert.equal(
    execution.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWriteExecutionStatus
  );
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueWriteExecutionRecord(
      execution
    ),
    true
  );
  assert.equal(execution.sourcePreflightRequestId, preflight.requestId);
  assert.deepEqual(
    execution.writeExecutionRows.map((row) => ({
      rowId: row.rowId,
      sourcePreflightRowId: row.sourcePreflightRowId,
      sourceRequestId: row.sourceRequestId,
      queueSlot: row.queueSlot,
      queueMutationKind: row.queueMutationKind,
      hostTag: row.hostTag,
      controlKind: row.controlKind,
      acceptedRestoreKind: row.acceptedRestoreKind,
      metadataRestoreTargetWritten: row.metadataRestoreTargetWritten,
      metadataRestoreQueueWritten: row.metadataRestoreQueueWritten,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      radioGroupLookupRequired: row.radioGroupLookupRequired,
      radioGroupLookupPerformed: row.radioGroupLookupPerformed,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: "controlled-oracle-write-execution:4:row:1",
        sourcePreflightRowId: "controlled-oracle-write-execution:3:row:1",
        sourceRequestId: "controlled-oracle-write-execution:1",
        queueSlot: "restore-target",
        queueMutationKind: "set-restore-target",
        hostTag: "input",
        controlKind: "value",
        acceptedRestoreKind: "input-text-value",
        metadataRestoreTargetWritten: true,
        metadataRestoreQueueWritten: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        browserInputMutated: false
      },
      {
        rowId: "controlled-oracle-write-execution:4:row:2",
        sourcePreflightRowId: "controlled-oracle-write-execution:3:row:2",
        sourceRequestId: "controlled-oracle-write-execution:2",
        queueSlot: "restore-queue",
        queueMutationKind: "append-restore-queue",
        hostTag: "input",
        controlKind: "checked",
        acceptedRestoreKind: "input-radio-checked",
        metadataRestoreTargetWritten: false,
        metadataRestoreQueueWritten: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        radioGroupLookupRequired: true,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        browserInputMutated: false
      }
    ]
  );
  assert.equal(execution.restoreTargetMutation.slot, "restoreTarget");
  assert.equal(
    execution.restoreTargetMutation.acceptedRestoreKind,
    "input-text-value"
  );
  assert.equal(execution.restoreTargetMutation.restoreQueueWritten, false);
  assert.deepEqual(
    execution.restoreQueueMutations.map((row) => ({
      slot: row.slot,
      appendOrder: row.appendOrder,
      sourceRequestId: row.sourceRequestId,
      acceptedRestoreKind: row.acceptedRestoreKind,
      restoreQueueWritten: row.restoreQueueWritten,
      hostWrapperInvoked: row.hostWrapperInvoked
    })),
    [
      {
        slot: "restoreQueue",
        appendOrder: 1,
        sourceRequestId: "controlled-oracle-write-execution:2",
        acceptedRestoreKind: "input-radio-checked",
        restoreQueueWritten: false,
        hostWrapperInvoked: false
      }
    ]
  );
  assert.deepEqual(execution.queueMutationPlan.writeSequence, [
    "consume-restore-queue-write-preflight",
    "record-restore-target-mutation-intent",
    "record-restore-queue-append-mutation-intents",
    "keep-post-event-controlled-restore-flush-blocked",
    "keep-host-wrapper-restore-blocked"
  ]);
  assert.equal(execution.queueMutationPlan.restoreTargetWriteRecorded, true);
  assert.equal(execution.queueMutationPlan.restoreQueueAppendRecorded, true);
  assert.equal(execution.queueMutationPlan.restoreQueueWritten, false);
  assert.equal(execution.queueMutationPlan.restoreQueueFlushed, false);
  assert.equal(execution.queueMutationPlan.hostWrapperInvoked, false);
  assert.equal(execution.postEventRestoreBoundary.restoreQueueWritten, false);
  assert.equal(execution.postEventRestoreBoundary.hostWrapperInvoked, false);
  assert.equal(execution.sideEffects.restoreQueueWriteExecutionRecorded, true);
  assert.equal(execution.sideEffects.restoreQueueMutationIntentRecorded, true);
  assert.equal(execution.sideEffects.metadataRestoreTargetWritten, true);
  assert.equal(execution.sideEffects.metadataRestoreQueueWritten, true);
  assert.equal(execution.sideEffects.restoreQueueWritten, false);
  assert.equal(execution.sideEffects.restoreQueueFlushed, false);
  assert.equal(execution.sideEffects.hostWrapperInvoked, false);
  assert.equal(execution.sideEffects.radioGroupLookupRequired, true);
  assert.equal(execution.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(execution.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(execution.sideEffects.browserInputMutated, false);
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, "_valueTracker"), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
});

test("private controlled restore wrapper mutation intent records blocked value and checked updates", () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: "controlled-oracle-wrapper-intent"
    });
  const rows = [
    {
      domEventName: "input",
      latestProps: {
        type: "text",
        value: "alpha",
        onChange() {},
        onInput() {}
      },
      nodeName: "INPUT",
      queueId: "oracle-text-wrapper-intent",
      value: "browser-mutated"
    },
    {
      domEventName: "click",
      latestProps: {
        type: "radio",
        name: "choice",
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: "INPUT",
      queueId: "oracle-radio-wrapper-intent"
    }
  ];
  const records = rows.map((row) => {
    const dispatch = createPrivateControlledEventDispatch(row);
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          "deterministic-event-latest-props-post-event-restore-queue",
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: "controlled-input-post-event-restore-queue"
      }
    );
    return {dispatch, intent};
  });
  const preflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    {
      explicitAdmission: true,
      queueKind:
        "deterministic-controlled-input-post-event-restore-queue-write-preflight",
      queueId: "oracle-controlled-wrapper-intent-preflight",
      targetKind: "controlled-input-post-event-restore-queue-write-preflight"
    }
  );
  const execution = gate.recordRestoreQueueWriteExecution(preflight, {
    explicitAdmission: true,
    queueKind:
      "deterministic-controlled-input-post-event-restore-queue-write-execution",
    queueId: "oracle-controlled-wrapper-intent-execution",
    targetKind: "controlled-input-post-event-restore-queue-write-execution"
  });
  const flushBlocker = gate.recordRestoreQueueFlushBlocker(preflight, {
    explicitAdmission: true,
    queueKind:
      "deterministic-controlled-input-post-event-restore-queue-flush-blocker",
    queueId: "oracle-controlled-wrapper-intent-flush-blocker",
    targetKind: "controlled-input-post-event-restore-queue-flush-blocker"
  });
  const wrapperIntent = gate.recordRestoreQueueWrapperMutationIntent(
    execution,
    flushBlocker,
    {
      explicitAdmission: true,
      queueKind:
        "deterministic-controlled-input-post-event-restore-wrapper-mutation-intent",
      queueId: "oracle-controlled-wrapper-mutation-intent",
      targetKind: "controlled-input-post-event-restore-wrapper-mutation-intent"
    }
  );

  assert.equal(
    wrapperIntent.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWrapperMutationIntentStatus
  );
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecord(
      wrapperIntent
    ),
    true
  );
  assert.equal(wrapperIntent.sourceWriteExecutionRequestId, execution.requestId);
  assert.equal(wrapperIntent.sourceFlushBlockerRequestId, flushBlocker.requestId);
  assert.deepEqual(wrapperIntent.wrapperOperationNames, [
    "input-value-sync",
    "input-checked-sync"
  ]);
  assert.deepEqual(
    wrapperIntent.wrapperMutationIntentRows.map((row) => ({
      rowId: row.rowId,
      sourceWriteExecutionRowId: row.sourceWriteExecutionRowId,
      sourceFlushIndex: row.sourceFlushIndex,
      acceptedRestoreKind: row.acceptedRestoreKind,
      wrapperOperationName: row.wrapperOperationName,
      wrapperMutationKind: row.wrapperMutationKind,
      intendedUpdateKind: row.intendedUpdateKind,
      valueTargetField: row.intendedValueUpdate?.targetField || null,
      checkedTargetField: row.intendedCheckedUpdate?.targetField || null,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      radioGroupLookupPerformed: row.radioGroupLookupPerformed,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      hostValueRead: row.hostValueRead,
      hostValueWritten: row.hostValueWritten,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: "controlled-oracle-wrapper-intent:6:row:1",
        sourceWriteExecutionRowId: "controlled-oracle-wrapper-intent:4:row:1",
        sourceFlushIndex: 0,
        acceptedRestoreKind: "input-text-value",
        wrapperOperationName: "input-value-sync",
        wrapperMutationKind: "value-property-sync",
        intendedUpdateKind: "value",
        valueTargetField: "value",
        checkedTargetField: null,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      },
      {
        rowId: "controlled-oracle-wrapper-intent:6:row:2",
        sourceWriteExecutionRowId: "controlled-oracle-wrapper-intent:4:row:2",
        sourceFlushIndex: 1,
        acceptedRestoreKind: "input-radio-checked",
        wrapperOperationName: "input-checked-sync",
        wrapperMutationKind: "checked-property-sync",
        intendedUpdateKind: "checked",
        valueTargetField: null,
        checkedTargetField: "checked",
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      }
    ]
  );
  assert.equal(wrapperIntent.wrapperMutationPlan.valueUpdateIntentCount, 1);
  assert.equal(wrapperIntent.wrapperMutationPlan.checkedUpdateIntentCount, 1);
  assert.equal(wrapperIntent.wrapperMutationPlan.restoreQueueFlushed, false);
  assert.equal(wrapperIntent.wrapperMutationPlan.hostWrapperInvoked, false);
  assert.equal(wrapperIntent.blockedSideEffects.liveDomReadBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.liveDomWriteBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.valueTrackerWriteBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.queueFlushBlocked, true);
  assert.equal(wrapperIntent.sideEffects.restoreWrapperMutationIntentRecorded, true);
  assert.equal(wrapperIntent.sideEffects.wrapperMutationIntentRowCount, 2);
  assert.equal(wrapperIntent.sideEffects.wrapperIntendedValueUpdateRecorded, true);
  assert.equal(wrapperIntent.sideEffects.wrapperIntendedCheckedUpdateRecorded, true);
  assert.equal(wrapperIntent.sideEffects.restoreQueueFlushed, false);
  assert.equal(wrapperIntent.sideEffects.hostWrapperInvoked, false);
  assert.equal(wrapperIntent.sideEffects.hostValueWritten, false);
  assert.equal(wrapperIntent.sideEffects.browserInputMutated, false);
  assert.equal(
    wrapperIntent.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );

  assert.throws(
    () =>
      gate.recordRestoreQueueWrapperMutationIntent(
        execution,
        execution,
        {
          explicitAdmission: true,
          queueKind:
            "deterministic-controlled-input-post-event-restore-wrapper-mutation-intent",
          targetKind:
            "controlled-input-post-event-restore-wrapper-mutation-intent"
        }
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode,
      compatibilityTarget: "react-dom@19.2.6",
      reason: "expected a private controlled restore queue flush blocker record"
    }
  );
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, "_valueTracker"), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
});

test("private controlled select and textarea post-event restore queue consumes fake-DOM observations with latest props only", () => {
  const trackerGate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: "controlled-oracle-fake-dom-tracker"
  });
  const restoreGate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: "controlled-oracle-fake-dom-restore"
    });
  const rows = [
    {
      controlKind: "multiple",
      eventName: "change",
      fakeInitial: {selectedValues: ["b", "c"]},
      fakeNext: {selectedValues: ["a"]},
      hostTag: "select",
      latestProps: {
        multiple: true,
        value: ["a"],
        onChange() {}
      },
      multiple: true,
      nodeName: "SELECT",
      scenarioId: "select-multiple-controlled-update"
    },
    {
      controlKind: "value",
      eventName: "input",
      fakeInitial: {value: "alpha"},
      fakeNext: {value: "beta"},
      hostTag: "textarea",
      latestProps: {
        value: "beta",
        onChange() {},
        onInput() {}
      },
      nodeName: "TEXTAREA",
      scenarioId: "textarea-controlled-value-update"
    }
  ];
  const tokens = [];
  const intents = rows.map((row) => {
    const fakeTarget = createPrivateControlledInputFakeDomTarget(
      row.fakeInitial
    );
    const install = trackerGate.installFakeDomTracker(
      {
        scenarioId: row.scenarioId,
        phaseId: "post-event",
        hostTag: row.hostTag,
        multiple: row.multiple === true,
        controlKind: row.controlKind,
        props: row.latestProps
      },
      {
        explicitAdmission: true,
        adapterKind: "deterministic-fake-dom",
        targetKind: "controlled-input-value-tracker",
        fakeTarget
      }
    );
    Object.assign(fakeTarget, row.fakeNext);
    const observation = trackerGate.observeFakeDomTracker(install);
    const latestPropsLookup = createPrivateControlledLatestPropsLookup({
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      registrationName: row.eventName === "input" ? "onInput" : "onChange"
    });
    tokens.push(latestPropsLookup.token);

    return {
      fakeTarget,
      intent:
        restoreGate.recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
          observation,
          latestPropsLookup.lookupRecord,
          {
            explicitAdmission: true,
            queueKind:
              "deterministic-fake-dom-latest-props-post-event-restore-queue",
            queueId: `${row.scenarioId}-restore-queue`,
            eventName: row.eventName,
            targetKind: "controlled-input-post-event-restore-queue"
          }
        ),
      row
    };
  });

  assert.deepEqual(
    intents.map(({intent}) => ({
      status: intent.status,
      sourceKind: intent.sourceKind,
      hostTag: intent.hostTag,
      controlKind: intent.controlKind,
      trackedField: intent.trackedField,
      sourceChanged: intent.restoreIntent.sourceChanged,
      latestPropsEvidenceAccepted:
        intent.restoreIntent.latestPropsEvidenceAccepted,
      latestPropsLookupPerformed:
        intent.restoreIntent.latestPropsLookupPerformed,
      sourceMatchesLatestPropsTarget:
        intent.restoreIntent.sourceMatchesLatestPropsTarget,
      intentRecorded: intent.restoreIntent.intentRecorded,
      eventDispatchRecordAccepted:
        intent.restoreIntent.eventDispatchRecordAccepted,
      fakeDomTrackerObservationAccepted:
        intent.restoreIntent.fakeDomTrackerObservationAccepted,
      restoreQueueWritten: intent.restoreIntent.restoreQueueWritten,
      restoreQueueWriteOrderRecorded:
        intent.restoreIntent.restoreQueueWriteOrderRecorded,
      restoreQueueFlushOrderRecorded:
        intent.restoreIntent.restoreQueueFlushOrderRecorded,
      acceptedRestoreKind:
        intent.restoreQueueOrdering.acceptedRestoreKind,
      hostWrapperOperation:
        intent.restoreQueueOrdering.hostWrapperOrder.wrapperOperation,
      controlledStateRestoreInvoked:
        intent.restoreIntent.controlledStateRestoreInvoked
    })),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        sourceKind: "private-fake-dom-observation-latest-props-evidence",
        hostTag: "select",
        controlKind: "multiple",
        trackedField: "selectedOptions",
        sourceChanged: true,
        latestPropsEvidenceAccepted: true,
        latestPropsLookupPerformed: true,
        sourceMatchesLatestPropsTarget: true,
        intentRecorded: true,
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true,
        restoreQueueWritten: false,
        restoreQueueWriteOrderRecorded: true,
        restoreQueueFlushOrderRecorded: true,
        acceptedRestoreKind: "select-multiple-value",
        hostWrapperOperation: "select-multiple-options-sync",
        controlledStateRestoreInvoked: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        sourceKind: "private-fake-dom-observation-latest-props-evidence",
        hostTag: "textarea",
        controlKind: "value",
        trackedField: "value",
        sourceChanged: true,
        latestPropsEvidenceAccepted: true,
        latestPropsLookupPerformed: true,
        sourceMatchesLatestPropsTarget: true,
        intentRecorded: true,
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true,
        restoreQueueWritten: false,
        restoreQueueWriteOrderRecorded: true,
        restoreQueueFlushOrderRecorded: true,
        acceptedRestoreKind: "textarea-value",
        hostWrapperOperation: "textarea-value-sync",
        controlledStateRestoreInvoked: false
      }
    ]
  );

  for (const {fakeTarget, intent} of intents) {
    assert.equal(intent.eventEvidence, null);
    assert.equal(intent.postEventRestoreBoundary.eventPluginDispatch, false);
    assert.equal(intent.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(intent.postEventRestoreBoundary.restoreFlushed, false);
    assert.equal(intent.sideEffects.eventDispatchRecordAccepted, false);
    assert.equal(intent.sideEffects.restoreQueueWriteOrderRecorded, true);
    assert.equal(intent.sideEffects.restoreQueueFlushOrderRecorded, true);
    assert.equal(intent.sideEffects.hostWrapperRestoreOrderRecorded, true);
    assert.equal(intent.sideEffects.restoreQueueWritten, false);
    assert.equal(intent.sideEffects.restoreQueueFlushed, false);
    assert.equal(intent.sideEffects.hostWrapperInvoked, false);
    assert.equal(intent.sideEffects.hostValueRead, false);
    assert.equal(intent.sideEffects.hostValueWritten, false);
    assert.equal(intent.sideEffects.browserInputMutated, false);
    assert.equal(
      intent.restoreQueueOrdering.writeOrder.restoreQueueWritten,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.flushOrder.restoreQueueFlushed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.primaryHostWrapperRan,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.wrapperWritePerformed,
      false
    );
    assert.equal(intent.sideEffects.publicControlledBehaviorEnabled, false);
    assert.equal(intent.sideEffects.compatibilityClaimed, false);
    assert.equal(Object.hasOwn(fakeTarget, "_valueTracker"), false);
    assert.equal(
      intent.publicControlledBehaviorBoundary.compatibilityClaimed,
      false
    );
  }
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);

  for (const token of tokens) {
    componentTree.detachHostInstanceToken(token);
  }
});

test("DOM controlled input oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, DOM_CONTROLLED_INPUT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, DOM_CONTROLLED_INPUT_SCENARIOS);

  const coverage = new Set(
    oracle.scenarios.flatMap((scenario) => scenario.coverage)
  );
  for (const requiredCoverage of [
    "input",
    "checkbox",
    "select",
    "select-single",
    "select-multiple",
    "textarea",
    "textarea-children",
    "controlled",
    "uncontrolled",
    "controlled-uncontrolled-warnings",
    "value-defaultValue",
    "checked-defaultChecked",
    "read-only-warning",
    "update-behavior"
  ]) {
    assert.ok(
      coverage.has(requiredCoverage),
      `missing coverage ${requiredCoverage}`
    );
  }

  for (const mode of DOM_CONTROLLED_INPUT_PROBE_MODES) {
    assert.equal(
      oracle.serverSerializationObservations[mode.id].length,
      DOM_CONTROLLED_INPUT_SCENARIOS.length
    );
    assert.equal(
      oracle.clientFormStateObservations[mode.id].length,
      DOM_CONTROLLED_INPUT_SCENARIOS.length
    );

    for (const scenario of DOM_CONTROLLED_INPUT_SCENARIOS) {
      assert.equal(serverObservation(mode.id, scenario.id).scenarioId, scenario.id);
      assert.equal(clientObservation(mode.id, scenario.id).scenarioId, scenario.id);
    }
  }
});

test("text input observations record controlled and uncontrolled value/defaultValue behavior", () => {
  assert.equal(
    serverPhase(
      "default-node-development",
      "input-text-controlled-value-update",
      "initial"
    ).result.value,
    '<input type="text" value="alpha"/>'
  );
  assert.deepEqual(
    renderedFormState(
      clientPhase(
        "default-node-development",
        "input-text-controlled-value-update",
        "initial"
      )
    ),
    {
      type: "text",
      value: "alpha",
      defaultValue: "alpha",
      checked: false,
      defaultChecked: false
    }
  );
  assert.deepEqual(
    renderedFormState(
      clientPhase(
        "default-node-development",
        "input-text-controlled-value-update",
        "update"
      )
    ),
    {
      type: "text",
      value: "beta",
      defaultValue: "beta",
      checked: false,
      defaultChecked: false
    }
  );

  const defaultUpdate = renderedFormState(
    clientPhase(
      "default-node-development",
      "input-text-default-value-update",
      "update"
    )
  );
  assert.equal(defaultUpdate.value, "alpha");
  assert.equal(defaultUpdate.defaultValue, "beta");
});

test("checkbox observations record checked/defaultChecked behavior", () => {
  assert.deepEqual(
    renderedFormState(
      clientPhase(
        "default-node-development",
        "checkbox-controlled-checked-update",
        "initial"
      )
    ),
    {
      type: "checkbox",
      value: "",
      defaultValue: "",
      checked: true,
      defaultChecked: true
    }
  );
  assert.deepEqual(
    renderedFormState(
      clientPhase(
        "default-node-development",
        "checkbox-controlled-checked-update",
        "update"
      )
    ),
    {
      type: "checkbox",
      value: "",
      defaultValue: "",
      checked: false,
      defaultChecked: true
    }
  );

  const defaultUpdate = renderedFormState(
    clientPhase(
      "default-node-development",
      "checkbox-default-checked-update",
      "update"
    )
  );
  assert.equal(defaultUpdate.checked, true);
  assert.equal(defaultUpdate.defaultChecked, false);
});

test("select observations record single and multiple selected option state", () => {
  assert.deepEqual(
    renderedFormState(
      clientPhase(
        "default-node-development",
        "select-single-controlled-update",
        "update"
      )
    ),
    {
      multiple: false,
      value: "c",
      selectedIndex: 2,
      options: [
        {
          index: 0,
          value: "a",
          selected: false,
          defaultSelected: false,
          textContent: "Alpha"
        },
        {
          index: 1,
          value: "b",
          selected: false,
          defaultSelected: false,
          textContent: "Beta"
        },
        {
          index: 2,
          value: "c",
          selected: true,
          defaultSelected: false,
          textContent: "Gamma"
        }
      ]
    }
  );

  assert.deepEqual(
    renderedFormState(
      clientPhase(
        "default-node-development",
        "select-multiple-controlled-update",
        "initial"
      )
    ).options.map((option) => [option.value, option.selected]),
    [
      ["a", false],
      ["b", true],
      ["c", true]
    ]
  );
  assert.deepEqual(
    renderedFormState(
      clientPhase(
        "default-node-development",
        "select-multiple-controlled-update",
        "update"
      )
    ).options.map((option) => [option.value, option.selected]),
    [
      ["a", true],
      ["b", false],
      ["c", false]
    ]
  );
});

test("textarea observations record value/defaultValue and children behavior", () => {
  assert.deepEqual(
    renderedFormState(
      clientPhase(
        "default-node-development",
        "textarea-controlled-value-update",
        "update"
      )
    ),
    {
      value: "beta",
      defaultValue: "beta",
      textContent: "beta"
    }
  );

  const defaultUpdate = renderedFormState(
    clientPhase(
      "default-node-development",
      "textarea-default-value-update",
      "update"
    )
  );
  assert.equal(defaultUpdate.value, "alpha");
  assert.equal(defaultUpdate.defaultValue, "beta");

  const textareaChildrenServer = serverPhase(
    "default-node-development",
    "textarea-children-warning",
    "initial"
  );
  assert.equal(textareaChildrenServer.result.status, "ok");
  assert.equal(textareaChildrenServer.result.value, "<textarea>child text</textarea>");
  assert.deepEqual(consoleMessageStrings(textareaChildrenServer), [
    "Use the `defaultValue` or `value` props instead of setting children on <textarea>."
  ]);
});

test("development warnings record controlled/default conflicts, read-only fields, and mode-only diagnostics", () => {
  assert.deepEqual(developmentWarningMatrix("server"), {
    "input-value-default-value-warning": [
      "initial:%s contains an input of type %s with both value and defaultValue props. Input elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://react.dev/link/controlled-components"
    ],
    "input-value-readonly-warning": [
      "initial:You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`."
    ],
    "checkbox-checked-default-checked-warning": [
      "initial:%s contains an input of type %s with both checked and defaultChecked props. Input elements must be either controlled or uncontrolled (specify either the checked prop, or the defaultChecked prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://react.dev/link/controlled-components"
    ],
    "checkbox-checked-readonly-warning": [
      "initial:You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`."
    ],
    "select-value-default-value-warning": [
      "initial:Select elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled select element and remove one of these props. More info: https://react.dev/link/controlled-components"
    ],
    "select-value-readonly-warning": [
      "initial:You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set `onChange`."
    ],
    "textarea-children-warning": [
      "initial:Use the `defaultValue` or `value` props instead of setting children on <textarea>."
    ],
    "textarea-value-default-value-warning": [
      "initial:Textarea elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled textarea and remove one of these props. More info: https://react.dev/link/controlled-components"
    ],
    "textarea-value-readonly-warning": [
      "initial:You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`."
    ]
  });

  assert.deepEqual(developmentWarningMatrix("client"), {
    "input-value-default-value-warning": [
      "initial:%s contains an input of type %s with both value and defaultValue props. Input elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://react.dev/link/controlled-components"
    ],
    "input-value-readonly-warning": [
      "initial:You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`."
    ],
    "input-uncontrolled-to-controlled-warning": [
      "update:A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://react.dev/link/controlled-components"
    ],
    "input-controlled-to-uncontrolled-warning": [
      "update:A component is changing a controlled input to be uncontrolled. This is likely caused by the value changing from a defined to undefined, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://react.dev/link/controlled-components"
    ],
    "checkbox-checked-default-checked-warning": [
      "initial:%s contains an input of type %s with both checked and defaultChecked props. Input elements must be either controlled or uncontrolled (specify either the checked prop, or the defaultChecked prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://react.dev/link/controlled-components"
    ],
    "checkbox-checked-readonly-warning": [
      "initial:You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`."
    ],
    "checkbox-uncontrolled-to-controlled-warning": [
      "update:A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://react.dev/link/controlled-components"
    ],
    "checkbox-controlled-to-uncontrolled-warning": [
      "update:A component is changing a controlled input to be uncontrolled. This is likely caused by the value changing from a defined to undefined, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://react.dev/link/controlled-components"
    ],
    "select-value-default-value-warning": [
      "initial:Select elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled select element and remove one of these props. More info: https://react.dev/link/controlled-components"
    ],
    "select-value-readonly-warning": [
      "initial:You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set `onChange`."
    ],
    "textarea-children-warning": [
      "initial:Use the `defaultValue` or `value` props instead of setting children on <textarea>."
    ],
    "textarea-value-default-value-warning": [
      "initial:%s contains a textarea with both value and defaultValue props. Textarea elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled textarea and remove one of these props. More info: https://react.dev/link/controlled-components"
    ],
    "textarea-value-readonly-warning": [
      "initial:You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`."
    ]
  });

  assertNoProductionWarnings("server");
  assertNoProductionWarnings("client");
});

test("development warning observations preserve full console argument tuples", () => {
  assert.deepEqual(
    consoleCallArgs(
      serverPhase(
        "default-node-development",
        "input-value-default-value-warning",
        "initial"
      )
    ),
    [
      [
        {
          type: "string",
          value:
            "%s contains an input of type %s with both value and defaultValue props. Input elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://react.dev/link/controlled-components"
        },
        {
          type: "string",
          value: "A component"
        },
        {
          type: "string",
          value: "text"
        }
      ]
    ]
  );

  assert.deepEqual(
    consoleCallArgs(
      serverPhase(
        "default-node-development",
        "checkbox-checked-default-checked-warning",
        "initial"
      )
    ),
    [
      [
        {
          type: "string",
          value:
            "%s contains an input of type %s with both checked and defaultChecked props. Input elements must be either controlled or uncontrolled (specify either the checked prop, or the defaultChecked prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://react.dev/link/controlled-components"
        },
        {
          type: "string",
          value: "A component"
        },
        {
          type: "string",
          value: "checkbox"
        }
      ]
    ]
  );

  assert.deepEqual(
    consoleCallArgs(
      clientPhase(
        "default-node-development",
        "textarea-value-default-value-warning",
        "initial"
      )
    ),
    [
      [
        {
          type: "string",
          value:
            "%s contains a textarea with both value and defaultValue props. Textarea elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled textarea and remove one of these props. More info: https://react.dev/link/controlled-components"
        },
        {
          type: "string",
          value: "A component"
        }
      ]
    ]
  );
});

test("DOM controlled input oracle artifact has no temp or local path leaks", () => {
  const text = readCheckedDomControlledInputOracleText();
  assert.equal(
    /\/private\/var|\/var\/folders|\/tmp\/|file:\/\/\/|fast-react-dom-controlled-input-oracle-[A-Za-z0-9]|Users\/user|Developer\/Developer/u.test(
      text
    ),
    false
  );
});

test("print DOM controlled input oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-dom-controlled-input-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedDomControlledInputOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedDomControlledInputOracleText());
});

function serverObservation(modeId, scenarioId) {
  return findDomControlledInputServerObservation(oracle, modeId, scenarioId);
}

function clientObservation(modeId, scenarioId) {
  return findDomControlledInputClientObservation(oracle, modeId, scenarioId);
}

function serverPhase(modeId, scenarioId, phaseId) {
  return findDomControlledInputPhase(
    serverObservation(modeId, scenarioId),
    phaseId
  );
}

function clientPhase(modeId, scenarioId, phaseId) {
  return findDomControlledInputPhase(
    clientObservation(modeId, scenarioId),
    phaseId
  );
}

function renderedFormState(phase) {
  assert.equal(phase.result.status, "ok");
  assert.equal(phase.container.children.length, 1);
  return phase.container.children[0].formState;
}

function consoleMessageStrings(phase) {
  return phase.consoleCalls.map((call) => {
    assert.equal(call.method, "error");
    return call.args[0].value;
  });
}

function consoleCallArgs(phase) {
  return phase.consoleCalls.map((call) => {
    assert.equal(call.method, "error");
    return call.args;
  });
}

function developmentWarningMatrix(kind) {
  const observations =
    kind === "server"
      ? oracle.serverSerializationObservations["default-node-development"]
      : oracle.clientFormStateObservations["default-node-development"];
  return warningMatrix(observations);
}

function warningMatrix(observations) {
  const matrix = {};
  for (const observation of observations) {
    const messages = [];
    for (const phase of observation.result.phases) {
      for (const message of consoleMessageStrings(phase)) {
        messages.push(`${phase.phaseId}:${message}`);
      }
    }
    if (messages.length > 0) {
      matrix[observation.scenarioId] = messages;
    }
  }
  return matrix;
}

function assertNoProductionWarnings(kind) {
  const observations =
    kind === "server"
      ? oracle.serverSerializationObservations["default-node-production"]
      : oracle.clientFormStateObservations["default-node-production"];
  assert.deepEqual(warningMatrix(observations), {});
}

function createPrivateControlledInputFakeDomTarget(fields) {
  return {
    [resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker]: true,
    ...fields
  };
}

function createPrivateControlledEventDispatch(options) {
  const document = {
    nodeName: "#document",
    nodeType: 9
  };
  document.ownerDocument = document;
  const container = createPrivateControlledHostNode("DIV", document);
  const targetNode = createPrivateControlledHostNode(
    options.nodeName,
    document
  );
  targetNode.parentNode = container;
  if (Object.hasOwn(options, "value")) {
    targetNode.value = options.value;
  }
  const token = componentTree.createHostInstanceToken(
    {kind: "ControlledOracleEventHost"},
    {kind: "ControlledOracleEventRoot"}
  );
  componentTree.attachHostInstanceNode(
    targetNode,
    token,
    options.latestProps
  );
  const wrapperRecord =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      options.domEventName,
      0
    );

  return {
    container,
    dispatchRecord: eventListener.dispatchEvent(wrapperRecord, {
      target: targetNode,
      type: options.domEventName
    }),
    document,
    targetNode,
    token
  };
}

function createPrivateControlledLatestPropsLookup(options) {
  const document = {
    nodeName: "#document",
    nodeType: 9
  };
  document.ownerDocument = document;
  const targetNode = createPrivateControlledHostNode(
    options.nodeName,
    document
  );
  const token = componentTree.createHostInstanceToken(
    {kind: "ControlledOracleLatestPropsHost"},
    {kind: "ControlledOracleLatestPropsRoot"}
  );
  componentTree.attachHostInstanceNode(
    targetNode,
    token,
    options.latestProps
  );
  const normalizationRecord =
    componentTree.createEventTargetNormalizationRecord(targetNode);
  const lookupRecord = componentTree.createEventListenerTargetLookupRecord(
    normalizationRecord,
    options.registrationName
  );

  return {
    document,
    lookupRecord,
    normalizationRecord,
    targetNode,
    token
  };
}

function createPrivateControlledHostNode(nodeName, ownerDocument) {
  return {
    localName: nodeName.toLowerCase(),
    nodeName,
    nodeType: 1,
    ownerDocument,
    parentNode: null
  };
}
