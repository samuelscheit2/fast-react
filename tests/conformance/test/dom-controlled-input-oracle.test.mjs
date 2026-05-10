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
  assert.equal(intent.restoreIntent.intentRecorded, true);
  assert.equal(intent.restoreIntent.restoreTargetWouldBeQueued, true);
  assert.equal(intent.restoreIntent.latestPropsEvidenceAccepted, true);
  assert.equal(intent.restoreIntent.latestPropsLookupPerformed, true);
  assert.equal(intent.restoreIntent.eventDispatchRecordAccepted, true);
  assert.equal(intent.restoreIntent.eventPluginDispatchPerformed, false);
  assert.equal(intent.restoreIntent.restoreQueueWritten, false);
  assert.equal(intent.restoreIntent.controlledStateRestoreInvoked, false);
  assert.equal(intent.restoreIntent.restoreFlushed, false);
  assert.equal(intent.restoreIntent.liveValueTrackerInstalled, false);
  assert.equal(intent.restoreIntent.valueTrackerFieldWritten, false);
  assert.equal(intent.restoreIntent.propertyDescriptorInstalled, false);
  assert.equal(intent.restoreIntent.hostValueRead, false);
  assert.equal(intent.restoreIntent.hostValueWritten, false);
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
    assert.equal(intent.sideEffects.restoreQueueWritten, false);
    assert.equal(intent.sideEffects.restoreQueueFlushed, false);
    assert.equal(intent.sideEffects.hostWrapperInvoked, false);
    assert.equal(intent.sideEffects.hostValueRead, false);
    assert.equal(intent.sideEffects.hostValueWritten, false);
    assert.equal(intent.sideEffects.browserInputMutated, false);
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
