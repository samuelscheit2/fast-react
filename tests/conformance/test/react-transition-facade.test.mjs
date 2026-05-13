import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const reactPackageRoot = path.join(repoRoot, "packages", "react");
const React = require(path.join(reactPackageRoot, "index.js"));
const ReactCjsDevelopment = require(path.join(
  reactPackageRoot,
  "cjs",
  "react.development.js"
));
const ReactCjsProduction = require(path.join(
  reactPackageRoot,
  "cjs",
  "react.production.js"
));
const ReactServer = require(path.join(reactPackageRoot, "react.react-server.js"));
const Transition = require(path.join(reactPackageRoot, "transition.js"));
const hookDispatcher = require(path.join(
  reactPackageRoot,
  "hook-dispatcher.js"
));
const reactCjsDevelopmentPath = path.join(
  reactPackageRoot,
  "cjs",
  "react.development.js"
);

const expectedStartTransitionRootlessCurrentnessFieldNames = [
  "apiName",
  "compatibilityTarget",
  "currentPublicExport",
  "rootlessFacade",
  "transitionScopeExecution",
  "errorChannel",
  "restoresPreviousDepth",
  "restoresPreviousDepthAfterThrow",
  "schedulerIntegration",
  "rootLaneIntegration",
  "rootScheduling",
  "rootExecution",
  "dispatcherRouting",
  "schedulerCallbackExecution",
  "compatibilityClaimed",
  "blocker"
];
const expectedStartTransitionRootlessCurrentness = {
  apiName: "startTransition",
  compatibilityTarget: "react@19.2.6",
  currentPublicExport: "react.startTransition facade",
  rootlessFacade: true,
  transitionScopeExecution: "synchronous",
  errorChannel: "global-report-error",
  restoresPreviousDepth: true,
  restoresPreviousDepthAfterThrow: true,
  schedulerIntegration: false,
  rootLaneIntegration: false,
  rootScheduling: false,
  rootExecution: false,
  dispatcherRouting: false,
  schedulerCallbackExecution: false,
  compatibilityClaimed: false,
  blocker:
    "startTransition remains a rootless facade until scheduler and root-lane integration are admitted"
};
const expectedStartTransitionBlockedExecutionPaths = [
  "dispatcher-routing",
  "scheduler-callback",
  "root-lane-selection",
  "root-scheduling",
  "root-execution"
];
const expectedStartTransitionBlockedCompatibilityClaims = [
  "public-transition",
  "public-root",
  "scheduler-package",
  "package-compatibility"
];
const expectedStartTransitionRootlessSurfaceCurrentnessFieldNames = [
  "surfaceId",
  "source",
  "entrypoint",
  "moduleShape",
  "hasStartTransitionExport",
  "sameAsRootlessFacade",
  "sameAsRootExport",
  "sameAsCjsDevelopmentExport",
  "sameAsCjsProductionExport",
  "reactServerStartTransitionAbsent",
  "functionName",
  "functionLength",
  "rootlessFacade",
  "blockedExecutionPaths",
  "blockedCompatibilityClaims",
  "compatibilityClaimed"
];
const expectedStartTransitionRootlessSurfaceCurrentnessRows = [
  {
    surfaceId: "react-root",
    source: "packages/react/index.js",
    entrypoint: "react",
    moduleShape: "CommonJS root export",
    hasStartTransitionExport: true,
    sameAsRootlessFacade: true,
    sameAsRootExport: true,
    sameAsCjsDevelopmentExport: true,
    sameAsCjsProductionExport: true,
    reactServerStartTransitionAbsent: true,
    functionName: "",
    functionLength: 1,
    rootlessFacade: true,
    blockedExecutionPaths: expectedStartTransitionBlockedExecutionPaths,
    blockedCompatibilityClaims:
      expectedStartTransitionBlockedCompatibilityClaims,
    compatibilityClaimed: false
  },
  {
    surfaceId: "react-cjs-development",
    source: "packages/react/cjs/react.development.js",
    entrypoint: "react/cjs/react.development.js",
    moduleShape: "CommonJS alias export",
    hasStartTransitionExport: true,
    sameAsRootlessFacade: true,
    sameAsRootExport: true,
    sameAsCjsDevelopmentExport: true,
    sameAsCjsProductionExport: true,
    reactServerStartTransitionAbsent: true,
    functionName: "",
    functionLength: 1,
    rootlessFacade: true,
    blockedExecutionPaths: expectedStartTransitionBlockedExecutionPaths,
    blockedCompatibilityClaims:
      expectedStartTransitionBlockedCompatibilityClaims,
    compatibilityClaimed: false
  },
  {
    surfaceId: "react-cjs-production",
    source: "packages/react/cjs/react.production.js",
    entrypoint: "react/cjs/react.production.js",
    moduleShape: "CommonJS alias export",
    hasStartTransitionExport: true,
    sameAsRootlessFacade: true,
    sameAsRootExport: true,
    sameAsCjsDevelopmentExport: true,
    sameAsCjsProductionExport: true,
    reactServerStartTransitionAbsent: true,
    functionName: "",
    functionLength: 1,
    rootlessFacade: true,
    blockedExecutionPaths: expectedStartTransitionBlockedExecutionPaths,
    blockedCompatibilityClaims:
      expectedStartTransitionBlockedCompatibilityClaims,
    compatibilityClaimed: false
  },
  {
    surfaceId: "react-server",
    source: "packages/react/react.react-server.js",
    entrypoint: "react react-server",
    moduleShape: "React Server CommonJS export",
    hasStartTransitionExport: false,
    sameAsRootlessFacade: false,
    sameAsRootExport: false,
    sameAsCjsDevelopmentExport: false,
    sameAsCjsProductionExport: false,
    reactServerStartTransitionAbsent: true,
    functionName: null,
    functionLength: null,
    rootlessFacade: false,
    blockedExecutionPaths: expectedStartTransitionBlockedExecutionPaths,
    blockedCompatibilityClaims:
      expectedStartTransitionBlockedCompatibilityClaims,
    compatibilityClaimed: false
  }
];
const expectedStartTransitionBlockedFlags = [
  "publicTransitionCompatibilityBlocked",
  "publicRootCompatibilityBlocked",
  "schedulerCompatibilityBlocked",
  "schedulerPackageCompatibilityBlocked",
  "packageCompatibilityBlocked",
  "dispatcherRoutingBlocked",
  "schedulerExecutionBlocked",
  "rootLaneIntegrationBlocked",
  "rootSchedulingBlocked",
  "rootExecutionBlocked",
  "callbackExecutionBlocked"
];
const expectedStartTransitionCompatibilityFalseFlags = [
  "publicTransitionCompatibility",
  "publicRootCompatibility",
  "publicSchedulerCompatibility",
  "schedulerIntegration",
  "rootLaneIntegration",
  "rootScheduling",
  "rootExecution",
  "schedulerCallbackExecution",
  "packageCompatibility",
  "compatibilityClaimed"
];

function withCapturedGlobalErrors(callback) {
  const hadReportError = Object.hasOwn(globalThis, "reportError");
  const originalReportError = globalThis.reportError;
  const errors = [];

  Object.defineProperty(globalThis, "reportError", {
    configurable: true,
    value(error) {
      errors.push(error);
    },
    writable: true
  });

  try {
    return {
      errors,
      value: callback()
    };
  } finally {
    if (hadReportError) {
      Object.defineProperty(globalThis, "reportError", {
        configurable: true,
        value: originalReportError,
        writable: true
      });
    } else {
      delete globalThis.reportError;
    }
  }
}

test("React startTransition export has the React 19.2.6 CommonJS shape", () => {
  const descriptor = Object.getOwnPropertyDescriptor(React, "startTransition");

  assert.deepEqual(
    {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      writable: descriptor.writable
    },
    {
      configurable: true,
      enumerable: true,
      writable: true
    }
  );
  assert.equal(typeof React.startTransition, "function");
  assert.equal(React.startTransition.name, "");
  assert.equal(React.startTransition.length, 1);
  assert.equal(React.startTransition, Transition.startTransition);
  assert.equal(ReactCjsDevelopment.startTransition, Transition.startTransition);
  assert.equal(ReactCjsProduction.startTransition, Transition.startTransition);
  assert.equal(ReactCjsDevelopment.startTransition, React.startTransition);
  assert.equal(ReactCjsProduction.startTransition, React.startTransition);
  assert.equal(Object.hasOwn(ReactServer, "startTransition"), false);
});

test("startTransition rootless currentness metadata keeps scheduler and root work blocked", () => {
  const metadata = Transition.startTransitionRootlessCurrentness;

  assert.deepEqual(
    Transition.startTransitionRootlessCurrentnessFieldNames,
    expectedStartTransitionRootlessCurrentnessFieldNames
  );
  assert.deepEqual(metadata, expectedStartTransitionRootlessCurrentness);
  assert.equal(Object.isFrozen(metadata), true);
  assert.equal(
    Object.isFrozen(Transition.startTransitionRootlessCurrentnessFieldNames),
    true
  );
  assert.equal(metadata.rootlessFacade, true);
  assert.equal(metadata.schedulerIntegration, false);
  assert.equal(metadata.rootLaneIntegration, false);
  assert.equal(metadata.rootScheduling, false);
  assert.equal(metadata.rootExecution, false);
  assert.equal(metadata.dispatcherRouting, false);
  assert.equal(metadata.schedulerCallbackExecution, false);
  assert.equal(metadata.compatibilityClaimed, false);
});

test("private startTransition rootless currentness report proves root and alias surfaces", () => {
  const report = Transition.createStartTransitionRootlessCurrentnessReport();

  assert.equal(
    report.kind,
    "fast-react.private.start_transition_rootless_currentness"
  );
  assert.equal(report.version, 1);
  assert.equal(report.status, Transition.startTransitionRootlessCurrentnessStatus);
  assert.equal(report.compatibilityTarget, "react@19.2.6");
  assert.equal(report.apiName, "startTransition");
  assert.deepEqual(
    report.rootlessCurrentnessFieldNames,
    expectedStartTransitionRootlessCurrentnessFieldNames
  );
  assert.deepEqual(
    report.rootlessCurrentness,
    expectedStartTransitionRootlessCurrentness
  );
  assert.deepEqual(
    report.surfaceCurrentnessFieldNames,
    expectedStartTransitionRootlessSurfaceCurrentnessFieldNames
  );
  assert.deepEqual(
    report.surfaceCurrentnessRows,
    expectedStartTransitionRootlessSurfaceCurrentnessRows
  );
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.rootlessCurrentnessFieldNames), true);
  assert.equal(Object.isFrozen(report.rootlessCurrentness), true);
  assert.equal(Object.isFrozen(report.surfaceCurrentnessFieldNames), true);
  assert.equal(Object.isFrozen(report.surfaceCurrentnessRows), true);
  for (const row of report.surfaceCurrentnessRows) {
    assert.equal(Object.isFrozen(row), true, row.surfaceId);
    assert.equal(Object.isFrozen(row.blockedExecutionPaths), true);
    assert.equal(Object.isFrozen(row.blockedCompatibilityClaims), true);
  }
  for (const flagName of expectedStartTransitionBlockedFlags) {
    assert.equal(report[flagName], true, flagName);
  }
  for (const flagName of expectedStartTransitionCompatibilityFalseFlags) {
    assert.equal(report[flagName], false, flagName);
  }
  assert.equal(
    Transition.validateStartTransitionRootlessCurrentnessReport(report),
    null
  );
  assert.equal(
    Transition.isStartTransitionRootlessCurrentnessReport(report),
    true
  );

  const consumption =
    Transition.consumeStartTransitionRootlessCurrentnessReport(report);
  assert.equal(
    consumption.status,
    Transition.startTransitionRootlessCurrentnessConsumptionStatus
  );
  assert.equal(consumption.accepted, true);
  assert.equal(consumption.currentnessStatus, report.status);
  assert.equal(consumption.compatibilityTarget, "react@19.2.6");
  assert.equal(consumption.rootlessFacade, true);
  assert.deepEqual(
    consumption.rootlessCurrentness,
    expectedStartTransitionRootlessCurrentness
  );
  assert.deepEqual(
    consumption.surfaceCurrentnessRows,
    expectedStartTransitionRootlessSurfaceCurrentnessRows
  );
  for (const flagName of expectedStartTransitionBlockedFlags) {
    assert.equal(consumption[flagName], true, flagName);
  }
  for (const flagName of expectedStartTransitionCompatibilityFalseFlags) {
    assert.equal(consumption[flagName], false, flagName);
  }

  for (const privateName of [
    "createStartTransitionRootlessCurrentnessReport",
    "validateStartTransitionRootlessCurrentnessReport",
    "consumeStartTransitionRootlessCurrentnessReport",
    "isStartTransitionRootlessCurrentnessReport"
  ]) {
    assert.equal(React[privateName], undefined, privateName);
    assert.equal(ReactCjsDevelopment[privateName], undefined, privateName);
    assert.equal(ReactCjsProduction[privateName], undefined, privateName);
    assert.equal(ReactServer[privateName], undefined, privateName);
  }
});

test("private startTransition rootless currentness rejects forged reports and claims", () => {
  const report = Transition.createStartTransitionRootlessCurrentnessReport();

  assertStartTransitionCurrentnessRejected(
    Object.freeze({ ...report }),
    "startTransition-rootless-currentness-source-proof"
  );
  assertStartTransitionCurrentnessRejected(
    { ...report },
    "startTransition-rootless-currentness-source-proof"
  );

  const hostile = createHostileReportProxy("startTransition currentness");
  assertStartTransitionCurrentnessRejected(
    hostile.report,
    "startTransition-rootless-currentness-source-proof"
  );
  assert.equal(hostile.getTrapCalls(), 0);

  const mutableReport = withObjectFreezeBypassed(() =>
    Transition.createStartTransitionRootlessCurrentnessReport()
  );
  assert.equal(Object.isFrozen(mutableReport), false);
  assertStartTransitionCurrentnessRejected(
    mutableReport,
    "startTransition-rootless-currentness-not-frozen"
  );

  assertStartTransitionCurrentnessRejected(
    Transition.createStartTransitionRootlessCurrentnessReport({
      rootlessCurrentness: {
        schedulerIntegration: true
      }
    }),
    "startTransition-rootless-currentness-rootless-metadata"
  );
  assertStartTransitionCurrentnessRejected(
    Transition.createStartTransitionRootlessCurrentnessReport({
      rootlessCurrentness: {
        transitionScopeExecution: "async"
      }
    }),
    "startTransition-rootless-currentness-rootless-metadata"
  );
  assertStartTransitionCurrentnessRejected(
    Transition.createStartTransitionRootlessCurrentnessReport({
      rootlessCurrentness: {
        onStartTransitionFinishCompatibility: true
      }
    }),
    "startTransition-rootless-currentness-rootless-metadata"
  );
  assertStartTransitionCurrentnessRejected(
    Transition.createStartTransitionRootlessCurrentnessReport({
      surfaceCurrentnessFieldNames: ["surfaceId"]
    }),
    "startTransition-rootless-currentness-shape"
  );

  for (const flagName of expectedStartTransitionBlockedFlags) {
    assertStartTransitionCurrentnessRejected(
      Transition.createStartTransitionRootlessCurrentnessReport({
        [flagName]: false
      }),
      "startTransition-rootless-currentness-blocker-claim"
    );
  }
  for (const flagName of expectedStartTransitionCompatibilityFalseFlags) {
    assertStartTransitionCurrentnessRejected(
      Transition.createStartTransitionRootlessCurrentnessReport({
        [flagName]: true
      }),
      "startTransition-rootless-currentness-compatibility-claim"
    );
  }

  let accessorRead = false;
  const accessorOptions = {};
  Object.defineProperty(accessorOptions, "compatibilityClaimed", {
    enumerable: true,
    get() {
      accessorRead = true;
      return true;
    }
  });
  assertStartTransitionCurrentnessRejected(
    Transition.createStartTransitionRootlessCurrentnessReport(accessorOptions),
    "startTransition-rootless-currentness-source-proof"
  );
  assert.equal(accessorRead, false);

  const ambiguousProxyOptions = new Proxy(
    {},
    {
      ownKeys() {
        throw new Error("ambiguous startTransition options");
      }
    }
  );
  assertStartTransitionCurrentnessRejected(
    Transition.createStartTransitionRootlessCurrentnessReport(
      ambiguousProxyOptions
    ),
    "startTransition-rootless-currentness-source-proof"
  );
});

test("private startTransition rootless currentness rejects mutable nested evidence", () => {
  const mutableRootlessMetadata = withObjectFreezeSelectivelyBypassed(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) =>
      value?.apiName === "startTransition" &&
      value?.currentPublicExport === "react.startTransition facade"
  );
  assertNestedFreezeBypass(mutableRootlessMetadata, (report) => [
    report.rootlessCurrentness
  ]);
  assertStartTransitionCurrentnessRejected(
    mutableRootlessMetadata.report,
    "startTransition-rootless-currentness-rootless-metadata"
  );

  const mutableSurfaceRow = withObjectFreezeSelectivelyBypassed(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) => value?.surfaceId === "react-root"
  );
  assertNestedFreezeBypass(mutableSurfaceRow, (report) => [
    report.surfaceCurrentnessRows.find(
      (row) => row.surfaceId === "react-root"
    )
  ]);
  assertStartTransitionCurrentnessRejected(
    mutableSurfaceRow.report,
    "startTransition-rootless-currentness-surface-currentness"
  );

  const mutableSurfaceArray = withObjectFreezeSelectivelyBypassed(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) =>
      Array.isArray(value) && value.includes("dispatcher-routing")
  );
  assertNestedFreezeBypass(mutableSurfaceArray, (report) => [
    report.surfaceCurrentnessRows[0].blockedExecutionPaths
  ]);
  assertStartTransitionCurrentnessRejected(
    mutableSurfaceArray.report,
    "startTransition-rootless-currentness-surface-currentness"
  );
});

test("private startTransition rootless currentness rejects frozen reports with extra own keys", () => {
  const topLevelClaim = withObjectFreezePollution(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) =>
      value?.kind === "fast-react.private.start_transition_rootless_currentness",
    (value) => defineExtraClaim(value, "publicTransitionCompatibilityClaimed")
  );
  assertPollutionApplied(topLevelClaim);
  assert.equal(
    topLevelClaim.report.publicTransitionCompatibilityClaimed,
    true
  );
  assertStartTransitionCurrentnessRejected(
    topLevelClaim.report,
    "startTransition-rootless-currentness-shape"
  );

  const rootlessMetadataClaim = withObjectFreezePollution(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) =>
      value?.apiName === "startTransition" &&
      value?.currentPublicExport === "react.startTransition facade",
    (value) => defineExtraClaim(value, "publicRootCompatibilityClaimed")
  );
  assertPollutionApplied(rootlessMetadataClaim);
  assert.equal(
    rootlessMetadataClaim.report.rootlessCurrentness
      .publicRootCompatibilityClaimed,
    true
  );
  assertStartTransitionCurrentnessRejected(
    rootlessMetadataClaim.report,
    "startTransition-rootless-currentness-rootless-metadata"
  );

  const surfaceRowClaim = withObjectFreezePollution(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) => value?.surfaceId === "react-root",
    (value) => defineExtraClaim(value, "schedulerIntegrationClaimed")
  );
  assertPollutionApplied(surfaceRowClaim);
  assert.equal(
    surfaceRowClaim.report.surfaceCurrentnessRows[0]
      .schedulerIntegrationClaimed,
    true
  );
  assertStartTransitionCurrentnessRejected(
    surfaceRowClaim.report,
    "startTransition-rootless-currentness-surface-currentness"
  );
});

test("private startTransition rootless currentness rejects frozen arrays with extra own keys", () => {
  const rootlessFieldNamesClaim = withObjectFreezePollution(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) =>
      Array.isArray(value) &&
      value.includes("apiName") &&
      value.includes("blocker"),
    (value) => defineExtraClaim(value, "fieldNameClaimAlias")
  );
  assertPollutionApplied(rootlessFieldNamesClaim);
  assert.equal(
    rootlessFieldNamesClaim.report.rootlessCurrentnessFieldNames
      .fieldNameClaimAlias,
    true
  );
  assertStartTransitionCurrentnessRejected(
    rootlessFieldNamesClaim.report,
    "startTransition-rootless-currentness-shape"
  );

  const surfaceFieldNamesClaim = withObjectFreezePollution(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) =>
      Array.isArray(value) &&
      value.includes("surfaceId") &&
      value.includes("moduleShape"),
    (value) => defineExtraClaim(value, "fieldNameClaimAlias")
  );
  assertPollutionApplied(surfaceFieldNamesClaim);
  assert.equal(
    surfaceFieldNamesClaim.report.surfaceCurrentnessFieldNames
      .fieldNameClaimAlias,
    true
  );
  assertStartTransitionCurrentnessRejected(
    surfaceFieldNamesClaim.report,
    "startTransition-rootless-currentness-shape"
  );

  const rowsArrayClaim = withObjectFreezePollution(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) =>
      Array.isArray(value) && value[0]?.surfaceId === "react-root",
    (value) => defineExtraClaim(value, "packageCompatibilityClaimed")
  );
  assertPollutionApplied(rowsArrayClaim);
  assert.equal(
    rowsArrayClaim.report.surfaceCurrentnessRows.packageCompatibilityClaimed,
    true
  );
  assertStartTransitionCurrentnessRejected(
    rowsArrayClaim.report,
    "startTransition-rootless-currentness-surface-currentness"
  );

  const blockedExecutionClaim = withObjectFreezePollution(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) =>
      Array.isArray(value) && value.includes("dispatcher-routing"),
    (value) => defineExtraClaim(value, "schedulerIntegrationClaimed")
  );
  assertPollutionApplied(blockedExecutionClaim);
  assert.equal(
    blockedExecutionClaim.report.surfaceCurrentnessRows[0]
      .blockedExecutionPaths.schedulerIntegrationClaimed,
    true
  );
  assertStartTransitionCurrentnessRejected(
    blockedExecutionClaim.report,
    "startTransition-rootless-currentness-surface-currentness"
  );

  const blockedCompatibilityClaim = withObjectFreezePollution(
    () => Transition.createStartTransitionRootlessCurrentnessReport(),
    (value) =>
      Array.isArray(value) && value.includes("public-transition"),
    (value) => defineExtraClaim(value, "packageCompatibilityClaimed")
  );
  assertPollutionApplied(blockedCompatibilityClaim);
  assert.equal(
    blockedCompatibilityClaim.report.surfaceCurrentnessRows[0]
      .blockedCompatibilityClaims.packageCompatibilityClaimed,
    true
  );
  assertStartTransitionCurrentnessRejected(
    blockedCompatibilityClaim.report,
    "startTransition-rootless-currentness-surface-currentness"
  );
});

test("private startTransition rootless currentness rejects public surface drift", () => {
  const originalStartTransition = React.startTransition;
  const fakeStartTransition = createSameShapeFakeStartTransition();

  React.startTransition = fakeStartTransition;
  try {
    assert.equal(React.startTransition.name, "");
    assert.equal(React.startTransition.length, 1);
    assert.equal(ReactCjsDevelopment.startTransition, fakeStartTransition);
    assert.equal(ReactCjsProduction.startTransition, fakeStartTransition);

    const report = Transition.createStartTransitionRootlessCurrentnessReport();
    const rootRow = report.surfaceCurrentnessRows.find(
      (row) => row.surfaceId === "react-root"
    );

    assert.equal(rootRow.hasStartTransitionExport, true);
    assert.equal(rootRow.sameAsRootlessFacade, false);
    assert.equal(rootRow.rootlessFacade, false);
    assertStartTransitionCurrentnessRejected(
      report,
      "startTransition-rootless-currentness-surface-currentness"
    );
  } finally {
    React.startTransition = originalStartTransition;
  }
});

test("private startTransition rootless currentness rejects CJS alias drift", () => {
  const fakeStartTransition = createSameShapeFakeStartTransition();

  withTemporaryCjsDevelopmentExports(
    {
      ...React,
      startTransition: fakeStartTransition
    },
    () => {
      const report =
        Transition.createStartTransitionRootlessCurrentnessReport();
      const cjsDevelopmentRow = report.surfaceCurrentnessRows.find(
        (row) => row.surfaceId === "react-cjs-development"
      );

      assert.equal(cjsDevelopmentRow.hasStartTransitionExport, true);
      assert.equal(cjsDevelopmentRow.sameAsRootlessFacade, false);
      assert.equal(cjsDevelopmentRow.sameAsRootExport, false);
      assertStartTransitionCurrentnessRejected(
        report,
        "startTransition-rootless-currentness-surface-currentness"
      );
    }
  );
});

test("private startTransition rootless currentness rejects react-server export presence", () => {
  const hadStartTransition = Object.hasOwn(ReactServer, "startTransition");
  const previousStartTransition = ReactServer.startTransition;

  ReactServer.startTransition = Transition.startTransition;
  try {
    const report = Transition.createStartTransitionRootlessCurrentnessReport();
    const serverRow = report.surfaceCurrentnessRows.find(
      (row) => row.surfaceId === "react-server"
    );

    assert.equal(serverRow.hasStartTransitionExport, true);
    assert.equal(serverRow.reactServerStartTransitionAbsent, false);
    assertStartTransitionCurrentnessRejected(
      report,
      "startTransition-rootless-currentness-surface-currentness"
    );
  } finally {
    if (hadStartTransition) {
      ReactServer.startTransition = previousStartTransition;
    } else {
      delete ReactServer.startTransition;
    }
  }
});

test("startTransition runs a valid scope synchronously and returns undefined", () => {
  const observations = [];

  const result = React.startTransition(() => {
    observations.push("scope-start");
    observations.push(Transition.isTransitionBatchActive());
    return "ignored";
  });

  observations.push("after-call");

  assert.equal(result, undefined);
  assert.deepEqual(observations, ["scope-start", true, "after-call"]);
  assert.equal(Transition.isTransitionBatchActive(), false);
});

test("startTransition ignores installed hook dispatchers and opens no root scheduling path", () => {
  const previousDispatcher = hookDispatcher.ReactCurrentDispatcher.current;
  const dispatcherCalls = [];
  const scopeCalls = [];

  hookDispatcher.ReactCurrentDispatcher.current = new Proxy(
    {},
    {
      get(_target, property) {
        dispatcherCalls.push(String(property));
        return () => dispatcherCalls.push(`call:${String(property)}`);
      }
    }
  );

  try {
    const result = React.startTransition(() => {
      scopeCalls.push("scope");
    });

    assert.equal(result, undefined);
    assert.deepEqual(scopeCalls, ["scope"]);
    assert.deepEqual(dispatcherCalls, []);
  } finally {
    hookDispatcher.ReactCurrentDispatcher.current = previousDispatcher;
  }
});

test("nested startTransition calls keep the transition marker active until the outer scope exits", () => {
  const observations = [];

  React.startTransition(() => {
    observations.push(Transition.isTransitionBatchActive());
    React.startTransition(() => {
      observations.push(Transition.isTransitionBatchActive());
    });
    observations.push(Transition.isTransitionBatchActive());
  });
  observations.push(Transition.isTransitionBatchActive());

  assert.deepEqual(observations, [true, true, true, false]);
});

test("startTransition reports the original thrown scope error and restores the marker", () => {
  const thrown = new Error("transition scope failed");

  const observation = withCapturedGlobalErrors(() =>
    React.startTransition(() => {
      assert.equal(Transition.isTransitionBatchActive(), true);
      throw thrown;
    })
  );

  assert.equal(observation.value, undefined);
  assert.deepEqual(observation.errors, [thrown]);
  assert.equal(Transition.isTransitionBatchActive(), false);
});

test("startTransition callback error handling restores nested depth to the current outer scope", () => {
  const thrown = new Error("inner transition scope failed");
  const observations = [];

  const observation = withCapturedGlobalErrors(() =>
    React.startTransition(() => {
      observations.push([
        "outer-before-inner",
        Transition.isTransitionBatchActive()
      ]);
      React.startTransition(() => {
        observations.push([
          "inner-before-throw",
          Transition.isTransitionBatchActive()
        ]);
        throw thrown;
      });
      observations.push([
        "outer-after-inner",
        Transition.isTransitionBatchActive()
      ]);
    })
  );

  assert.equal(observation.value, undefined);
  assert.deepEqual(observation.errors, [thrown]);
  assert.deepEqual(observations, [
    ["outer-before-inner", true],
    ["inner-before-throw", true],
    ["outer-after-inner", true]
  ]);
  assert.equal(Transition.isTransitionBatchActive(), false);
});

test("startTransition reports synchronously rejected returned thenables", () => {
  const rejected = new Error("returned transition thenable rejected");
  const thenCalls = [];

  const observation = withCapturedGlobalErrors(() =>
    React.startTransition(() => ({
      then(resolve, reject) {
        thenCalls.push({
          active: Transition.isTransitionBatchActive(),
          rejectType: typeof reject,
          resolveType: typeof resolve
        });
        reject(rejected);
      }
    }))
  );

  assert.equal(observation.value, undefined);
  assert.deepEqual(thenCalls, [
    {
      active: true,
      rejectType: "function",
      resolveType: "function"
    }
  ]);
  assert.deepEqual(observation.errors, [rejected]);
  assert.equal(Transition.isTransitionBatchActive(), false);
});

test("startTransition reports errors thrown while observing returned thenables", () => {
  const thrown = new Error("returned transition then threw");
  const thenable = {
    then() {
      throw thrown;
    }
  };

  const observation = withCapturedGlobalErrors(() =>
    React.startTransition(() => thenable)
  );

  assert.equal(observation.value, undefined);
  assert.deepEqual(observation.errors, [thrown]);
  assert.equal(Transition.isTransitionBatchActive(), false);
});

test("startTransition fails closed for accessor-backed returned thenables", () => {
  const thrown = new Error("returned transition then accessor threw");
  const thenable = {};
  let thenReads = 0;
  Object.defineProperty(thenable, "then", {
    configurable: true,
    get() {
      thenReads += 1;
      throw thrown;
    }
  });

  const observation = withCapturedGlobalErrors(() =>
    React.startTransition(() => thenable)
  );

  assert.equal(observation.value, undefined);
  assert.equal(thenReads, 1);
  assert.deepEqual(observation.errors, [thrown]);
  assert.equal(Transition.isTransitionBatchActive(), false);
});

test("startTransition does not broaden returned thenable handling to functions", () => {
  const thenCalls = [];
  function returnedFunction() {}
  returnedFunction.then = () => {
    thenCalls.push("then");
  };

  const observation = withCapturedGlobalErrors(() =>
    React.startTransition(() => returnedFunction)
  );

  assert.equal(observation.value, undefined);
  assert.deepEqual(thenCalls, []);
  assert.deepEqual(observation.errors, []);
  assert.equal(Transition.isTransitionBatchActive(), false);
});

test("startTransition reports non-function scope input with the observed React TypeError", () => {
  for (const scope of [undefined, null, 42, "not a function", {}]) {
    const observation = withCapturedGlobalErrors(() =>
      React.startTransition(scope)
    );

    assert.equal(observation.value, undefined);
    assert.equal(observation.errors.length, 1);
    assert.equal(observation.errors[0].name, "TypeError");
    assert.equal(observation.errors[0].message, "scope is not a function");
    assert.equal(Transition.isTransitionBatchActive(), false);
  }
});

test("startTransition facade source stays rootless and scheduler-free", () => {
  const source = readFileSync(
    path.join(reactPackageRoot, "transition.js"),
    "utf8"
  );

  assert.equal(source.includes("react-dom"), false);
  assert.equal(source.includes("root-bridge"), false);
  assert.equal(source.includes("root_scheduler"), false);
  assert.equal(source.includes("scheduleUpdate"), false);
  assert.equal(source.includes("requestUpdateLane"), false);
  assert.equal(source.includes("requestDeferredLane"), false);
  assert.equal(source.includes("markRootUpdated"), false);
  assert.equal(source.includes("ReactCurrentDispatcher"), false);
  assert.equal(source.includes("resolveDispatcher"), false);
  assert.equal(source.includes("scheduler/index"), false);
});

function assertStartTransitionCurrentnessRejected(report, reason) {
  assert.equal(
    Transition.validateStartTransitionRootlessCurrentnessReport(report),
    reason
  );
  assert.equal(
    Transition.isStartTransitionRootlessCurrentnessReport(report),
    false
  );
  assert.throws(
    () => Transition.consumeStartTransitionRootlessCurrentnessReport(report),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", reason);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", reason);
      assert.equal(error.entrypoint, "react", reason);
      assert.equal(
        error.exportName,
        "startTransitionRootlessCurrentness",
        reason
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6", reason);
      assert.equal(error.reason, reason);
      assert.equal(error.apiName, "startTransition", reason);
      for (const flagName of expectedStartTransitionBlockedFlags) {
        assert.equal(error[flagName], true, `${reason}:${flagName}`);
      }
      for (const flagName of expectedStartTransitionCompatibilityFalseFlags) {
        assert.equal(error[flagName], false, `${reason}:${flagName}`);
      }
      return true;
    },
    reason
  );
}

function createHostileReportProxy(label) {
  let trapCalls = 0;
  const trap = () => {
    trapCalls += 1;
    throw new Error(`${label} inspected before source proof`);
  };

  return {
    report: new Proxy(
      {},
      {
        get: trap,
        getOwnPropertyDescriptor: trap,
        getPrototypeOf: trap,
        isExtensible: trap,
        ownKeys: trap
      }
    ),
    getTrapCalls() {
      return trapCalls;
    }
  };
}

function withObjectFreezeBypassed(callback) {
  const originalFreeze = Object.freeze;
  Object.freeze = (value) => value;

  try {
    return callback();
  } finally {
    Object.freeze = originalFreeze;
  }
}

function withObjectFreezeSelectivelyBypassed(callback, shouldBypass) {
  const originalFreeze = Object.freeze;
  const bypassed = [];
  Object.freeze = (value) => {
    if (shouldBypass(value)) {
      bypassed.push(value);
      return value;
    }

    return originalFreeze(value);
  };

  try {
    return {
      report: callback(),
      bypassed
    };
  } finally {
    Object.freeze = originalFreeze;
  }
}

function withObjectFreezePollution(callback, shouldPollute, pollute) {
  const originalFreeze = Object.freeze;
  const polluted = [];
  Object.freeze = (value) => {
    if (shouldPollute(value)) {
      pollute(value);
      polluted.push(value);
    }

    return originalFreeze(value);
  };

  try {
    return {
      report: callback(),
      polluted
    };
  } finally {
    Object.freeze = originalFreeze;
  }
}

function defineExtraClaim(value, propertyName) {
  Object.defineProperty(value, propertyName, {
    configurable: true,
    enumerable: true,
    value: true,
    writable: true
  });
}

function assertPollutionApplied({ report, polluted }) {
  assert.equal(Object.isFrozen(report), true);
  assert.notEqual(polluted.length, 0);

  for (const value of polluted) {
    assert.equal(Object.isFrozen(value), true);
  }
}

function assertNestedFreezeBypass({ report, bypassed }, getNestedValues) {
  assert.equal(Object.isFrozen(report), true);
  assert.notEqual(bypassed.length, 0);

  for (const nestedValue of getNestedValues(report)) {
    assert.equal(Object.isFrozen(nestedValue), false);
    assert.equal(bypassed.includes(nestedValue), true);
  }
}

function createSameShapeFakeStartTransition() {
  const fakeStartTransition = function (scope) {
    if (typeof scope === "function") {
      scope();
    }
  };

  Object.defineProperties(fakeStartTransition, {
    length: {
      configurable: true,
      value: 1
    },
    name: {
      configurable: true,
      value: ""
    }
  });

  return fakeStartTransition;
}

function withTemporaryCjsDevelopmentExports(exportsObject, callback) {
  const moduleId = require.resolve(reactCjsDevelopmentPath);
  const moduleRecord = require.cache[moduleId];
  const previousExports = moduleRecord.exports;

  moduleRecord.exports = exportsObject;
  try {
    return callback();
  } finally {
    moduleRecord.exports = previousExports;
  }
}
