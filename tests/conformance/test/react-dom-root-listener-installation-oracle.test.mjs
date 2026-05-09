import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  findReactDomRootListenerInstallationObservation,
  findReactDomRootListenerRegisteredEvent,
  readCheckedReactDomRootListenerInstallationOracle,
  readCheckedReactDomRootListenerInstallationOracleText
} from "../src/react-dom-root-listener-installation-oracle.mjs";
import {
  REACT_DOM_ROOT_LISTENER_INSTALLATION_DELEGATED_EVENT_EXAMPLES,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_NON_DELEGATED_EVENT_EXAMPLES,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_ORACLE_ARTIFACT_PATH,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_SELECTION_EVENT,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_SUPPORTING_TARGETS,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_TARGET
} from "../src/react-dom-root-listener-installation-targets.mjs";
import {
  REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS
} from "../src/react-dom-root-listener-installation-scenarios.mjs";

const oracle = readCheckedReactDomRootListenerInstallationOracle();

test("checked React DOM root listener installation oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_ROOT_LISTENER_INSTALLATION_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-root-listener-installation-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree and probed through a deterministic minimal DOM host",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per React DOM listener-installation scenario and mode",
    probeTimeoutMs: 15000,
    generatedTimestampIncluded: false,
    pathNormalization:
      "temporary extraction paths and React randomized listener marker names are not serialized"
  });
  assert.deepEqual(
    oracle.reactDomTarget,
    REACT_DOM_ROOT_LISTENER_INSTALLATION_TARGET
  );
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_ROOT_LISTENER_INSTALLATION_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.deepEqual(
    oracle.probeModes,
    REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES
  );
  assert.deepEqual(
    oracle.scenarios,
    REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS
  );
});

test("React DOM root listener installation oracle keeps dispatch and Fast React claims out of scope", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(oracle.evidenceClaims.reactDomClientCreateRootProbed, true);
  assert.equal(oracle.evidenceClaims.reactDomClientHydrateRootProbed, true);
  assert.equal(oracle.evidenceClaims.pluginDispatchBehaviorProbed, false);
  assert.equal(oracle.evidenceClaims.syntheticEventDispatchProbed, false);
  assert.equal(oracle.evidenceClaims.eventPriorityLaneClaimsIncluded, false);
  assert.equal(oracle.coverage.rootContainerListenerRegistration, true);
  assert.equal(oracle.coverage.hydrationRootContainerListenerRegistration, true);
  assert.equal(oracle.coverage.sameContainerCreateRootDedupe, true);
  assert.equal(oracle.coverage.sameContainerHydrateRootDedupe, true);
  assert.equal(oracle.coverage.pluginDispatchBehaviorExcluded, true);
  assert.equal(
    oracle.intentionalGaps.some((gap) => gap.id === "no-plugin-dispatch-behavior"),
    true
  );
});

test("React DOM root listener installation oracle covers every scenario for each mode", () => {
  for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
    const observations = oracle.listenerInstallationObservations[mode.id];
    assert.equal(
      observations.length,
      REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS.length,
      mode.id
    );
    assert.deepEqual(
      observations.map((observation) => observation.scenarioId),
      REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS.map(
        (scenario) => scenario.id
      ),
      mode.id
    );
  }
});

test("createRoot installs delegated root listeners and owner-document selectionchange", () => {
  for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
    const observation = findReactDomRootListenerInstallationObservation(
      oracle,
      mode.id,
      "create-root-root-container"
    );

    assert.equal(observation.before.rootContainer.listenerCount, 0, mode.id);
    assert.equal(observation.before.ownerDocument.listenerCount, 0, mode.id);
    assert.equal(observation.after.rootContainer.listenerCount, 138, mode.id);
    assert.equal(observation.after.rootContainer.eventNames.length, 85, mode.id);
    assert.equal(observation.after.ownerDocument.listenerCount, 1, mode.id);
    assert.equal(observation.after.window.listenerCount, 1, mode.id);
    assert.equal(
      observation.after.rootContainerReactListeningMarker.propertyCount,
      1,
      mode.id
    );
    assert.equal(
      observation.after.ownerDocumentReactListeningMarker.propertyCount,
      1,
      mode.id
    );
    assert.equal(observation.passiveListenerSupportDetected, true, mode.id);
    assert.equal(
      observation.after.rootContainer.eventNames.includes(
        REACT_DOM_ROOT_LISTENER_INSTALLATION_SELECTION_EVENT.nativeEventName
      ),
      false,
      mode.id
    );

    assertDelegatedEventExamples(observation.after.rootContainer, mode.id);
    assertNonDelegatedEventExamples(observation.after.rootContainer, mode.id);
    assertSelectionChange(observation.after.ownerDocument, mode.id);
  }
});

test("hydrateRoot installs delegated root listeners and owner-document selectionchange", () => {
  for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
    const observation = findReactDomRootListenerInstallationObservation(
      oracle,
      mode.id,
      "hydrate-root-root-container"
    );

    assert.equal(observation.before.rootContainer.listenerCount, 0, mode.id);
    assert.equal(observation.before.ownerDocument.listenerCount, 0, mode.id);
    assert.equal(observation.after.rootContainer.listenerCount, 138, mode.id);
    assert.equal(observation.after.rootContainer.eventNames.length, 85, mode.id);
    assert.equal(observation.after.ownerDocument.listenerCount, 1, mode.id);
    assert.equal(observation.after.window.listenerCount, 1, mode.id);
    assert.deepEqual(
      observation.hydrationRoot,
      {
        constructorName: "ReactDOMHydrationRoot",
        ownKeys: ["_internalRoot"],
        unstableScheduleHydrationType: "function"
      },
      mode.id
    );
    assert.equal(
      observation.after.rootContainerReactListeningMarker.propertyCount,
      1,
      mode.id
    );
    assert.equal(
      observation.after.ownerDocumentReactListeningMarker.propertyCount,
      1,
      mode.id
    );
    assert.equal(observation.passiveListenerSupportDetected, true, mode.id);
    assert.equal(
      observation.after.rootContainer.eventNames.includes(
        REACT_DOM_ROOT_LISTENER_INSTALLATION_SELECTION_EVENT.nativeEventName
      ),
      false,
      mode.id
    );

    assertDelegatedEventExamples(observation.after.rootContainer, mode.id);
    assertSelectionChange(observation.after.ownerDocument, mode.id);
  }
});

test("non-delegated native events install as capture-only root listeners", () => {
  for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
    const observation = findReactDomRootListenerInstallationObservation(
      oracle,
      mode.id,
      "create-root-root-container"
    );

    assertNonDelegatedEventExamples(observation.after.rootContainer, mode.id);
  }
});

test("createRoot listener markers dedupe repeated same-container installation", () => {
  for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
    const observation = findReactDomRootListenerInstallationObservation(
      oracle,
      mode.id,
      "create-root-same-container-dedupe"
    );

    assert.equal(
      observation.afterFirstCreateRoot.rootContainer.listenerCount,
      138,
      mode.id
    );
    assert.equal(
      observation.afterSecondCreateRoot.rootContainer.listenerCount,
      138,
      mode.id
    );
    assert.deepEqual(
      observation.listenerDeltas,
      {
        rootContainer: 0,
        ownerDocument: 0,
        window: 0
      },
      mode.id
    );
    assert.equal(
      observation.afterSecondCreateRoot.rootContainerReactListeningMarker
        .propertyCount,
      1,
      mode.id
    );

    if (mode.nodeEnv === "development") {
      assert.equal(observation.consoleCalls.length, 1, mode.id);
      assert.match(
        observation.consoleCalls[0].args[0].value,
        /createRoot\(\) on a container that has already/u
      );
    } else {
      assert.deepEqual(observation.consoleCalls, [], mode.id);
    }
  }
});

test("hydrateRoot listener markers dedupe repeated same-container installation", () => {
  for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
    const observation = findReactDomRootListenerInstallationObservation(
      oracle,
      mode.id,
      "hydrate-root-same-container-dedupe"
    );

    assert.equal(
      observation.afterFirstHydrateRoot.rootContainer.listenerCount,
      138,
      mode.id
    );
    assert.equal(
      observation.afterSecondHydrateRoot.rootContainer.listenerCount,
      138,
      mode.id
    );
    assert.deepEqual(
      observation.listenerDeltas,
      {
        rootContainer: 0,
        ownerDocument: 0,
        window: 0
      },
      mode.id
    );
    assert.equal(
      observation.afterSecondHydrateRoot.rootContainerReactListeningMarker
        .propertyCount,
      1,
      mode.id
    );

    if (mode.nodeEnv === "development") {
      assert.equal(observation.consoleCalls.length, 1, mode.id);
      assert.match(
        observation.consoleCalls[0].args[0].value,
        /createRoot\(\) on a container that has already/u
      );
    } else {
      assert.deepEqual(observation.consoleCalls, [], mode.id);
    }
  }
});

test("mixed createRoot and hydrateRoot calls reuse same-container listener markers", () => {
  for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
    const observation = findReactDomRootListenerInstallationObservation(
      oracle,
      mode.id,
      "create-root-then-hydrate-root-same-container-dedupe"
    );

    assert.equal(
      observation.afterCreateRoot.rootContainer.listenerCount,
      138,
      mode.id
    );
    assert.equal(
      observation.afterHydrateRoot.rootContainer.listenerCount,
      138,
      mode.id
    );
    assert.equal(observation.afterHydrateRoot.ownerDocument.listenerCount, 1);
    assert.deepEqual(
      observation.listenerDeltas,
      {
        rootContainer: 0,
        ownerDocument: 0,
        window: 0
      },
      mode.id
    );

    if (mode.nodeEnv === "development") {
      assert.equal(observation.consoleCalls.length, 1, mode.id);
      assert.match(
        observation.consoleCalls[0].args[0].value,
        /createRoot\(\) on a container that has already/u
      );
    } else {
      assert.deepEqual(observation.consoleCalls, [], mode.id);
    }
  }
});

test("multiple roots in one document dedupe owner-document selectionchange only", () => {
  for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
    const observation = findReactDomRootListenerInstallationObservation(
      oracle,
      mode.id,
      "create-root-same-document-dedupe"
    );

    assert.equal(
      observation.afterSecondRoot.primaryRootContainer.listenerCount,
      138,
      mode.id
    );
    assert.equal(
      observation.afterSecondRoot.secondRootContainer.listenerCount,
      138,
      mode.id
    );
    assert.equal(observation.afterSecondRoot.ownerDocument.listenerCount, 1);
    assert.equal(observation.ownerDocumentListenerDelta, 0, mode.id);
    assertSelectionChange(observation.afterSecondRoot.ownerDocument, mode.id);
  }
});

test("portal containers install listener sets without duplicating same-document markers", () => {
  for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
    const observation = findReactDomRootListenerInstallationObservation(
      oracle,
      mode.id,
      "portal-same-document-listeners"
    );

    assert.equal(
      observation.afterCreateRoot.portalContainer.listenerCount,
      0,
      mode.id
    );
    assert.equal(
      observation.afterFirstPortalRender.portalContainer.listenerCount,
      138,
      mode.id
    );
    assert.equal(
      observation.afterSecondPortalRender.portalContainer.listenerCount,
      138,
      mode.id
    );
    assert.equal(observation.portalListenerDeltaAfterSecondRender, 0, mode.id);
    assert.equal(
      observation.afterFirstPortalRender.portalContainerReactListeningMarker
        .propertyCount,
      1,
      mode.id
    );
    assert.equal(
      observation.afterFirstPortalRender.ownerDocument.listenerCount,
      1,
      mode.id
    );
    assertDelegatedEventExamples(
      observation.afterFirstPortalRender.portalContainer,
      mode.id
    );
    assertNonDelegatedEventExamples(
      observation.afterFirstPortalRender.portalContainer,
      mode.id
    );
  }
});

test("cross-document portals install selectionchange on the portal owner document", () => {
  for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
    const observation = findReactDomRootListenerInstallationObservation(
      oracle,
      mode.id,
      "portal-cross-document-listeners"
    );

    assert.equal(
      observation.afterCreateRoot.externalPortalContainer.listenerCount,
      0,
      mode.id
    );
    assert.equal(
      observation.afterCreateRoot.externalOwnerDocument.listenerCount,
      0,
      mode.id
    );
    assert.equal(
      observation.afterPortalRender.externalPortalContainer.listenerCount,
      138,
      mode.id
    );
    assert.equal(
      observation.afterPortalRender.externalOwnerDocument.listenerCount,
      1,
      mode.id
    );
    assert.equal(observation.externalOwnerDocumentListenerDelta, 1, mode.id);
    assert.equal(
      observation.afterPortalRender.primaryOwnerDocument.listenerCount,
      1,
      mode.id
    );
    assertSelectionChange(
      observation.afterPortalRender.externalOwnerDocument,
      mode.id
    );
    assertNonDelegatedEventExamples(
      observation.afterPortalRender.externalPortalContainer,
      mode.id
    );
  }
});

test("print React DOM root listener installation oracle CLI supports markdown", () => {
  const output = execFileSync(
    process.execPath,
    [
      "scripts/print-react-dom-root-listener-installation-oracle.mjs",
      "--format=markdown"
    ],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024
    }
  );
  assert.match(output, /Root Listener Installation Oracle/u);
  assert.match(output, /root-container listeners/u);
  assert.match(output, /pluginDispatchBehaviorExcluded: true/u);
});

test("print React DOM root listener installation oracle CLI emits checked JSON", () => {
  const output = execFileSync(
    process.execPath,
    [
      "scripts/print-react-dom-root-listener-installation-oracle.mjs",
      "--format=json"
    ],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024
    }
  );
  assert.equal(output, readCheckedReactDomRootListenerInstallationOracleText());
});

test("React DOM root listener installation oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedReactDomRootListenerInstallationOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /file:\/\/\//u);
  assert.doesNotMatch(oracleText, /\/Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-root-listener-installation-oracle-/u
  );
});

function assertDelegatedEventExamples(targetSummary, label) {
  for (const expected of REACT_DOM_ROOT_LISTENER_INSTALLATION_DELEGATED_EVENT_EXAMPLES) {
    const registration = findReactDomRootListenerRegisteredEvent(
      targetSummary,
      expected.nativeEventName
    );
    assert.equal(
      registration.captureCount,
      expected.expectedCaptureCount,
      `${label}:${expected.nativeEventName}:capture`
    );
    assert.equal(
      registration.bubbleCount,
      expected.expectedBubbleCount,
      `${label}:${expected.nativeEventName}:bubble`
    );
    assert.equal(
      registration.passiveTrueCount,
      expected.expectedPassiveTrueCount,
      `${label}:${expected.nativeEventName}:passive`
    );
  }
}

function assertNonDelegatedEventExamples(targetSummary, label) {
  for (const expected of REACT_DOM_ROOT_LISTENER_INSTALLATION_NON_DELEGATED_EVENT_EXAMPLES) {
    const registration = findReactDomRootListenerRegisteredEvent(
      targetSummary,
      expected.nativeEventName
    );
    assert.equal(
      registration.captureCount,
      expected.expectedCaptureCount,
      `${label}:${expected.nativeEventName}:capture`
    );
    assert.equal(
      registration.bubbleCount,
      expected.expectedBubbleCount,
      `${label}:${expected.nativeEventName}:bubble`
    );
    assert.equal(
      registration.passiveTrueCount,
      expected.expectedPassiveTrueCount,
      `${label}:${expected.nativeEventName}:passive`
    );
  }
}

function assertSelectionChange(targetSummary, label) {
  const registration = findReactDomRootListenerRegisteredEvent(
    targetSummary,
    REACT_DOM_ROOT_LISTENER_INSTALLATION_SELECTION_EVENT.nativeEventName
  );
  assert.equal(
    registration.captureCount,
    REACT_DOM_ROOT_LISTENER_INSTALLATION_SELECTION_EVENT
      .expectedOwnerDocumentCaptureCount,
    `${label}:selectionchange:capture`
  );
  assert.equal(
    registration.bubbleCount,
    REACT_DOM_ROOT_LISTENER_INSTALLATION_SELECTION_EVENT
      .expectedOwnerDocumentBubbleCount,
    `${label}:selectionchange:bubble`
  );
}
