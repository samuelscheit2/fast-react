import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

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
