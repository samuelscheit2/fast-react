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

  return {
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
  return {
    ...fields,
    __registrations: [],
    childNodes: [],
    parentNode: null,
    addEventListener(type, listener, options) {
      this.__registrations.push({ listener, options, type });
    }
  };
}

function createFakeComment(data) {
  return {
    data,
    nodeType: domContainer.COMMENT_NODE,
    parentNode: null
  };
}

function appendFakeChild(parent, child) {
  parent.childNodes.push(child);
  child.parentNode = parent;
  return child;
}

function createPrivateDelegationNode(nodeName, ownerDocument) {
  return createFakeElement(nodeName, ownerDocument);
}
