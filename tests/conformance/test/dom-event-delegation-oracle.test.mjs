import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DOM_EVENT_DELEGATION_EVENT_EXAMPLES,
  DOM_EVENT_DELEGATION_ORACLE_ARTIFACT_PATH,
  DOM_EVENT_DELEGATION_PROBE_MODES,
  DOM_EVENT_DELEGATION_SUPPORTING_TARGETS,
  DOM_EVENT_DELEGATION_TARGET
} from "../src/dom-event-delegation-targets.mjs";
import {
  findDomEventDelegationDispatch,
  findDomEventDelegationInstallation,
  findRegisteredEvent,
  readCheckedDomEventDelegationOracle,
  readCheckedDomEventDelegationOracleText
} from "../src/dom-event-delegation-oracle.mjs";
import {
  DOM_EVENT_DELEGATION_SCENARIOS
} from "../src/dom-event-delegation-scenarios.mjs";

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
const domContainer = require(
  path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
);
const hydrationGate = require(
  path.join(
    repoRoot,
    "packages/react-dom/src/client/hydration-boundary-gate.js"
  )
);
const eventListener = require(
  path.join(
    repoRoot,
    "packages/react-dom/src/events/react-dom-event-listener.js"
  )
);
const pluginEventSystem = require(
  path.join(repoRoot, "packages/react-dom/src/events/plugin-event-system.js")
);
const listenerRegistry = require(
  path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
);
const rootBridge = require(
  path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
);
const rootListeners = require(
  path.join(repoRoot, "packages/react-dom/src/events/root-listeners.js")
);

const oracle = readCheckedDomEventDelegationOracle();

test("checked DOM event delegation oracle artifact has the expected schema and targets", () => {
  assert.equal(
    DOM_EVENT_DELEGATION_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-dom-event-delegation-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-dom-event-delegation-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.equal(
    oracle.generation.pathNormalization,
    "temporary extraction paths and React randomized listener marker names are not serialized"
  );
  assert.deepEqual(oracle.reactDomTarget, DOM_EVENT_DELEGATION_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    DOM_EVENT_DELEGATION_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.deepEqual(oracle.probeModes, DOM_EVENT_DELEGATION_PROBE_MODES);
  assert.deepEqual(oracle.eventExamples, DOM_EVENT_DELEGATION_EVENT_EXAMPLES);
  assert.deepEqual(oracle.scenarios, DOM_EVENT_DELEGATION_SCENARIOS);
});

test("DOM event delegation oracle keeps Fast React and event-priority claims out of scope", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(oracle.evidenceClaims.eventPriorityLaneClaimsIncluded, false);
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-event-priority-lane-claims"
    ),
    true
  );
});

test("React DOM createRoot installs delegated root listeners and owner-document selectionchange", () => {
  for (const mode of DOM_EVENT_DELEGATION_PROBE_MODES) {
    const installation = findDomEventDelegationInstallation(oracle, mode.id);
    assert.equal(installation.rootContainer.listenerCount, 138, mode.id);
    assert.equal(installation.ownerDocument.listenerCount, 1, mode.id);
    assert.equal(
      installation.rootContainerReactListeningMarker.propertyCount,
      1,
      mode.id
    );
    assert.equal(
      installation.ownerDocumentReactListeningMarker.propertyCount,
      1,
      mode.id
    );
    assert.equal(installation.passiveListenerSupportDetected, true, mode.id);

    assertRootBubbleAndCapture(installation, "click");
    assertRootBubbleAndCapture(installation, "mousemove");

    const wheel = findRegisteredEvent(installation.rootContainer, "wheel");
    assert.equal(wheel.captureCount, 1, mode.id);
    assert.equal(wheel.bubbleCount, 1, mode.id);
    assert.equal(wheel.passiveTrueCount, 2, mode.id);

    const selectionChange = findRegisteredEvent(
      installation.ownerDocument,
      "selectionchange"
    );
    assert.equal(selectionChange.captureCount, 0, mode.id);
    assert.equal(selectionChange.bubbleCount, 1, mode.id);
  }
});

test("focus and blur blocker gate records private metadata without widening the delegation oracle", () => {
  for (const mode of DOM_EVENT_DELEGATION_PROBE_MODES) {
    const installation = findDomEventDelegationInstallation(oracle, mode.id);
    const focusIn = findRegisteredEvent(installation.rootContainer, "focusin");
    const focusOut = findRegisteredEvent(installation.rootContainer, "focusout");

    assert.equal(focusIn.captureCount, 1, mode.id);
    assert.equal(focusIn.bubbleCount, 1, mode.id);
    assert.equal(focusIn.passiveTrueCount, 0, mode.id);
    assert.equal(focusOut.captureCount, 1, mode.id);
    assert.equal(focusOut.bubbleCount, 1, mode.id);
    assert.equal(focusOut.passiveTrueCount, 0, mode.id);
  }

  const fixture = createPrivateFocusBlurBlockerFixture();
  const blocker = fixture.blocker;

  assert.equal(
    blocker.kind,
    pluginEventSystem.FOCUS_BLUR_EVENT_BLOCKER_GATE_RECORD_KIND
  );
  assert.equal(
    blocker.status,
    pluginEventSystem.PRIVATE_FOCUS_BLUR_EVENT_BLOCKER_GATE_STATUS
  );
  assert.deepEqual(
    blocker.nativeEventMappings.map((mapping) => [
      mapping.nativeEventName,
      mapping.reactName,
      mapping.captureRegistrationName,
      mapping.bubbleRegistrationName,
      mapping.syntheticEventType
    ]),
    [
      ["focusin", "onFocus", "onFocusCapture", "onFocus", "focus"],
      ["focusout", "onBlur", "onBlurCapture", "onBlur", "blur"]
    ]
  );
  assert.deepEqual(
    blocker.phaseRecords.map((record) => [
      record.domEventName,
      record.phase,
      record.registrationName,
      record.processingListenerMetadata.map((listener) => listener.currentTarget)
    ]),
    [
      ["focusin", "capture", "onFocusCapture", [
        fixture.parent,
        fixture.child
      ]],
      ["focusin", "bubble", "onFocus", [fixture.child, fixture.parent]],
      ["focusout", "capture", "onBlurCapture", [
        fixture.parent,
        fixture.child
      ]],
      ["focusout", "bubble", "onBlur", [fixture.child, fixture.parent]]
    ]
  );
  assert.equal(blocker.dispatchRecordCount, 4);
  assert.equal(blocker.listenerMetadataCount, 8);
  assert.equal(blocker.targetCurrentTargetBlockerCount, 8);
  assert.equal(blocker.listenerInstallation, false);
  assert.equal(blocker.eventObjectCreation, false);
  assert.equal(blocker.eventDispatch, false);
  assert.equal(blocker.syntheticFocusEventCreation, false);
  assert.equal(blocker.syntheticEventCount, 0);
  assert.equal(blocker.listenerInvocationCount, 0);
  assert.equal(blocker.publicDispatchEnabled, false);
  assert.equal(blocker.browserDomEventCompatibilityClaimed, false);
  assert.equal(blocker.compatibilityClaimed, false);
  assert.equal(blocker.portalOwnerRootAvailable, true);
  assert.equal(
    blocker.portalOwnerRootStatus,
    pluginEventSystem.PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS
  );
  assert.equal(blocker.portalOwnerRoot.ownerRootMatchesTargetRoot, true);
  assert.equal(blocker.portalOwnerRoot.portalContainerContainsTarget, true);
  assert.equal(blocker.portalOwnerRoot.rootContainerContainsTarget, false);
  assert.equal(
    fixture.execution.kind,
    pluginEventSystem
      .PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_RECORD_KIND
  );
  assert.equal(
    fixture.execution.status,
    pluginEventSystem.PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_STATUS
  );
  assert.equal(fixture.execution.domEventName, "focusin");
  assert.equal(fixture.execution.phase, "bubble");
  assert.equal(fixture.execution.reactName, "onFocus");
  assert.equal(fixture.execution.registrationName, "onFocus");
  assert.equal(fixture.execution.syntheticEventType, "focus");
  assert.equal(fixture.execution.fakeDomEventDispatchExecution, true);
  assert.equal(fixture.execution.listenerInvocationCount, 1);
  assert.equal(fixture.execution.privateListenerInvoked, true);
  assert.equal(fixture.execution.syntheticEventCount, 0);
  assert.equal(fixture.execution.syntheticFocusEventCreation, false);
  assert.equal(fixture.execution.publicDispatchEnabled, false);
  assert.equal(fixture.execution.browserDomEventCompatibilityClaimed, false);
  assert.equal(fixture.execution.compatibilityClaimed, false);
  assert.equal(fixture.execution.portalOwnerRootAvailable, true);
  assert.equal(
    fixture.execution.portalOwnerRoot.status,
    pluginEventSystem.PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS
  );
  assert.deepEqual(fixture.privateListenerCalls.map(call => [
    call.type,
    call.registrationName,
    call.currentTarget,
    call.target,
    call.targetInst
  ]), [
    [
      "focusin",
      "onFocus",
      fixture.child,
      fixture.child,
      fixture.childToken
    ]
  ]);
  assert.equal(fixture.listenerCalls.count, 0);
  assert.equal(fixture.rootContainer.__registrations.length, 0);
  assert.equal(fixture.portalContainer.__registrations.length, 0);
  assert.equal(fixture.child.__registrations.length, 0);

  listenerRegistry.removePrivateEventListenerQueueEntry(
    fixture.acceptedFocusQueue
  );
  componentTree.detachHostInstanceToken(fixture.childToken);
  componentTree.detachHostInstanceToken(fixture.parentToken);
});

test("click dispatch gate records one private listener route without widening the delegation oracle", () => {
  const fixture = createPrivateClickDelegationDispatchGateFixture();
  const gate = fixture.gate;

  assert.equal(
    gate.kind,
    pluginEventSystem.PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND
  );
  assert.equal(
    gate.status,
    pluginEventSystem.PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_STATUS
  );
  assert.equal(gate.domEventName, "click");
  assert.equal(gate.listenerInvocationCount, 1);
  assert.equal(gate.listenerQueueIndex, fixture.childQueue.listenerQueueIndex);
  assert.equal(gate.privateListenerQueue, true);
  assert.equal(gate.publicDispatchEnabled, false);
  assert.equal(gate.publicDispatchBlocked, true);
  assert.equal(gate.browserDomEventCompatibilityClaimed, false);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.syntheticEventCount, 0);
  assert.equal(gate.willInvokePublicListeners, false);
  assert.deepEqual(fixture.calls, [
    {
      currentTarget: fixture.child,
      target: fixture.child,
      targetInst: fixture.childToken
    }
  ]);
  assert.equal(fixture.rootContainer.__registrations.length, 0);

  listenerRegistry.removePrivateEventListenerQueueEntry(fixture.parentQueue);
  listenerRegistry.removePrivateEventListenerQueueEntry(fixture.childQueue);
  assert.equal(
    componentTree.detachHostInstanceToken(fixture.childToken),
    fixture.childToken
  );
  assert.equal(
    componentTree.detachHostInstanceToken(fixture.parentToken),
    fixture.parentToken
  );
});

test("click dispatch gate invokes a portal child listener with owner-root metadata without widening the delegation oracle", () => {
  const fixture = createPrivateClickPortalDelegationDispatchGateFixture();
  const gate = fixture.gate;

  assert.equal(
    gate.kind,
    pluginEventSystem.PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND
  );
  assert.equal(
    gate.status,
    pluginEventSystem.PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_STATUS
  );
  assert.equal(gate.domEventName, "click");
  assert.equal(gate.listenerInvocationCount, 1);
  assert.equal(gate.privateListenerInvoked, true);
  assert.equal(gate.portalOwnerRootAvailable, true);
  assert.equal(
    gate.portalOwnerRootStatus,
    pluginEventSystem.PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS
  );
  assert.equal(gate.portalContainerContainsTarget, true);
  assert.equal(gate.rootContainerContainsTarget, false);
  assert.equal(gate.publicPortalBubblingEnabled, false);
  assert.equal(gate.publicPortalBubblingBlocked, true);
  assert.equal(gate.publicDispatchEnabled, false);
  assert.equal(gate.publicDispatchBlocked, true);
  assert.equal(gate.browserDomEventCompatibilityClaimed, false);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.syntheticEventCount, 0);
  assert.equal(gate.targetDispatchPathLength, 2);
  assert.equal(
    gate.targetDispatchPathStatus,
    "resolved-component-tree-dispatch-path"
  );
  assert.equal(gate.listenerQueueIndex, fixture.childQueue.listenerQueueIndex);
  assert.equal(
    gate.portalOwnerRoot.dispatchPathRootOwnerMatchCount,
    2
  );
  assert.equal(
    gate.portalOwnerRoot.dispatchPathRootOwnerMismatchCount,
    0
  );
  assert.equal(
    gate.portalOwnerRoot.publicPortalBubblingEnabled,
    false
  );
  assert.deepEqual(fixture.calls, [
    {
      currentTarget: fixture.child,
      target: fixture.child,
      targetInst: fixture.childToken
    }
  ]);
  assert.equal(fixture.rootContainer.__registrations.length, 0);
  assert.equal(fixture.portalContainer.__registrations.length, 0);
  assert.equal(fixture.parent.__registrations.length, 0);
  assert.equal(fixture.child.__registrations.length, 0);

  listenerRegistry.removePrivateEventListenerQueueEntry(fixture.parentQueue);
  listenerRegistry.removePrivateEventListenerQueueEntry(fixture.childQueue);
  assert.equal(
    componentTree.detachHostInstanceToken(fixture.childToken),
    fixture.childToken
  );
  assert.equal(
    componentTree.detachHostInstanceToken(fixture.parentToken),
    fixture.parentToken
  );
});

test("root-render host-output click delegation invokes accepted private listener order without widening the delegation oracle", () => {
  const fixture =
    createPrivateRootRenderClickDelegationAcceptedOrderFixture();
  const orderRecord = fixture.orderRecord;

  try {
    assert.equal(
      orderRecord.kind,
      pluginEventSystem
        .PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_RECORD_KIND
    );
    assert.equal(
      orderRecord.status,
      pluginEventSystem
        .PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_STATUS
    );
    assert.equal(
      pluginEventSystem
        .isPrivateClickEventDelegationAcceptedListenerOrderRecord(
          orderRecord
        ),
      true
    );
    assert.equal(orderRecord.acceptedListenerCount, 2);
    assert.equal(orderRecord.listenerInvocationCount, 2);
    assert.deepEqual(orderRecord.phases, ["capture", "bubble"]);
    assert.deepEqual(orderRecord.registrationNames, [
      "onClickCapture",
      "onClick"
    ]);
    assert.equal(orderRecord.selectedFromProcessingOrder, true);
    assert.equal(orderRecord.targetInst, fixture.hostOutputPayload.hostToken);
    assert.equal(orderRecord.rootRenderMetadataAvailable, true);
    assert.equal(orderRecord.rootRenderHostOutputActive, true);
    assert.equal(
      orderRecord.rootRenderMetadataStatus,
      "active-private-root-render-host-output"
    );
    assert.equal(orderRecord.publicDispatchEnabled, false);
    assert.equal(orderRecord.publicDispatchBlocked, true);
    assert.equal(orderRecord.browserDomEventCompatibilityClaimed, false);
    assert.equal(orderRecord.compatibilityClaimed, false);
    assert.equal(orderRecord.syntheticEventCount, 0);
    assert.equal(orderRecord.willDispatchPublicEvent, false);
    assert.deepEqual(
      orderRecord.acceptedListenerOrder.map((entry) => [
        entry.phase,
        entry.registrationName,
        entry.currentTarget,
        entry.targetInst
      ]),
      [
        [
          "capture",
          "onClickCapture",
          fixture.targetNode,
          fixture.hostOutputPayload.hostToken
        ],
        [
          "bubble",
          "onClick",
          fixture.targetNode,
          fixture.hostOutputPayload.hostToken
        ]
      ]
    );
    assert.deepEqual(fixture.calls, [
      {
        currentTarget: fixture.targetNode,
        phase: "capture",
        registrationName: "onClickCapture",
        target: fixture.targetNode,
        targetInst: fixture.hostOutputPayload.hostToken,
        type: "click"
      },
      {
        currentTarget: fixture.targetNode,
        phase: "bubble",
        registrationName: "onClick",
        target: fixture.targetNode,
        targetInst: fixture.hostOutputPayload.hostToken,
        type: "click"
      }
    ]);
    assert.equal(fixture.container.__registrations.length, 138);
    assert.equal(fixture.document.__registrations.length, 1);
    assert.equal(fixture.targetNode.__registrations.length, 0);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(
      fixture.captureQueue
    );
    listenerRegistry.removePrivateEventListenerQueueEntry(
      fixture.bubbleQueue
    );
    cleanupPrivateRootRenderClickDelegationAcceptedOrderFixture(fixture);
  }
});

test("delegated click capture and bubble listeners fire in React DOM order", () => {
  for (const mode of DOM_EVENT_DELEGATION_PROBE_MODES) {
    const observation = findDomEventDelegationDispatch(
      oracle,
      mode.id,
      "click-capture-bubble-order"
    );

    assert.deepEqual(
      observation.handlerLog.map((entry) => entry.label),
      ["parent-capture", "child-capture", "child-bubble", "parent-bubble"],
      mode.id
    );
    assert.deepEqual(
      observation.handlerLog.map((entry) => entry.beforeAction.target.id),
      ["child", "child", "child", "child"],
      mode.id
    );
    assert.deepEqual(
      observation.handlerLog.map((entry) => entry.beforeAction.currentTarget.id),
      ["parent", "child", "child", "parent"],
      mode.id
    );
    assert.deepEqual(
      observation.handlerLog.map((entry) => entry.beforeAction.nativeEvent.type),
      ["click", "click", "click", "click"],
      mode.id
    );
  }
});

test("stopPropagation in a delegated child bubble listener skips ancestor bubble listeners", () => {
  for (const mode of DOM_EVENT_DELEGATION_PROBE_MODES) {
    const observation = findDomEventDelegationDispatch(
      oracle,
      mode.id,
      "click-stop-propagation-child-bubble"
    );
    assert.deepEqual(
      observation.handlerLog.map((entry) => entry.label),
      ["parent-capture", "child-capture", "child-bubble"],
      mode.id
    );
    assert.equal(observation.handlerLog.at(-1).action, "stopPropagation");
    assert.equal(
      observation.handlerLog.at(-1).afterAction.isPropagationStopped,
      true
    );
    assert.equal(
      observation.nativeEventAfterDispatch.stopPropagationCallCount,
      1,
      mode.id
    );
  }
});

test("preventDefault updates synthetic and native default-prevented state", () => {
  for (const mode of DOM_EVENT_DELEGATION_PROBE_MODES) {
    const observation = findDomEventDelegationDispatch(
      oracle,
      mode.id,
      "click-prevent-default-child-bubble"
    );
    const handler = observation.handlerLog[0];

    assert.equal(handler.action, "preventDefault", mode.id);
    assert.equal(handler.beforeAction.defaultPrevented, false, mode.id);
    assert.equal(handler.beforeAction.isDefaultPrevented, false, mode.id);
    assert.equal(handler.afterAction.defaultPrevented, true, mode.id);
    assert.equal(handler.afterAction.isDefaultPrevented, true, mode.id);
    assert.equal(
      observation.nativeEventAfterDispatch.defaultPrevented,
      true,
      mode.id
    );
    assert.equal(
      observation.nativeEventAfterDispatch.preventDefaultCallCount,
      1,
      mode.id
    );
    assert.equal(observation.dispatchReturnValue, false, mode.id);
  }
});

test("private input/change extraction preflight records target and controlled metadata without dispatch", () => {
  const cases = [
    {
      controlledPropName: "value",
      domEventName: "input",
      expectedDomEventNames: ["input", "change"],
      inputType: "text",
      latestProps: {
        onChange() {},
        type: "text",
        value: "delegated text"
      },
      targetKind: "text-input"
    },
    {
      controlledPropName: "checked",
      domEventName: "click",
      expectedDomEventNames: ["click"],
      inputType: "checkbox",
      latestProps: {
        checked: true,
        onChange() {},
        type: "checkbox"
      },
      targetKind: "checkbox-input"
    }
  ];

  for (const testCase of cases) {
    const { container, dispatchRecord, targetNode } =
      createPrivateInputChangeDelegationDispatch(testCase);
    const preflight =
      pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
        dispatchRecord
      );

    assert.equal(
      preflight.kind,
      pluginEventSystem.INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND,
      testCase.domEventName
    );
    assert.equal(
      preflight.status,
      pluginEventSystem
        .PRIVATE_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_STATUS,
      testCase.domEventName
    );
    assert.equal(preflight.pluginName, "change-event-plugin");
    assert.equal(preflight.reactEventType, "change");
    assert.equal(preflight.reactName, "onChange");
    assert.equal(preflight.eventType, testCase.domEventName);
    assert.equal(preflight.targetTag, "input");
    assert.equal(preflight.targetType, testCase.inputType);
    assert.equal(preflight.targetMetadata.targetKind, testCase.targetKind);
    assert.deepEqual(
      preflight.targetMetadata.expectedDomEventNames,
      testCase.expectedDomEventNames
    );
    assert.equal(preflight.controlledMetadataAvailable, true);
    assert.equal(
      preflight.controlledMetadata.controlledPropName,
      testCase.controlledPropName
    );
    assert.equal(preflight.controlledMetadata.controlledPropPresent, true);
    assert.equal(preflight.controlledMetadata.onChangeListenerPresent, true);
    assert.equal(
      preflight.controlledMetadata.controlledStateRestoreScheduled,
      false
    );
    assert.equal(
      preflight.extractionMetadata.status,
      "blocked-before-value-tracker-change-check"
    );
    assert.equal(preflight.extractionMetadata.syntheticEventCreated, false);
    assert.equal(
      preflight.extractionMetadata.enqueueStateRestoreScheduled,
      false
    );
    assert.equal(
      preflight.controlledRestoreQueuePreflightBridge.bridgeEligible,
      true
    );
    assert.equal(
      preflight.controlledRestoreQueuePreflightBridge.bridgeRecordCreated,
      false
    );
    assert.equal(
      preflight.controlledRestoreQueuePreflightBridge.restoreQueueWritten,
      false
    );
    assert.equal(preflight.dispatchBehavior.eventDispatch, false);
    assert.equal(preflight.dispatchBehavior.syntheticEventDispatch, false);
    assert.equal(preflight.dispatchBehavior.dispatchQueueMutated, false);
    assert.equal(preflight.defaultBehavior.preventDefaultCalled, false);
    assert.equal(preflight.defaultBehavior.defaultBehaviorChanged, false);
    assert.equal(preflight.sideEffects.browserListenerInstallation, false);
    assert.equal(preflight.sideEffects.controlledStateRestoreScheduled, false);
    assert.equal(
      preflight.sideEffects.controlledRestoreQueuePreflightBridgeRecorded,
      false
    );
    assert.equal(preflight.sideEffects.browserInputMutated, false);
    assert.equal(preflight.browserDomEventCompatibilityClaimed, false);
    assert.equal(preflight.compatibilityClaimed, false);
    assert.equal(Object.hasOwn(preflight, "nativeEvent"), false);
    assert.equal(Object.hasOwn(preflight, "syntheticEvent"), false);
    assert.equal(Object.hasOwn(preflight, "latestProps"), false);
    assert.equal(container.__registrations.length, 0);
    assert.equal(Object.hasOwn(targetNode, "_valueTracker"), false);
  }
});

test("private hydration replay target-dispatch link records dispatch path blockers without widening the oracle", () => {
  const fixture = createPrivateHydrationReplayTargetDispatchLinkFixture();
  const diagnostic = fixture.diagnostic;

  assert.equal(
    diagnostic.kind,
    pluginEventSystem.HYDRATION_REPLAY_TARGET_DISPATCH_LINK_DIAGNOSTIC_KIND
  );
  assert.equal(
    diagnostic.status,
    pluginEventSystem.PRIVATE_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_STATUS
  );
  assert.equal(diagnostic.browserDomEventCompatibilityClaimed, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(diagnostic.publicRootBehaviorChanged, false);
  assert.equal(diagnostic.eventReplaySupported, false);
  assert.equal(diagnostic.hydrationReplaySupported, false);
  assert.equal(diagnostic.eventDispatch, false);
  assert.equal(diagnostic.publicDispatchEnabled, false);
  assert.equal(diagnostic.queueMutationAllowed, false);
  assert.equal(diagnostic.replayQueuesDrained, false);
  assert.equal(diagnostic.willDispatch, false);
  assert.equal(diagnostic.willHydrate, false);
  assert.equal(diagnostic.willReplay, false);
  assert.deepEqual(
    [
      diagnostic.domEventName,
      diagnostic.queueName,
      diagnostic.hydratableEventTargetLookupStatus,
      diagnostic.rootOwnershipStatus,
      diagnostic.dehydratedBoundaryOwnerId,
      diagnostic.ownerBoundaryKind,
      diagnostic.targetPath,
      diagnostic.targetDispatchPathStatus,
      diagnostic.eventPathEntryCount
    ],
    [
      "click",
      "discrete-hydration-replay-attempt",
      "blocked-on-dehydrated-boundary",
      "owned-by-dehydrated-root",
      "hydration-conformance-link:1:boundary:0",
      "suspense-boundary",
      "container.childNodes[1]",
      "no-mounted-host-instance",
      0
    ]
  );
  assert.deepEqual(
    [
      diagnostic.dispatchBlockerMetadata.blockedReason,
      diagnostic.dispatchBlockerMetadata.targetResolutionStatus,
      diagnostic.dispatchBlockerMetadata.hydrationReplayQueued,
      diagnostic.dispatchBlockerMetadata.publicDispatchEnabled,
      diagnostic.dispatchBlockerMetadata.willInvokeListeners
    ],
    [
      pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE,
      "blocked",
      false,
      false,
      false
    ]
  );
  assert.equal(fixture.dispatchRecord.hydrationReplay.queued, false);
  assert.equal(
    fixture.clickDispatchDiagnostic.kind,
    pluginEventSystem.HYDRATION_REPLAY_CLICK_DISPATCH_DIAGNOSTIC_KIND
  );
  assert.equal(
    fixture.clickDispatchDiagnostic.status,
    pluginEventSystem.PRIVATE_HYDRATION_REPLAY_CLICK_DISPATCH_STATUS
  );
  assert.equal(
    fixture.clickDispatchDiagnostic.targetClaimingDiagnostic,
    fixture.claim
  );
  assert.equal(
    fixture.clickDispatchDiagnostic.targetClaimEvidenceAccepted,
    true
  );
  assert.equal(
    fixture.clickDispatchDiagnostic.targetDispatchLinkDiagnostic,
    diagnostic
  );
  assert.equal(
    fixture.clickDispatchDiagnostic.dispatchRecord,
    fixture.dispatchRecord
  );
  assert.equal(fixture.clickDispatchDiagnostic.queueOrderPreserved, true);
  assert.equal(fixture.clickDispatchDiagnostic.eventDispatch, false);
  assert.equal(fixture.clickDispatchDiagnostic.publicDispatchEnabled, false);
  assert.equal(fixture.clickDispatchDiagnostic.eventReplayInstalled, false);
  assert.equal(
    fixture.clickDispatchDiagnostic.liveEventListenerInstalled,
    false
  );
  assert.equal(
    fixture.clickDispatchDiagnostic.privateClickDelegationDispatchGateCalled,
    false
  );
  assert.equal(fixture.clickDispatchDiagnostic.listenerInvocationCount, 0);
  assert.equal(
    pluginEventSystem.getHydrationReplayClickDispatchDiagnosticPayload(
      fixture.clickDispatchDiagnostic
    ).targetClaimingDiagnostic,
    fixture.claim
  );
  assert.deepEqual(fixture.container.__registrations, []);
  assert.deepEqual(fixture.document.__registrations, []);
});

test("synthetic event shape records target/currentTarget and post-dispatch currentTarget reset", () => {
  for (const mode of DOM_EVENT_DELEGATION_PROBE_MODES) {
    const observation = findDomEventDelegationDispatch(
      oracle,
      mode.id,
      "click-synthetic-event-shape"
    );
    const duringDispatch = observation.handlerLog[0].beforeAction;
    const afterDispatch = observation.retainedSyntheticEvents[0].afterDispatch;

    assert.equal(duringDispatch.constructorName, "SyntheticBaseEvent", mode.id);
    assert.equal(duringDispatch.type, "click", mode.id);
    assert.equal(duringDispatch.nativeEvent.type, "click", mode.id);
    assert.equal(duringDispatch.target.id, "child", mode.id);
    assert.equal(duringDispatch.currentTarget.id, "child", mode.id);
    assert.equal(duringDispatch.hasPersist, true, mode.id);
    assert.equal(duringDispatch.isPersistent, true, mode.id);
    assert.equal(duringDispatch.hasPreventDefault, true, mode.id);
    assert.equal(duringDispatch.hasStopPropagation, true, mode.id);
    assert.equal(duringDispatch.fields.clientX, 9, mode.id);
    assert.equal(duringDispatch.fields.clientY, 12, mode.id);

    assert.equal(afterDispatch.target.id, "child", mode.id);
    assert.equal(afterDispatch.currentTarget.kind, "null", mode.id);
    assert.equal(afterDispatch.nativeEvent.currentTarget.kind, "null", mode.id);
  }
});

test("selected continuous delegated examples cover mousemove ordering and wheel delta fields", () => {
  for (const mode of DOM_EVENT_DELEGATION_PROBE_MODES) {
    const mouseMove = findDomEventDelegationDispatch(
      oracle,
      mode.id,
      "mousemove-continuous-capture-bubble-order"
    );
    assert.deepEqual(
      mouseMove.handlerLog.map((entry) => entry.label),
      ["parent-capture", "child-capture", "child-bubble", "parent-bubble"],
      mode.id
    );
    assert.deepEqual(
      mouseMove.handlerLog.map((entry) => entry.beforeAction.nativeEvent.type),
      ["mousemove", "mousemove", "mousemove", "mousemove"],
      mode.id
    );
    assert.equal(mouseMove.handlerLog[0].beforeAction.fields.movementX, 2);
    assert.equal(mouseMove.handlerLog[0].beforeAction.fields.movementY, 3);

    const wheel = findDomEventDelegationDispatch(
      oracle,
      mode.id,
      "wheel-continuous-delta-and-passive-registration"
    );
    assert.equal(wheel.handlerLog[0].beforeAction.type, "wheel", mode.id);
    assert.equal(wheel.handlerLog[0].beforeAction.fields.deltaX, 1, mode.id);
    assert.equal(wheel.handlerLog[0].beforeAction.fields.deltaY, 24, mode.id);
    assert.equal(
      wheel.retainedSyntheticEvents[0].afterDispatch.target.id,
      "child",
      mode.id
    );
  }
});

test("DOM event delegation oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedDomEventDelegationOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /file:\/\/\//u);
  assert.doesNotMatch(oracleText, /\/Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-dom-event-delegation-oracle-[A-Za-z0-9]/u
  );
});

test("print DOM event delegation oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-dom-event-delegation-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readCheckedDomEventDelegationOracleText());
});

function assertRootBubbleAndCapture(installation, eventName) {
  const registration = findRegisteredEvent(
    installation.rootContainer,
    eventName
  );
  assert.equal(registration.captureCount, 1, eventName);
  assert.equal(registration.bubbleCount, 1, eventName);
}

function createPrivateFocusBlurBlockerFixture() {
  const document = createFakeDocument("focus-blur-conformance");
  const rootContainer = createFakeElement("DIV", document);
  const portalContainer = createFakeElement("SECTION", document);
  const parent = createFakeElement("DIV", document);
  const child = createFakeElement("INPUT", document);
  const rootOwner = { kind: "FocusBlurConformanceRoot" };
  const parentToken = componentTree.createHostInstanceToken(
    { kind: "FocusBlurConformanceParent" },
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    { kind: "FocusBlurConformanceChild" },
    rootOwner
  );
  const listenerCalls = { count: 0 };
  const privateListenerCalls = [];
  const parentProps = createFocusBlurProps(listenerCalls);
  const childProps = createFocusBlurProps(listenerCalls);

  appendFakeChild(portalContainer, parent);
  appendFakeChild(parent, child);
  componentTree.attachHostInstanceNode(parent, parentToken, parentProps);
  componentTree.attachHostInstanceNode(child, childToken, childProps);

  const focusCapture = createPrivateFocusBlurDispatch(
    rootContainer,
    "focusin",
    rootListeners.IS_CAPTURE_PHASE,
    child
  );
  const focusBubble = createPrivateFocusBlurDispatch(
    rootContainer,
    "focusin",
    0,
    child
  );
  const blurCapture = createPrivateFocusBlurDispatch(
    rootContainer,
    "focusout",
    rootListeners.IS_CAPTURE_PHASE,
    child
  );
  const blurBubble = createPrivateFocusBlurDispatch(
    rootContainer,
    "focusout",
    0,
    child
  );
  const portalOwnerGate =
    pluginEventSystem.createPortalEventOwnerRootGateRecord(
      focusCapture.targetDispatchPathRecord,
      {
        domEventName: "focusin",
        ownerRoot: rootOwner,
        portalContainer,
        portalKey: "focus-blur-conformance",
        rootContainer
      }
    );
  const blocker =
    pluginEventSystem.createFocusBlurEventBlockerGateFromDispatchRecords(
      [focusCapture, focusBubble, blurCapture, blurBubble],
      {
        portalEventOwnerRootGateRecord: portalOwnerGate
      }
    );
  const acceptedFocusQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      child,
      "focusin",
      false,
      event => {
        privateListenerCalls.push({
          currentTarget: event.currentTarget,
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
      },
      {
        listenerType: "accepted-private-focus-blur-conformance"
      }
    );
  const executionDispatch = createPrivateFocusBlurDispatch(
    rootContainer,
    "focusin",
    0,
    child
  );
  const execution =
    pluginEventSystem.createPrivateFocusBlurEventDispatchExecutionRecord(
      executionDispatch,
      acceptedFocusQueue,
      {
        portalEventOwnerRootGateRecord: portalOwnerGate
      }
    );

  return {
    acceptedFocusQueue,
    blocker,
    child,
    childToken,
    execution,
    listenerCalls,
    parent,
    parentToken,
    privateListenerCalls,
    portalContainer,
    rootContainer
  };
}

function createPrivateFocusBlurDispatch(
  rootContainer,
  domEventName,
  eventSystemFlags,
  target
) {
  const listener = rootListeners.createEventListenerShell(
    rootContainer,
    domEventName,
    eventSystemFlags
  );
  return pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
    listener,
    {
      target,
      type: domEventName
    }
  );
}

function createPrivateClickDispatch(rootContainer, eventSystemFlags, target) {
  return pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
    eventListener.createEventListenerWrapperRecordWithPriority(
      rootContainer,
      "click",
      eventSystemFlags
    ),
    {
      target,
      type: "click"
    }
  );
}

function createPrivateClickDelegationDispatchGateFixture() {
  const document = createFakeDocument("click-delegation-gate-conformance");
  const rootContainer = createFakeElement("DIV", document);
  const parent = createFakeElement("DIV", document);
  const child = createFakeElement("BUTTON", document);
  const rootOwner = { kind: "ClickDelegationGateConformanceRoot" };
  const parentToken = componentTree.createHostInstanceToken(
    { kind: "ClickDelegationGateConformanceParent" },
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    { kind: "ClickDelegationGateConformanceChild" },
    rootOwner
  );
  const calls = [];

  appendFakeChild(rootContainer, parent);
  appendFakeChild(parent, child);
  componentTree.attachHostInstanceNode(parent, parentToken, {});
  componentTree.attachHostInstanceNode(child, childToken, {});
  const childQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      child,
      "click",
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          target: event.target,
          targetInst: event.targetInst
        });
      }
    );
  const parentQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      parent,
      "click",
      false,
      () => {
        calls.push("parent");
      }
    );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        rootContainer,
        "click",
        0
      ),
      {
        target: child,
        type: "click"
      }
    );
  const gate =
    pluginEventSystem.createPrivateClickEventDelegationDispatchGate(
      dispatchRecord,
      childQueue
    );

  return {
    calls,
    child,
    childQueue,
    childToken,
    gate,
    parent,
    parentQueue,
    parentToken,
    rootContainer
  };
}

function createPrivateClickPortalDelegationDispatchGateFixture() {
  const document = createFakeDocument(
    "click-portal-delegation-gate-conformance"
  );
  const rootContainer = createFakeElement("DIV", document);
  const portalContainer = createFakeElement("SECTION", document);
  const parent = createFakeElement("DIV", document);
  const child = createFakeElement("BUTTON", document);
  const rootOwner = { kind: "ClickPortalDelegationGateConformanceRoot" };
  const parentToken = componentTree.createHostInstanceToken(
    { kind: "ClickPortalDelegationGateConformanceParent" },
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    { kind: "ClickPortalDelegationGateConformanceChild" },
    rootOwner
  );
  const calls = [];

  appendFakeChild(portalContainer, parent);
  appendFakeChild(parent, child);
  componentTree.attachHostInstanceNode(parent, parentToken, {});
  componentTree.attachHostInstanceNode(child, childToken, {});
  const childQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      child,
      "click",
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          target: event.target,
          targetInst: event.targetInst
        });
      }
    );
  const parentQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      parent,
      "click",
      false,
      () => {
        calls.push("parent");
      }
    );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        rootContainer,
        "click",
        0
      ),
      {
        target: child,
        type: "click"
      }
    );
  const portalOwnerGate =
    pluginEventSystem.createPortalEventOwnerRootGateRecord(
      dispatchRecord.targetDispatchPathRecord,
      {
        domEventName: "click",
        ownerRoot: rootOwner,
        portalContainer,
        portalKey: "click-portal-delegation-gate-conformance",
        rootContainer
      }
    );
  const gate =
    pluginEventSystem.createPrivateClickEventDelegationDispatchGate(
      dispatchRecord,
      childQueue,
      {
        portalEventOwnerRootGateRecord: portalOwnerGate
      }
    );

  return {
    calls,
    child,
    childQueue,
    childToken,
    gate,
    parent,
    parentQueue,
    parentToken,
    portalContainer,
    rootContainer
  };
}

function createPrivateRootRenderClickDelegationAcceptedOrderFixture() {
  const document = createFakeDocument(
    "click-root-render-delegation-order-conformance"
  );
  const container = createFakeElement("DIV", document);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: "click-root-render-admission",
    initialHostOutputIdPrefix: "click-root-render-output",
    requestIdPrefix: "click-root-render-request",
    rootIdPrefix: "click-root-render-root",
    sideEffectIdPrefix: "click-root-render-side-effect",
    updateIdPrefix: "click-root-render-update"
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const element = {
    props: {
      children: "root-render delegated click target",
      id: "root-render-click-target"
    },
    type: "button"
  };
  const render = bridge.renderContainer(create.handle, element);
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const handoff = bridge.applyInitialRenderHostOutput(admission);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);
  const targetNode = hostOutputPayload.hostNode;
  const calls = [];
  const captureQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      targetNode,
      "click",
      true,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          phase: "capture",
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
      }
    );
  const bubbleQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      targetNode,
      "click",
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          phase: "bubble",
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
      }
    );
  const targetRecord =
    componentTree.createPrivateRootHostOutputEventTargetRecord(
      hostOutputPayload
    );
  const captureDispatchRecord = createPrivateClickDispatch(
    container,
    rootListeners.IS_CAPTURE_PHASE,
    targetNode
  );
  const bubbleDispatchRecord = createPrivateClickDispatch(
    container,
    0,
    targetNode
  );
  const orderRecord =
    pluginEventSystem.invokePrivateClickEventDelegationAcceptedListenerOrder(
      [captureDispatchRecord, bubbleDispatchRecord],
      [bubbleQueue, captureQueue],
      {
        requireRootRenderMetadata: true,
        rootHostOutputEventTargetRecord: targetRecord
      }
    );

  return {
    bridge,
    bubbleQueue,
    calls,
    captureQueue,
    container,
    document,
    handoff,
    hostOutputPayload,
    orderRecord,
    sideEffects,
    targetNode,
    targetRecord
  };
}

function cleanupPrivateRootRenderClickDelegationAcceptedOrderFixture(
  fixture
) {
  fixture.bridge.cleanupInitialRenderHostOutput(fixture.handoff);
  fixture.bridge.revertCreateRootSideEffects(fixture.sideEffects);
}

function createFocusBlurProps(listenerCalls) {
  return {
    onBlur() {
      listenerCalls.count++;
    },
    onBlurCapture() {
      listenerCalls.count++;
    },
    onFocus() {
      listenerCalls.count++;
    },
    onFocusCapture() {
      listenerCalls.count++;
    }
  };
}

function createPrivateInputChangeDelegationDispatch(options) {
  const document = createPrivateDelegationDocument();
  const container = createPrivateDelegationNode("DIV", document);
  const targetNode = createPrivateDelegationNode("INPUT", document);
  targetNode.parentNode = container;
  targetNode.type = options.inputType;

  const token = componentTree.createHostInstanceToken(
    { kind: `${options.targetKind}:host` },
    { kind: `${options.targetKind}:root` }
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
      defaultPrevented: false,
      preventDefaultCallCount: 0,
      returnValue: true,
      target: targetNode,
      type: options.domEventName
    }),
    document,
    targetNode,
    token
  };
}

function createPrivateHydrationReplayTargetDispatchLinkFixture() {
  const document = createFakeDocument("hydration-link-conformance");
  const container = createFakeElement("DIV", document);
  const target = createFakeElement("BUTTON", document);
  appendFakeChild(container, createFakeComment("$"));
  appendFakeChild(container, target);
  appendFakeChild(container, createFakeComment("/$"));

  const gate = hydrationGate.createHydrationBoundaryGate({
    recordIdPrefix: "hydration-conformance-link"
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    {
      props: {
        children: "link"
      },
      type: "App"
    },
    {
      identifierPrefix: "hydration-link-conformance-"
    }
  );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        "click",
        rootListeners.IS_CAPTURE_PHASE
      ),
      {
        target,
        type: "click"
      }
    );
  const diagnostic =
    hydrationGate.createHydrationReplayTargetDispatchLinkDiagnostic(
      record,
      dispatchRecord,
      {
        source: "dom-event-delegation-conformance-hydration-link"
      }
    );
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      record,
      dispatchRecord,
      {
        source: "dom-event-delegation-conformance-hydration-ownership"
      }
    );
  const claim = hydrationGate.createHydrationTargetClaimingDiagnostic(
    record,
    ownershipDiagnostics,
    diagnostic,
    {
      source: "dom-event-delegation-conformance-hydration-claim"
    }
  );
  const clickDispatchDiagnostic =
    pluginEventSystem.createHydrationReplayClickDispatchDiagnostic(
      diagnostic,
      {
        source: "dom-event-delegation-conformance-hydration-click-dispatch",
        targetClaimingDiagnostic: claim
      }
    );

  return {
    clickDispatchDiagnostic,
    claim,
    container,
    diagnostic,
    dispatchRecord,
    document,
    record,
    target
  };
}

function createFakeDocument(label) {
  const document = createFakeEventTarget({
    label,
    localName: "#document",
    nodeName: "#document",
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createFakeEventTarget({
    label: `${label}:window`,
    nodeName: "Window",
    nodeType: null
  });
  document.createElement = function createElement(tagName) {
    return createFakeElement(String(tagName).toUpperCase(), document);
  };
  document.createTextNode = function createTextNode(text) {
    const node = createFakeEventTarget({
      localName: "#text",
      nodeName: "#text",
      nodeType: domContainer.TEXT_NODE,
      ownerDocument: document
    });
    let textValue = String(text);
    Object.defineProperties(node, {
      data: {
        configurable: true,
        enumerable: true,
        get() {
          return textValue;
        },
        set(value) {
          textValue = String(value);
        }
      },
      nodeValue: {
        configurable: true,
        enumerable: true,
        get() {
          return textValue;
        },
        set(value) {
          textValue = String(value);
        }
      },
      textContent: {
        configurable: true,
        enumerable: true,
        get() {
          return textValue;
        },
        set(value) {
          textValue = String(value);
        }
      }
    });
    return node;
  };
  return document;
}

function createPrivateDelegationDocument() {
  return createFakeDocument("input-change-conformance");
}

function createFakeElement(nodeName, ownerDocument) {
  return createFakeEventTarget({
    localName: nodeName.toLowerCase(),
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument
  });
}

function createFakeEventTarget(fields) {
  const target = {
    ...fields,
    __registrations: [],
    attributes: new Map(),
    childNodes: [],
    parentNode: null,
    addEventListener(type, listener, options) {
      this.__registrations.push({ listener, options, type });
    },
    removeEventListener(type, listener, options) {
      const index = this.__registrations.findIndex(
        (entry) =>
          entry.type === type &&
          entry.listener === listener &&
          entry.options === options
      );
      if (index !== -1) {
        this.__registrations.splice(index, 1);
      }
    },
    appendChild(child) {
      appendFakeChild(this, child);
      return child;
    },
    removeChild(child) {
      if (child.parentNode !== this) {
        throw new Error("Cannot remove a child from another parent.");
      }
      detachFakeChild(child);
      return child;
    },
    setAttribute(name, value) {
      this.attributes.set(String(name), String(value));
    },
    removeAttribute(name) {
      this.attributes.delete(String(name));
    },
    hasAttribute(name) {
      return this.attributes.has(String(name));
    },
    getAttribute(name) {
      const attributeName = String(name);
      return this.attributes.has(attributeName)
        ? this.attributes.get(attributeName)
        : null;
    }
  };
  Object.defineProperties(target, {
    firstChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[0] || null;
      }
    },
    lastChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[this.childNodes.length - 1] || null;
      }
    },
    textContent: {
      configurable: true,
      enumerable: true,
      get() {
        if (this.childNodes.length > 0) {
          return this.childNodes.map((child) => child.textContent).join("");
        }
        return this._textContent || "";
      },
      set(value) {
        for (const child of [...this.childNodes]) {
          detachFakeChild(child);
        }
        this._textContent = String(value);
      }
    }
  });
  return target;
}

function createFakeComment(data) {
  return {
    data,
    nodeType: domContainer.COMMENT_NODE,
    parentNode: null
  };
}

function appendFakeChild(parent, child) {
  detachFakeChild(child);
  parent.childNodes.push(child);
  child.parentNode = parent;
  return child;
}

function detachFakeChild(child) {
  if (child?.parentNode == null) {
    if (child && typeof child === "object") {
      child.parentNode = null;
    }
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = Array.isArray(siblings) ? siblings.indexOf(child) : -1;
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}

function createPrivateDelegationNode(nodeName, ownerDocument) {
  return createFakeElement(nodeName, ownerDocument);
}
