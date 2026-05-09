import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REACT_DOM_EVENT_PRIORITY_ORACLE_ARTIFACT_PATH,
  REACT_DOM_EVENT_PRIORITY_REACT_SOURCE_TARGET,
  REACT_DOM_EVENT_PRIORITY_SUPPORTING_TARGETS,
  REACT_DOM_EVENT_PRIORITY_TARGET
} from "../src/react-dom-event-priority-targets.mjs";
import {
  REACT_DOM_EVENT_PRIORITY_EXPECTED_CONTINUOUS_EVENTS,
  REACT_DOM_EVENT_PRIORITY_EXPECTED_DISCRETE_EVENTS,
  REACT_DOM_EVENT_PRIORITY_MESSAGE_PRIORITY_CASES,
  REACT_DOM_EVENT_PRIORITY_RESOLVE_UPDATE_PRIORITY_CASES,
  REACT_DOM_EVENT_PRIORITY_SCENARIOS
} from "../src/react-dom-event-priority-scenarios.mjs";
import {
  findReactDomEventPriorityBucketEntry,
  findReactDomFastReactBoundary,
  findReactDomMessagePriorityMapping,
  findReactDomResolveUpdatePriorityCase,
  readCheckedReactDomEventPriorityOracle,
  readCheckedReactDomEventPriorityOracleText
} from "../src/react-dom-event-priority-oracle.mjs";

const oracle = readCheckedReactDomEventPriorityOracle();

test("checked React DOM event priority oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_EVENT_PRIORITY_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-event-priority-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-event-priority-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.reactSourceTarget, REACT_DOM_EVENT_PRIORITY_REACT_SOURCE_TARGET);
  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_EVENT_PRIORITY_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_EVENT_PRIORITY_SUPPORTING_TARGETS
  );
  assert.deepEqual(oracle.generation, {
    method:
      "pinned React source files plus checked runtime inventory tarballs and local Fast React placeholder probes",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    sourceFetch:
      "raw GitHub files fetched by immutable React source commit",
    packageEvidence:
      "exact npm tarballs from checked runtime inventory with integrity and file-list validation",
    probeIsolation:
      "one Node child process probing copied local Fast React React DOM and scheduler placeholders",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    timingNormalization:
      "no wall-clock timings are recorded; message priority rows are source-derived Scheduler priority cases"
  });
});

test("React DOM event priority oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomSourceMapped: true,
    realReactDomPackageEvidenceChecked: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    domEventImplementationExists: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.worker041PlanUsed, true);
  assert.equal(oracle.evidenceClaims.fastReactPlaceholderBoundariesProbed, true);
  assert.equal(oracle.coverage.discreteEventNames, true);
  assert.equal(oracle.coverage.continuousEventNames, true);
  assert.equal(oracle.coverage.defaultEventNames, true);
  assert.equal(oracle.coverage.idlePriorityViaMessageSchedulerPriority, true);
});

test("lane-backed event priority constants are recorded separately from Scheduler constants", () => {
  assert.deepEqual(priorityValueSummary(), {
    NoEventPriority: {
      laneName: "NoLane",
      value: 0
    },
    DiscreteEventPriority: {
      laneName: "SyncLane",
      value: 2
    },
    ContinuousEventPriority: {
      laneName: "InputContinuousLane",
      value: 8
    },
    DefaultEventPriority: {
      laneName: "DefaultLane",
      value: 32
    },
    IdleEventPriority: {
      laneName: "IdleLane",
      value: 268435456
    }
  });
  assert.deepEqual(oracle.priorityConstants.schedulerPriorities, {
    ImmediateSchedulerPriority: 1,
    UserBlockingSchedulerPriority: 2,
    NormalSchedulerPriority: 3,
    LowSchedulerPriority: 4,
    IdleSchedulerPriority: 5,
    UnknownSchedulerPriority: null
  });
  assert.equal(oracle.priorityConstants.eventPriorityToLaneIdentity, true);
});

test("event-name buckets cover discrete, continuous, default, and unknown fallback cases", () => {
  assert.deepEqual(
    oracle.eventPriorityTable.buckets.discrete.map((entry) => entry.eventName),
    REACT_DOM_EVENT_PRIORITY_EXPECTED_DISCRETE_EVENTS
  );
  assert.deepEqual(
    oracle.eventPriorityTable.buckets.continuous.map(
      (entry) => entry.eventName
    ),
    REACT_DOM_EVENT_PRIORITY_EXPECTED_CONTINUOUS_EVENTS
  );
  assert.deepEqual(
    oracle.eventPriorityTable.buckets.default.map((entry) => entry.eventName),
    [
      "abort",
      "canplay",
      "canplaythrough",
      "durationchange",
      "emptied",
      "encrypted",
      "ended",
      "error",
      "gotpointercapture",
      "load",
      "loadstart",
      "loadeddata",
      "loadedmetadata",
      "lostpointercapture",
      "playing",
      "progress",
      "scrollend",
      "seeking",
      "stalled",
      "suspend",
      "timeupdate",
      "waiting"
    ]
  );

  assert.equal(
    findReactDomEventPriorityBucketEntry(oracle, "discrete", "click")
      .priorityName,
    "DiscreteEventPriority"
  );
  assert.equal(
    findReactDomEventPriorityBucketEntry(oracle, "continuous", "wheel")
      .priorityName,
    "ContinuousEventPriority"
  );
  assert.equal(
    findReactDomEventPriorityBucketEntry(oracle, "default", "scrollend")
      .priorityName,
    "DefaultEventPriority"
  );
  assert.deepEqual(oracle.eventPriorityTable.specialCases.unknownEventFallback, {
    eventName: "unknown-fast-react-probe-event",
    priorityName: "DefaultEventPriority",
    priorityValue: 32,
    laneName: "DefaultLane",
    source: "default branch of getEventPriority"
  });
});

test("message event records the Scheduler priority bridge including idle", () => {
  assert.equal(
    oracle.messageSchedulerPriorityMapping.length,
    REACT_DOM_EVENT_PRIORITY_MESSAGE_PRIORITY_CASES.length
  );
  assert.deepEqual(
    oracle.messageSchedulerPriorityMapping.map((entry) => [
      entry.schedulerPriorityName,
      entry.schedulerValue,
      entry.eventPriorityName,
      entry.eventPriorityValue,
      entry.laneName
    ]),
    [
      ["ImmediateSchedulerPriority", 1, "DiscreteEventPriority", 2, "SyncLane"],
      [
        "UserBlockingSchedulerPriority",
        2,
        "ContinuousEventPriority",
        8,
        "InputContinuousLane"
      ],
      ["NormalSchedulerPriority", 3, "DefaultEventPriority", 32, "DefaultLane"],
      ["LowSchedulerPriority", 4, "DefaultEventPriority", 32, "DefaultLane"],
      ["IdleSchedulerPriority", 5, "IdleEventPriority", 268435456, "IdleLane"],
      [
        "UnknownSchedulerPriority",
        null,
        "DefaultEventPriority",
        32,
        "DefaultLane"
      ]
    ]
  );
  assert.equal(
    findReactDomMessagePriorityMapping(oracle, "IdleSchedulerPriority")
      .eventPriorityName,
    "IdleEventPriority"
  );
});

test("resolveUpdatePriority fallback order and representative cases are recorded", () => {
  assert.deepEqual(
    oracle.resolveUpdatePriority.cases.map((entry) => entry.id),
    REACT_DOM_EVENT_PRIORITY_RESOLVE_UPDATE_PRIORITY_CASES.map(
      (entry) => entry.id
    )
  );
  assert.deepEqual(oracle.resolveUpdatePriority.fallbackOrder, [
    "return stored current update priority when it is not NoEventPriority",
    "otherwise read window.event",
    "return DefaultEventPriority when window.event is undefined",
    "otherwise map window.event.type through getEventPriority"
  ]);
  assert.equal(
    findReactDomResolveUpdatePriorityCase(
      oracle,
      "stored-current-update-priority-wins"
    ).expectedPriorityName,
    "ContinuousEventPriority"
  );
  assert.equal(
    findReactDomResolveUpdatePriorityCase(
      oracle,
      "no-current-priority-and-no-window-event-defaults"
    ).expectedPriorityName,
    "DefaultEventPriority"
  );
  assert.equal(
    findReactDomResolveUpdatePriorityCase(
      oracle,
      "window-event-click-maps-discrete"
    ).expectedPriorityValue,
    2
  );
});

test("source, package, and scenario evidence is recorded", () => {
  assert.deepEqual(oracle.scenarios, REACT_DOM_EVENT_PRIORITY_SCENARIOS);
  assert.equal(
    oracle.sourceEvidence["ReactDOMEventListener.js"].sourcePath,
    "packages/react-dom-bindings/src/events/ReactDOMEventListener.js"
  );
  assert.equal(
    oracle.sourceEvidence["ReactVersions.js"].versionChecks.reactDom,
    true
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages.react.version, "19.2.6");

  for (const relativePath of [
    "cjs/react-dom-client.development.js",
    "cjs/react-dom-client.production.js"
  ]) {
    assert.equal(
      oracle.compiledPackageEvidence[relativePath].containsGetEventPriority,
      true
    );
    assert.equal(
      oracle.compiledPackageEvidence[relativePath].containsMessagePriorityBridge,
      true
    );
  }
});

test("Fast React comparison boundaries describe current placeholders", () => {
  const root = findReactDomFastReactBoundary(
    oracle,
    "fast-react-react-dom-root-placeholder"
  );
  assert.equal(root.status, "unsupported-placeholder");
  assert.equal(root.placeholder, true);
  assert.equal(root.eventPriorityInternalsExported, false);
  assert.equal(root.updatePriorityInternalsExported, false);
  assert.equal(root.probes.flushSyncCall.status, "throws");
  assert.equal(root.probes.internalsPriorityAccess.status, "throws");

  const client = findReactDomFastReactBoundary(
    oracle,
    "fast-react-react-dom-client-placeholder"
  );
  assert.equal(client.probes.createRootCall.status, "throws");
  assert.equal(client.probes.hydrateRootCall.status, "throws");

  const scheduler = findReactDomFastReactBoundary(
    oracle,
    "fast-react-scheduler-placeholder-priority-context"
  );
  assert.deepEqual(scheduler.constants, {
    unstable_ImmediatePriority: 1,
    unstable_UserBlockingPriority: 2,
    unstable_NormalPriority: 3,
    unstable_LowPriority: 4,
    unstable_IdlePriority: 5
  });
  assert.equal(scheduler.probes.getCurrentPriorityLevelCall.status, "throws");
  assert.equal(scheduler.probes.runWithPriorityCall.status, "throws");
});

test("React DOM event priority oracle artifact has no local temp path leaks", () => {
  const oracleText = readCheckedReactDomEventPriorityOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /file:\/\/\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-event-priority-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print React DOM event priority oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-event-priority-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedReactDomEventPriorityOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedReactDomEventPriorityOracleText());
});

function priorityValueSummary() {
  return Object.fromEntries(
    Object.entries(oracle.priorityConstants.eventPriorities).map(
      ([priorityName, priority]) => [
        priorityName,
        {
          laneName: priority.laneName,
          value: priority.value
        }
      ]
    )
  );
}
