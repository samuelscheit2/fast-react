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

const oracle = readCheckedDomEventDelegationOracle();
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
const pluginEventSystem = require(
  path.join(repoRoot, "packages/react-dom/src/events/plugin-event-system.js")
);
const rootListeners = require(
  path.join(repoRoot, "packages/react-dom/src/events/root-listeners.js")
);

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
  assert.equal(fixture.listenerCalls.count, 0);
  assert.equal(fixture.rootContainer.__registrations.length, 0);
  assert.equal(fixture.portalContainer.__registrations.length, 0);
  assert.equal(fixture.child.__registrations.length, 0);

  componentTree.detachHostInstanceToken(fixture.childToken);
  componentTree.detachHostInstanceToken(fixture.parentToken);
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

  return {
    blocker,
    child,
    childToken,
    listenerCalls,
    parent,
    parentToken,
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

function createFakeDocument(label) {
  const document = createFakeEventTarget({
    label,
    nodeName: "#document",
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  return document;
}

function createFakeElement(nodeName, ownerDocument) {
  return createFakeEventTarget({
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

function appendFakeChild(parent, child) {
  parent.childNodes.push(child);
  child.parentNode = parent;
  return child;
}
