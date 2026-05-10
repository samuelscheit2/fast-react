import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";

import {
  REACT_TEST_RENDERER_ERROR_SURFACE_ORACLE_ARTIFACT_PATH,
  REACT_TEST_RENDERER_ERROR_SURFACE_PROBE_MODES,
  REACT_TEST_RENDERER_ERROR_SURFACE_SUPPORTING_TARGETS,
  REACT_TEST_RENDERER_ERROR_SURFACE_TARGET
} from "../src/react-test-renderer-error-surface-targets.mjs";
import {
  REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIO_IDS,
  REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIOS
} from "../src/react-test-renderer-error-surface-scenarios.mjs";
import {
  REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME,
  REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_ROWS,
  REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS,
  findReactTestRendererErrorSurfaceObservation,
  readCheckedReactTestRendererErrorSurfaceOracle,
  readCheckedReactTestRendererErrorSurfaceOracleText
} from "../src/react-test-renderer-error-surface-oracle.mjs";
import {
  REACT_TEST_RENDERER_ERROR_SURFACE_LOCAL_GATE_STATUS,
  REACT_TEST_RENDERER_ERROR_SURFACE_LOCAL_PUBLIC_SCENARIO_ADMISSIONS,
  REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTIC_ROW_STATUS,
  REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTIC_ROWS,
  REACT_TEST_RENDERER_ERROR_SURFACE_PUBLIC_COMPATIBILITY_STATUS,
  REACT_TEST_RENDERER_ERROR_SURFACE_PUBLIC_UNBLOCKING_REQUIREMENTS,
  evaluateReactTestRendererErrorSurfaceLocalGate
} from "../src/react-test-renderer-serialization-local-gate.mjs";

const oracle = readCheckedReactTestRendererErrorSurfaceOracle();
const require = createRequire(import.meta.url);
const DEFAULT_MODE = "default-node-development";
const DEPRECATION_WARNING =
  "react-test-renderer is deprecated. See https://react.dev/warnings/react-test-renderer";
const UNMOUNTED_ROOT_MESSAGE =
  "Can't access .root on unmounted test renderer";
const UNMOUNTED_INSTANCE_MESSAGE =
  "Unable to find node on an unmounted component.";
const OBJECT_CHILD_MESSAGE =
  "Objects are not valid as a React child (found: object with keys {foo}). If you meant to render a collection of children, use an array instead.";
const INVALID_UNDEFINED_TYPE_MESSAGE =
  "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
const INVALID_NULL_TYPE_MESSAGE =
  "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: null.";
const SHALLOW_REMOVAL_MESSAGE =
  "react-test-renderer/shallow has been removed. See https://react.dev/warnings/react-test-renderer.";
const ERROR_SURFACE_PUBLIC_UNBLOCK_REQUIREMENT_IDS =
  REACT_TEST_RENDERER_ERROR_SURFACE_PUBLIC_UNBLOCKING_REQUIREMENTS.map(
    (requirement) => requirement.id
  );
const privateTestInstanceWrapperRecordSymbol = Symbol.for(
  "fast.react_test_renderer.private_test_instance_wrapper_record"
);
const privateErrorBoundaryDiagnosticsSymbol = Symbol.for(
  "fast.react_test_renderer.private_error_boundary_diagnostics"
);
const rootRequestBridgeSymbol = Symbol.for(
  "fast.react_test_renderer.root_request_bridge"
);
const jsEntrypoints = [
  {
    entrypoint: "react-test-renderer",
    specifier: "../../../packages/react-test-renderer/index.js"
  },
  {
    entrypoint: "react-test-renderer/cjs/react-test-renderer.development",
    specifier:
      "../../../packages/react-test-renderer/cjs/react-test-renderer.development.js"
  },
  {
    entrypoint: "react-test-renderer/cjs/react-test-renderer.production",
    specifier:
      "../../../packages/react-test-renderer/cjs/react-test-renderer.production.js"
  }
];

test("checked React test renderer error surface oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_TEST_RENDERER_ERROR_SURFACE_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-test-renderer-error-surface-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method: "exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    pathNormalization:
      "temporary roots, package roots, file URLs, stack paths, and local workspace paths are normalized before artifact serialization",
    actEnvironment:
      "probes set IS_REACT_ACT_ENVIRONMENT and wrap create/update/unmount work in react-test-renderer act()"
  });

  assert.deepEqual(
    oracle.reactTestRendererTarget,
    REACT_TEST_RENDERER_ERROR_SURFACE_TARGET
  );
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_TEST_RENDERER_ERROR_SURFACE_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-test-renderer"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages["react-is"].version, "19.2.6");
});

test("React test renderer error surface oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.evidenceClaims, {
    npmMetadataResolved: true,
    tarballsDownloaded: true,
    tarballIntegrityVerified: true,
    packageDependencyGraphVerified: true,
    testInstanceQueryErrorsProbed: true,
    unmountedRootAccessProbed: true,
    invalidCreateUpdateInputsProbed: true,
    shallowRemovalProbed: true,
    unsupportedUseMessageProbed: true,
    deterministicPathNormalizationApplied: true,
    fastReactComparedToReactTestRenderer: false
  });
  assert.deepEqual(oracle.conformanceClaims, {
    realReactTestRendererBehaviorProbed: true,
    fastReactComparedToReactTestRenderer: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(oracle.coverage, {
    invalidFindAndFindByResults: true,
    unmountedRootAccess: true,
    retainedUnmountedTestInstanceAccess: true,
    invalidCreateInputs: true,
    invalidUpdateInputs: true,
    shallowRemoval: true,
    unsupportedMessages: true,
    consoleWarningCapture: true,
    productionBehavior: false,
    fastReactComparison: false
  });
});

test("React test renderer error surface local gate admits only private diagnostics", () => {
  const gate = evaluateReactTestRendererErrorSurfaceLocalGate({ oracle });

  assert.equal(gate.status, REACT_TEST_RENDERER_ERROR_SURFACE_LOCAL_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsReady, true);
  assert.deepEqual(gate.privateDiagnosticBlockers, []);
  assert.deepEqual(
    gate.privateDiagnosticRows.map((row) => row.id),
    REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTIC_ROWS.map(
      (row) => row.id
    )
  );

  for (const row of gate.privateDiagnosticRows) {
    assert.equal(row.rowKind, "private-diagnostic");
    assert.equal(
      row.status,
      REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTIC_ROW_STATUS
    );
    assert.equal(row.admittedForPrivateDiagnostics, true);
    assert.equal(row.publicComparisonBlocked, true);
    assert.equal(row.admittedForFastReactComparison, false);
    assert.equal(row.compatibilityClaimed, false);
  }

  assert.equal(gate.publicCompatibilityReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(
    gate.publicCompatibilityBlockers,
    ERROR_SURFACE_PUBLIC_UNBLOCK_REQUIREMENT_IDS
  );
  assert.deepEqual(gate.admittedPublicScenarios, []);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(
    gate.publicScenarioAdmissions.map((scenario) => scenario.scenarioId),
    REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIO_IDS
  );
  assert.deepEqual(
    gate.publicScenarioAdmissions,
    REACT_TEST_RENDERER_ERROR_SURFACE_LOCAL_PUBLIC_SCENARIO_ADMISSIONS
  );

  for (const scenario of gate.publicScenarioAdmissions) {
    assert.equal(
      scenario.status,
      REACT_TEST_RENDERER_ERROR_SURFACE_PUBLIC_COMPATIBILITY_STATUS
    );
    assert.equal(scenario.rowKind, "public-error-surface");
    assert.equal(scenario.publicComparisonBlocked, true);
    assert.equal(scenario.admittedForFastReactComparison, false);
    assert.equal(scenario.compatibilityClaimed, false);
    assert.deepEqual(
      scenario.unblockRequires,
      ERROR_SURFACE_PUBLIC_UNBLOCK_REQUIREMENT_IDS
    );
  }

  assert.equal(gate.localChecks.createRoutingGatePresent, true);
  assert.equal(gate.localChecks.updatePrivateRoutePresent, true);
  assert.equal(gate.localChecks.unmountPrivateRoutePresent, true);
  assert.equal(
    gate.localChecks.privateToJSONSerializationFacadeGatePresent,
    true
  );
  assert.equal(
    gate.localChecks.privateToJSONSerializationFacadeRecognizesRustDiagnostics,
    true
  );
  assert.equal(
    gate.localChecks.privateToJSONSerializationFacadePubliclyBlocked,
    true
  );
  assert.equal(gate.localChecks.privateJsonDiagnosticsPresent, true);
  assert.equal(gate.localChecks.committedFiberInspectionPresent, true);
  assert.equal(
    gate.localChecks.privateRecordOnlyTestInstanceWrapperPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateRecordOnlyTestInstanceQueryPathPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceBridgeQueryDiagnosticsPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceFindAllQueryDiagnosticsPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceFindByQueryDiagnosticsPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceQueryBridgePreflightPresent,
    true
  );
  assert.equal(gate.localChecks.privateActQueueMetadataPresent, true);
  assert.equal(gate.localChecks.passiveEffectMetadataOnly, true);
  assert.equal(gate.localChecks.actFlushExecutionPresent, false);
  assert.equal(gate.localChecks.effectCallbackExecutionPresent, false);
  assert.equal(gate.localChecks.publicJsFacadeRoutingPresent, false);
  assert.equal(
    gate.localChecks.publicCreateUpdateUnmountErrorSurfaceBlocked,
    true
  );
  assert.equal(gate.localChecks.publicSerializationErrorSurfaceBlocked, true);
  assert.equal(gate.localChecks.publicTestInstanceErrorSurfaceBlocked, true);
  assert.equal(gate.localChecks.publicActErrorSurfaceBlocked, true);
  assert.equal(gate.localChecks.publicSchedulerErrorSurfaceBlocked, true);
  assert.equal(gate.localChecks.publicShallowErrorSurfaceBlocked, true);
  assert.equal(
    gate.localChecks.publicCreateUpdateUnmountErrorSurfaceReady,
    false
  );
  assert.equal(gate.localChecks.publicSerializationErrorSurfaceReady, false);
  assert.equal(gate.localChecks.publicTestInstanceErrorSurfaceReady, false);
  assert.equal(gate.localChecks.publicActSchedulerErrorSurfaceReady, false);
  assert.equal(gate.localChecks.publicShallowErrorSurfaceReady, false);
  assert.equal(gate.localChecks.publicToJSONAvailable, false);
  assert.equal(gate.localChecks.publicToTreeAvailable, false);
  assert.equal(gate.localChecks.publicTestInstanceWrappersPresent, false);
});

test("React test renderer private render and commit error rows stay root-option metadata only", () => {
  assert.equal(
    REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME,
    "fast-react-test-renderer.error-boundary.private-root-options-canary"
  );
  assert.equal(
    REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS,
    "private-error-boundary-diagnostics-root-options-metadata-public-boundary-blocked"
  );
  assert.deepEqual(
    REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_ROWS.map(
      (row) => row.id
    ),
    [
      "react-test-renderer-render-error-root-option-private-diagnostic",
      "react-test-renderer-commit-error-root-option-private-diagnostic"
    ]
  );

  const calls = [];
  const developmentEntry = jsEntrypoints.find((entry) =>
    entry.entrypoint.endsWith("development")
  );
  const moduleExports = loadFresh(developmentEntry.specifier);
  const bridge = Object.getOwnPropertyDescriptor(
    moduleExports.create,
    rootRequestBridgeSymbol
  ).value;
  const renderer = moduleExports.create(
    { type: "private-error-boundary-diagnostics" },
    {
      onUncaughtError(error) {
        calls.push(["uncaught", error.message]);
      },
      onCaughtError(error) {
        calls.push(["caught", error.message]);
      },
      onRecoverableError(error) {
        calls.push(["recoverable", error.message]);
      }
    }
  );
  const [createRequest] = bridge.getRendererRootRequests(renderer);
  const descriptor = Object.getOwnPropertyDescriptor(
    renderer,
    privateErrorBoundaryDiagnosticsSymbol
  );

  assert.notEqual(descriptor, undefined);
  assert.equal(descriptor.enumerable, false);
  const diagnostics = descriptor.value;
  assert.equal(
    bridge.getRendererErrorBoundaryDiagnostics(renderer),
    diagnostics
  );
  assert.equal(
    bridge.getRootErrorBoundaryDiagnostics(createRequest),
    diagnostics
  );
  assert.equal(diagnostics.diagnosticName, REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME);
  assert.equal(diagnostics.status, REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS);
  assert.equal(diagnostics.rowCount, 2);
  assert.deepEqual(
    diagnostics.rows.map((row) => row.id),
    REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_ROWS.map(
      (row) => row.id
    )
  );
  assert.deepEqual(
    diagnostics.rows.map((row) => row.phase),
    ["Render", "Commit"]
  );
  assert.equal(
    diagnostics.rootErrorOptions.onUncaughtErrorConfigured,
    true
  );
  assert.equal(diagnostics.rootErrorOptions.onCaughtErrorConfigured, true);
  assert.equal(
    diagnostics.rootErrorOptions.onRecoverableErrorConfigured,
    true
  );
  assert.equal(
    createRequest.optionsInfo.rootErrorOptions,
    diagnostics.rootErrorOptions
  );
  assert.equal(diagnostics.publicErrorBoundaryBehaviorAvailable, false);
  assert.equal(diagnostics.publicRootErrorCallbacksInvoked, false);
  assert.equal(diagnostics.compatibilityClaimed, false);

  for (const row of diagnostics.rows) {
    assert.equal(row.diagnosticName, diagnostics.diagnosticName);
    assert.equal(row.status, diagnostics.status);
    assert.equal(row.rootErrorOptions, diagnostics.rootErrorOptions);
    assert.equal(row.capturesRootErrorOptions, true);
    assert.equal(row.rootErrorUpdateScheduled, false);
    assert.equal(row.publicRootErrorCallbacksInvoked, false);
    assert.equal(row.publicErrorBoundaryBehaviorAvailable, false);
    assert.equal(row.compatibilityClaimed, false);
  }

  const updateError = captureThrown(() =>
    renderer.update({ type: "still-blocked" })
  );
  assert.equal(updateError.name, "FastReactTestRendererUnimplementedError");
  assert.equal(
    updateError.privateErrorBoundaryDiagnostics.status,
    REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS
  );
  assert.deepEqual(calls, []);
});

test("React test renderer error surface gate keeps multi-child TestInstance query metadata private", () => {
  const gate = evaluateReactTestRendererErrorSurfaceLocalGate({ oracle });

  assert.equal(
    gate.localChecks.privateRecordOnlyTestInstanceQueryPathPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceBridgeQueryDiagnosticsPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceFindAllQueryDiagnosticsPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceFindByQueryDiagnosticsPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceQueryBridgePreflightPresent,
    true
  );
  assert.equal(gate.localChecks.publicTestInstanceErrorSurfaceBlocked, true);
  assert.equal(gate.localChecks.publicTestInstanceWrappersPresent, false);

  for (const entry of jsEntrypoints) {
    const moduleExports = loadFresh(entry.specifier);
    const bridge = Object.getOwnPropertyDescriptor(
      moduleExports.create,
      rootRequestBridgeSymbol
    ).value;
    const renderer = moduleExports.create({ type: "multi-child-private" });
    const [createRequest] = bridge.getRendererRootRequests(renderer);
    const descriptor = Object.getOwnPropertyDescriptor(
      renderer,
      privateTestInstanceWrapperRecordSymbol
    );

    assert.notEqual(descriptor, undefined, entry.entrypoint);
    assert.equal(descriptor.enumerable, false, entry.entrypoint);
    const record = descriptor.value;
    assert.equal(record.publicRootAvailable, false, entry.entrypoint);
    assert.equal(record.publicQueryMethodsAvailable, false, entry.entrypoint);
    assert.equal(record.bridgeRouted, true, entry.entrypoint);
    assert.equal(record.consumesRootBridgeMetadata, true, entry.entrypoint);
    assert.equal(record.standaloneWrapperMetadata, false, entry.entrypoint);
    assert.equal(record.rootRequest, createRequest, entry.entrypoint);
    assert.equal(
      record.rootRequestTestInstanceQueryMetadata,
      createRequest.rustCanaryMetadata.testInstanceQuery,
      entry.entrypoint
    );
    assert.equal(
      bridge.getRendererTestInstanceQueryDiagnostics(renderer),
      record,
      entry.entrypoint
    );
    assert.equal(
      record.publicTestInstanceObjectAvailable,
      false,
      entry.entrypoint
    );
    assert.equal(record.multiChildHostTree.rootChildCount, 2, entry.entrypoint);
    assert.equal(
      record.multiChildHostTree.publicRootAccessAvailable,
      false,
      entry.entrypoint
    );
    assert.deepEqual(
      record.queryPath.map((inspection) => inspection.fiberTag),
      ["HostRoot", "HostComponent"],
      entry.entrypoint
    );
    assert.deepEqual(
      record.queryMethodRecords.findAll.skippedRecords.map(
        (inspection) => inspection.text
      ),
      ["first sibling", "second sibling"],
      entry.entrypoint
    );
    assert.equal(
      record.queryMethodRecords.findAll.expectedCanaryMatchCount,
      2,
      entry.entrypoint
    );
    assert.equal(
      record.queryMethodRecords.findAllByType.expectedCanaryMatchCount,
      1,
      entry.entrypoint
    );
    assert.deepEqual(
      record.rootQueryRecord.result.children.map((child) => child.fiberTag),
      ["HostText", "HostComponent"],
      entry.entrypoint
    );
    assert.equal(
      Object.hasOwn(record.rootQueryRecord.result, "findAll"),
      false,
      entry.entrypoint
    );

    const rootError = captureThrown(() => renderer.root);
    assert.equal(rootError.exportName, "create().root", entry.entrypoint);
    assert.equal(
      rootError.privateTestInstanceWrapperRecord,
      record,
      entry.entrypoint
    );
    assert.notEqual(
      rootError.routingGate.privateTestInstanceWrapperSkeleton,
      record,
      entry.entrypoint
    );
  }
});

test("React test renderer error surface local gate rejects every public compatibility claim source", () => {
  const publicClaimSources = [
    {
      id: "conformanceClaims.compatibilityClaimed",
      mutate(prematureClaimOracle) {
        prematureClaimOracle.conformanceClaims.compatibilityClaimed = true;
      }
    },
    {
      id: "conformanceClaims.fastReactBehaviorCompatible",
      mutate(prematureClaimOracle) {
        prematureClaimOracle.conformanceClaims.fastReactBehaviorCompatible = true;
      }
    },
    {
      id: "evidenceClaims.fastReactComparedToReactTestRenderer",
      mutate(prematureClaimOracle) {
        prematureClaimOracle.evidenceClaims.fastReactComparedToReactTestRenderer =
          true;
      }
    }
  ];

  for (const publicClaimSource of publicClaimSources) {
    const prematureClaimOracle = JSON.parse(JSON.stringify(oracle));
    publicClaimSource.mutate(prematureClaimOracle);

    const gate = evaluateReactTestRendererErrorSurfaceLocalGate({
      oracle: prematureClaimOracle
    });

    assert.equal(gate.status, "blocked-with-violations", publicClaimSource.id);
    assert.equal(gate.privateDiagnosticsReady, true, publicClaimSource.id);
    assert.equal(gate.publicCompatibilityReady, false, publicClaimSource.id);
    assert.deepEqual(
      gate.violations.map((violation) => violation.id),
      ["error-surface-compatibility-claimed-before-public-support"],
      publicClaimSource.id
    );
    assert.deepEqual(
      gate.violations[0].blockers,
      ERROR_SURFACE_PUBLIC_UNBLOCK_REQUIREMENT_IDS,
      publicClaimSource.id
    );
  }
});

test("React test renderer error surface oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(
    oracle.probeModes,
    REACT_TEST_RENDERER_ERROR_SURFACE_PROBE_MODES
  );
  assert.deepEqual(
    oracle.scenarios,
    REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIOS
  );

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "TestInstance queries",
    "unmounted renderer access",
    "invalid root inputs",
    "removed shallow renderer",
    "unsupported renderer/runtime messages"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of REACT_TEST_RENDERER_ERROR_SURFACE_PROBE_MODES) {
    const observations =
      oracle.reactTestRendererErrorSurfaceObservations[mode.id];
    assert.equal(
      observations.length,
      REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIO_IDS.length
    );

    for (const scenarioId of REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIO_IDS) {
      const scenarioObservation = observation(mode.id, scenarioId);
      assert.equal(scenarioObservation.scenarioId, scenarioId);
      assert.equal(scenarioObservation.packageName, "react-test-renderer");
      assert.equal(
        scenarioObservation.result.targetPackage,
        "react-test-renderer"
      );
      assert.equal(scenarioObservation.result.scenarioId, scenarioId);
      assert.equal(scenarioObservation.result.result.status, "ok");
    }
  }
});

test("React test renderer error surface oracle captures package evidence", () => {
  const rendererPackage = oracle.packages["react-test-renderer"];
  assert.equal(rendererPackage.tarball.integrityVerified, true);
  assert.deepEqual(rendererPackage.tarball.files, [
    "LICENSE",
    "README.md",
    "cjs/react-test-renderer.development.js",
    "cjs/react-test-renderer.production.js",
    "index.js",
    "package.json",
    "shallow.js"
  ]);
  assert.deepEqual(rendererPackage.packageJson.dependencies, {
    "react-is": "^19.2.6",
    scheduler: "^0.27.0"
  });
  assert.deepEqual(rendererPackage.packageJson.peerDependencies, {
    react: "^19.2.6"
  });
  assert.equal(
    rendererPackage.registry.distIntegrity,
    REACT_TEST_RENDERER_ERROR_SURFACE_TARGET.expectedDistIntegrity
  );
  assert.equal(
    rendererPackage.registry.distShasum,
    REACT_TEST_RENDERER_ERROR_SURFACE_TARGET.expectedDistShasum
  );
});

test("React test renderer error surface oracle captures find and findBy result errors", () => {
  const value = scenarioValue(DEFAULT_MODE, "test-instance-query-errors");
  assert.deepEqual(value.rootSummary.type, {
    kind: "host",
    value: "main"
  });
  assert.equal(value.rootSummary.childCount, 3);
  assert.equal(value.findAllNoMatchCount, 0);
  assert.equal(value.findAllDuplicateRoleCount, 2);

  assertThrows(
    value.noMatchPredicate,
    'No instances found matching custom predicate: function matchesNothing(instance) { return instance.props.id === "missing"; }'
  );
  assertThrows(
    value.multiMatchPredicate,
    'Expected 1 but found 2 instances matching custom predicate: function matchesDuplicateRole(instance) { return instance.props.role === "dup"; }'
  );
  assertThrows(
    value.noMatchByType,
    'No instances found with node type: "aside"'
  );
  assertThrows(
    value.multiMatchByType,
    'Expected 1 but found 2 instances with node type: "section"'
  );
  assertThrows(
    value.noMatchByProps,
    'No instances found with props: {"id":"missing"}'
  );
  assertThrows(
    value.multiMatchByProps,
    'Expected 1 but found 2 instances with props: {"role":"dup"}'
  );
});

test("React test renderer error surface oracle captures unmounted root and retained TestInstance access", () => {
  const value = scenarioValue(DEFAULT_MODE, "unmounted-root-access-errors");

  assertThrows(value.rendererRoot, UNMOUNTED_ROOT_MESSAGE);
  assertOkValue(value.rendererToJSON, { type: "null" });
  assertOkValue(value.rendererToTree, { type: "null" });
  assertOkValue(value.rendererGetInstance, { type: "null" });
  assertOkValue(value.rendererUpdateAgain, { type: "null" });
  assertOkValue(value.rendererUnmountAgain, {
    type: "string",
    value: "done"
  });

  assertOkValue(value.retainedRootType, {
    type: "string",
    value: "main"
  });
  assertThrows(value.retainedRootProps, UNMOUNTED_INSTANCE_MESSAGE);
  assertThrows(value.retainedRootChildren, UNMOUNTED_INSTANCE_MESSAGE);
  assertThrows(value.retainedRootFindAll, UNMOUNTED_INSTANCE_MESSAGE);
  assertOkValue(value.retainedChildType, {
    type: "string",
    value: "section"
  });
  assertThrows(value.retainedChildProps, UNMOUNTED_INSTANCE_MESSAGE);
  assertOkValue(value.retainedChildParent, { type: "null" });
});

test("React test renderer error surface oracle captures deterministic invalid create and update inputs", () => {
  const value = scenarioValue(DEFAULT_MODE, "invalid-create-update-inputs");

  assertThrows(value.createPlainObjectChild, OBJECT_CHILD_MESSAGE);
  assertThrows(value.updatePlainObjectChild, OBJECT_CHILD_MESSAGE);
  assertThrows(value.createInvalidUndefinedType, INVALID_UNDEFINED_TYPE_MESSAGE);
  assertThrows(value.updateInvalidUndefinedType, INVALID_UNDEFINED_TYPE_MESSAGE);
  assertThrows(value.createInvalidNullType, INVALID_NULL_TYPE_MESSAGE);
  assertThrows(value.updateInvalidNullType, INVALID_NULL_TYPE_MESSAGE);
});

test("React test renderer error surface oracle captures shallow removal and unsupported use messages", () => {
  const shallow = scenarioValue(DEFAULT_MODE, "shallow-removal-error");
  assert.deepEqual(shallow.exportShape, {
    type: "function",
    name: "ReactShallowRenderer",
    length: 0,
    ownPropertyNames: ["length", "name", "prototype"],
    hasOwnPrototype: true
  });
  assertThrows(shallow.call, SHALLOW_REMOVAL_MESSAGE);
  assertThrows(shallow.construct, SHALLOW_REMOVAL_MESSAGE);

  const unsupported = scenarioValue(DEFAULT_MODE, "unsupported-use-error");
  assertThrows(
    unsupported.createUnsupportedUse,
    "An unsupported type was passed to use(): [object Object]"
  );
});

test("React test renderer error surface oracle captures expected console warnings", () => {
  assert.deepEqual(consoleMessages(DEFAULT_MODE, "test-instance-query-errors"), [
    DEPRECATION_WARNING
  ]);
  assert.deepEqual(consoleMessages(DEFAULT_MODE, "unmounted-root-access-errors"), [
    DEPRECATION_WARNING
  ]);
  assert.deepEqual(consoleMessages(DEFAULT_MODE, "invalid-create-update-inputs"), [
    DEPRECATION_WARNING,
    DEPRECATION_WARNING,
    DEPRECATION_WARNING,
    DEPRECATION_WARNING,
    DEPRECATION_WARNING,
    DEPRECATION_WARNING
  ]);
  assert.deepEqual(consoleMessages(DEFAULT_MODE, "shallow-removal-error"), []);
  assert.deepEqual(consoleMessages(DEFAULT_MODE, "unsupported-use-error"), [
    DEPRECATION_WARNING
  ]);
});

test("React test renderer error surface oracle artifact has no temp or local path leaks", () => {
  const oracleText = readCheckedReactTestRendererErrorSurfaceOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-test-renderer-error-surface-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
  assert.doesNotMatch(oracleText, /file:\/\//u);
});

test("print React test renderer error surface oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    [
      "scripts/print-react-test-renderer-error-surface-oracle.mjs",
      "--format=json"
    ],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer:
        readCheckedReactTestRendererErrorSurfaceOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedReactTestRendererErrorSurfaceOracleText());
});

function observation(modeId, scenarioId) {
  return findReactTestRendererErrorSurfaceObservation(
    oracle,
    modeId,
    scenarioId
  );
}

function scenarioValue(modeId, scenarioId) {
  return observation(modeId, scenarioId).result.result.value;
}

function consoleMessages(modeId, scenarioId) {
  return observation(modeId, scenarioId).result.consoleCalls.map((call) => {
    assert.equal(call.method, "error");
    assert.equal(call.args.length, 1);
    assert.equal(call.args[0].type, "string");
    return call.args[0].value;
  });
}

function loadFresh(specifier) {
  const resolved = require.resolve(specifier);
  delete require.cache[resolved];
  return require(resolved);
}

function captureThrown(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }

  assert.fail("Expected callback to throw");
}

function assertThrows(operation, expectedMessage) {
  assert.equal(operation.status, "throws");
  assert.equal(operation.name, "Error");
  assert.equal(operation.constructorName, "Error");
  assert.equal(operation.code, null);
  assert.equal(operation.errors, null);
  assert.equal(operation.message, expectedMessage);
}

function assertOkValue(operation, expectedValue) {
  assert.equal(operation.status, "ok");
  assert.deepEqual(operation.value, expectedValue);
}
