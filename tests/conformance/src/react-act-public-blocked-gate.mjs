import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { REACT_ACT_SCENARIO_IDS } from "./react-act-scenarios.mjs";
import { REACT_ACT_FAST_REACT_TARGET } from "./react-act-targets.mjs";

const require = createRequire(import.meta.url);
const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);
const DEFAULT_NODE_MODES = [
  "default-node-development",
  "default-node-production"
];

export const REACT_ACT_PUBLIC_BLOCKED_GATE_STATUS =
  "blocked-until-reconciler-act-queue-effects-and-renderer-roots";

export const REACT_ACT_PUBLIC_UNBLOCKING_REQUIREMENTS = [
  {
    id: "reconciler-act-queue-flushing",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public React.act must wait for reconciler act queue task execution, continuation draining, and nested act boundaries."
  },
  {
    id: "effect-execution",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public React.act compatibility requires layout/passive effect create and destroy callbacks to execute through commit flushing."
  },
  {
    id: "renderer-roots",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public React.act needs DOM and test-renderer roots that route render, update, and unmount work through the reconciler."
  }
];

export const REACT_ACT_PUBLIC_SCENARIO_ADMISSIONS =
  REACT_ACT_SCENARIO_IDS.map((scenarioId) => ({
    scenarioId,
    admittedForFastReactComparison: false,
    compatibilityClaimed: false,
    status: REACT_ACT_PUBLIC_BLOCKED_GATE_STATUS,
    unblockRequires: REACT_ACT_PUBLIC_UNBLOCKING_REQUIREMENTS.map(
      (requirement) => requirement.id
    )
  }));

export function evaluateReactActPublicBlockedGate({
  oracle,
  scenarioAdmissions = REACT_ACT_PUBLIC_SCENARIO_ADMISSIONS,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  if (!oracle) {
    throw new Error("A checked React.act oracle is required");
  }

  const localChecks = inspectReactActPublicBlockedLocalTarget({
    workspaceRoot
  });
  const requiredPrerequisitesReady =
    localChecks.actQueueFlushingReady &&
    localChecks.effectExecutionReady &&
    localChecks.rendererRootsReady;
  const publicCompatibilityClaimed = Boolean(
    oracle.conformanceClaims?.compatibilityClaimed ||
      oracle.conformanceClaims?.fastReactBehaviorCompatible ||
      oracle.evidenceClaims?.fastReactBehaviorCompatible ||
      oracle.packages?.["@fast-react/react"]?.behaviorCompatibilityClaimed ||
      oracle.implementationComparison?.worker097Checked?.compatibilityClaimed
  );
  const admittedScenarios = scenarioAdmissions.filter(
    (scenario) =>
      scenario.admittedForFastReactComparison || scenario.compatibilityClaimed
  );
  const defaultActBehaviorRows = collectDefaultActBehaviorRows(oracle);
  const unsupportedDefaultBehaviorRows = defaultActBehaviorRows.filter(
    (row) =>
      row.comparison?.status === "unsupported-placeholder" &&
      row.comparison?.compatibilityClaimed === false &&
      containsFastReactUnimplemented(row.observation)
  );
  const violations = [];

  if (
    REACT_ACT_FAST_REACT_TARGET.expectedStatus !==
    "unsupported-or-known-mismatch-without-compatibility-claim"
  ) {
    violations.push({
      id: "fast-react-target-no-longer-declared-unsupported",
      reason:
        "The public React.act Fast React target metadata must remain explicitly unsupported until this gate is reopened."
    });
  }

  if (publicCompatibilityClaimed && !requiredPrerequisitesReady) {
    violations.push({
      id: "compatibility-claimed-before-act-prerequisites",
      reason:
        "React.act compatibility cannot be claimed before act queue flushing, effect execution, and renderer roots are all ready."
    });
  }

  if (admittedScenarios.length > 0 && !requiredPrerequisitesReady) {
    violations.push({
      id: "scenario-admitted-before-act-prerequisites",
      reason:
        "React.act scenario admission must wait for act queue flushing, effect execution, and renderer roots, then be updated explicitly.",
      scenarioIds: admittedScenarios.map((scenario) => scenario.scenarioId)
    });
  }

  if (!localChecks.publicActUnsupportedPlaceholder) {
    violations.push({
      id: "public-react-act-no-longer-throws-placeholder",
      reason:
        "The local public React.act export stopped throwing the structured Fast React unimplemented placeholder."
    });
  }

  if (
    unsupportedDefaultBehaviorRows.length !== defaultActBehaviorRows.length ||
    defaultActBehaviorRows.length === 0
  ) {
    violations.push({
      id: "default-react-act-behavior-not-all-unsupported",
      reason:
        "Every default-mode public React.act behavior row must remain an unsupported placeholder until the gate is reopened.",
      unsupportedRowCount: unsupportedDefaultBehaviorRows.length,
      defaultBehaviorRowCount: defaultActBehaviorRows.length
    });
  }

  if (oracle.evidenceClaims?.rendererBackedFlushingProbed !== false) {
    violations.push({
      id: "renderer-backed-flushing-evidence-claimed-while-blocked",
      reason:
        "The public React.act oracle must not claim renderer-backed flushing evidence while this gate is closed."
    });
  }

  if (oracle.coverage?.rendererBackedFlushing !== false) {
    violations.push({
      id: "renderer-backed-flushing-coverage-claimed-while-blocked",
      reason:
        "Renderer-backed flushing coverage belongs to renderer act gates, not this blocked public React.act gate."
    });
  }

  for (const gapId of [
    "no-renderer-backed-flushing",
    "no-private-internals-reads",
    "no-compatibility-claim"
  ]) {
    if (!oracle.intentionalGaps?.some((gap) => gap.id === gapId)) {
      violations.push({
        id: `missing-intentional-gap-${gapId}`,
        reason:
          "The checked React.act oracle must keep its blocked public-act boundaries documented."
      });
    }
  }

  return {
    status:
      violations.length === 0
        ? REACT_ACT_PUBLIC_BLOCKED_GATE_STATUS
        : "blocked-with-violations",
    requiredPrerequisitesReady,
    publicCompatibilityClaimed,
    localChecks,
    admittedScenarios,
    defaultActBehaviorRows,
    unsupportedDefaultBehaviorRows,
    violations
  };
}

export function inspectReactActPublicBlockedLocalTarget({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const React = loadWorkspaceCjsModule(workspaceRoot, "packages/react/index.js");
  const ReactServer = loadWorkspaceCjsModule(
    workspaceRoot,
    "packages/react/react.react-server.js"
  );
  const reactDomClientSource = readWorkspaceFile(
    workspaceRoot,
    "packages/react-dom/client.js"
  );
  const testRendererSource = readWorkspaceFile(
    workspaceRoot,
    "packages/react-test-renderer/index.js"
  );
  const actQueueSource = [
    readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/scheduler_bridge.rs"
    ),
    readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/root_scheduler.rs"
    ),
    readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/sync_flush.rs"
    )
  ].join("\n");
  const passiveEffectsSource = readWorkspaceFile(
    workspaceRoot,
    "crates/fast-react-reconciler/src/passive_effects.rs"
  );
  const defaultAct = describeReactActExport(React);
  const reactServerAct = describeReactServerActExport(ReactServer);
  const actQueueRecordsPresent = /\bSchedulerActQueueRequest\b/u.test(
    actQueueSource
  );
  const actQueueFlushExecutionPresent =
    /\b(?:flush|drain)_act_queue\b|\b(?:flush|drain)ActQueue\b|\brecursivelyFlushAsyncActWork\b/u.test(
      actQueueSource
    );
  const passiveEffectMetadataOnly =
    /does not traverse hook rings, invoke create\/destroy callbacks/u.test(
      passiveEffectsSource
    ) ||
    /default flush path remains metadata-only/u.test(passiveEffectsSource) ||
    /detached from public effect execution/u.test(passiveEffectsSource);
  const effectCallbackExecutionPresent =
    /\b(?:invoke|execute)_(?:layout|passive|hook)_effects?\b|\b(?:invoke|execute)Effect(?:Create|Destroy)\b/u.test(
      passiveEffectsSource
    );
  const reactDomClientRootPlaceholder =
    /createUnsupportedFunction\(entrypoint, 'createRoot'/u.test(
      reactDomClientSource
    );
  const testRendererRootPlaceholder =
    /\bFastReactTestRendererUnimplementedError\b/u.test(testRendererSource) &&
    /Root updates are intentionally blocked/u.test(testRendererSource);

  return {
    defaultAct,
    reactServerAct,
    publicActUnsupportedPlaceholder:
      defaultAct.callAttempt.status === "throws" &&
      defaultAct.callAttempt.error.code === "FAST_REACT_UNIMPLEMENTED" &&
      defaultAct.callAttempt.error.entrypoint === "react" &&
      defaultAct.callAttempt.error.exportName === "act" &&
      defaultAct.callAttempt.error.compatibilityTarget === "react@19.2.6" &&
      defaultAct.callbackInvoked === false &&
      reactServerAct.hasOwn === false,
    actQueueStatus: actQueueFlushExecutionPresent
      ? "flush-execution-token-present-needs-explicit-admission"
      : actQueueRecordsPresent
        ? "private-records-without-flushing"
        : "missing-private-act-queue-records",
    actQueueFlushingReady: actQueueFlushExecutionPresent,
    effectExecutionStatus: effectCallbackExecutionPresent
      ? "callback-execution-token-present-needs-explicit-admission"
      : passiveEffectMetadataOnly
        ? "metadata-only-no-callback-execution"
        : "effect-callback-execution-not-detected",
    effectExecutionReady: effectCallbackExecutionPresent,
    rendererRootStatus:
      reactDomClientRootPlaceholder || testRendererRootPlaceholder
        ? "public-renderer-roots-placeholder-blocked"
        : "public-renderer-roots-need-explicit-admission",
    rendererRootsReady:
      !reactDomClientRootPlaceholder && !testRendererRootPlaceholder,
    reactDomClientRootPlaceholder,
    testRendererRootPlaceholder
  };
}

function collectDefaultActBehaviorRows(oracle) {
  const behaviorScenarioIds = REACT_ACT_SCENARIO_IDS.filter(
    (scenarioId) => scenarioId !== "react-act-export-shape"
  );
  const rows = [];

  for (const modeId of DEFAULT_NODE_MODES) {
    for (const scenarioId of behaviorScenarioIds) {
      rows.push({
        modeId,
        scenarioId,
        comparison:
          oracle.fastReactComparisons?.[modeId]?.find(
            (comparison) => comparison.scenarioId === scenarioId
          ) ?? null,
        observation:
          oracle.fastReactObservations?.[modeId]?.find(
            (observation) => observation.scenarioId === scenarioId
          ) ?? null
      });
    }
  }

  return rows;
}

function describeReactActExport(React) {
  const descriptor = Object.getOwnPropertyDescriptor(React, "act");
  let callbackInvoked = false;
  const callAttempt =
    typeof React.act === "function"
      ? captureOperation("React.act placeholder call", () =>
          React.act(() => {
            callbackInvoked = true;
            return "callback-result";
          })
        )
      : {
          label: "React.act placeholder call",
          status: "unavailable",
          value: describeValue(React.act)
        };

  return {
    hasOwn: Object.hasOwn(React, "act"),
    exportKeysInclude: Object.keys(React).includes("act"),
    descriptor: descriptor ? describeDescriptor(descriptor) : null,
    value: describeValue(React.act),
    callAttempt,
    callbackInvoked
  };
}

function describeReactServerActExport(ReactServer) {
  return {
    hasOwn: Object.hasOwn(ReactServer, "act"),
    exportKeysInclude: Object.keys(ReactServer).includes("act"),
    value: describeValue(ReactServer.act)
  };
}

function captureOperation(label, fn) {
  try {
    return {
      label,
      status: "ok",
      value: describeValue(fn())
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      error: describeThrown(error)
    };
  }
}

function describeDescriptor(descriptor) {
  const described = {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable
  };

  if ("value" in descriptor) {
    described.kind = "data";
    described.writable = descriptor.writable;
    described.value = describeValue(descriptor.value);
  } else {
    described.kind = "accessor";
    described.get = describeValue(descriptor.get);
    described.set = describeValue(descriptor.set);
  }

  return described;
}

function describeValue(value) {
  if (value === undefined) {
    return {
      type: "undefined"
    };
  }

  if (value === null) {
    return {
      type: "null"
    };
  }

  if (typeof value === "function") {
    return {
      type: "function",
      name: value.name,
      length: value.length
    };
  }

  return {
    type: typeof value
  };
}

function describeThrown(error) {
  return {
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    entrypoint: error?.entrypoint ?? null,
    exportName: error?.exportName ?? null,
    compatibilityTarget: error?.compatibilityTarget ?? null
  };
}

function containsFastReactUnimplemented(value) {
  if (Array.isArray(value)) {
    return value.some(containsFastReactUnimplemented);
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  if (
    value.name === "FastReactUnimplementedError" ||
    value.code === "FAST_REACT_UNIMPLEMENTED"
  ) {
    return true;
  }

  return Object.values(value).some(containsFastReactUnimplemented);
}

function loadWorkspaceCjsModule(workspaceRoot, relativePath) {
  const absolutePath = join(workspaceRoot, relativePath);
  return require(absolutePath);
}

function readWorkspaceFile(workspaceRoot, relativePath) {
  const path = join(workspaceRoot, relativePath);
  if (!existsSync(path)) {
    return "";
  }
  return readFileSync(path, "utf8");
}
