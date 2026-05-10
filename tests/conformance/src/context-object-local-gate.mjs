import { spawnSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CONTEXT_OBJECT_SCENARIO_IDS } from "./context-object-scenarios.mjs";
import { CONTEXT_OBJECT_PROBE_MODES } from "./context-object-targets.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);
const PROBE_TIMEOUT_MS = 10_000;

export const CONTEXT_OBJECT_LOCAL_GATE_STATUS =
  "direct-object-provider-shape-covered-runtime-blocked";

export const CONTEXT_OBJECT_LOCAL_GATE_ROWS = [
  {
    modeId: "default-node-development",
    scenarioId: "context-object-shape"
  },
  {
    modeId: "default-node-development",
    scenarioId: "context-provider-consumer-identity"
  },
  {
    modeId: "default-node-development",
    scenarioId: "context-display-name"
  },
  {
    modeId: "default-node-development",
    scenarioId: "context-mutability-and-slots"
  },
  {
    modeId: "default-node-production",
    scenarioId: "context-object-shape"
  },
  {
    modeId: "default-node-production",
    scenarioId: "context-provider-consumer-identity"
  },
  {
    modeId: "default-node-production",
    scenarioId: "context-display-name"
  },
  {
    modeId: "default-node-production",
    scenarioId: "context-mutability-and-slots"
  },
  {
    modeId: "react-server-development",
    scenarioId: "context-export-shape"
  },
  {
    modeId: "react-server-production",
    scenarioId: "context-export-shape"
  }
];

export const CONTEXT_OBJECT_RUNTIME_BLOCKING_REQUIREMENTS = [
  {
    id: "runtime-context-value-propagation",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "A context compatibility claim needs render-time reads to observe Provider value changes instead of only constructing React-shaped JavaScript objects."
  },
  {
    id: "reconciler-context-provider-begin-work",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Context Provider fibers must be handled by begin work before Provider elements can be admitted as runtime-compatible behavior."
  },
  {
    id: "function-component-use-context-render-read",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "useContext must read from reconciler-owned context state during function component render, not only forward to an external dispatcher."
  }
];

export function evaluateContextObjectLocalGate({
  oracle,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  if (!oracle) {
    throw new Error("A checked context-object oracle is required");
  }

  const localChecks = inspectContextObjectRuntimeLocalTargets({ workspaceRoot });
  const requiredRuntimeTargetsReady =
    localChecks.runtimeContextPropagationPresent &&
    localChecks.reconcilerProviderBeginWorkIntegrationPresent &&
    localChecks.functionComponentUseContextRenderReadPresent;
  const localComparisonRows = CONTEXT_OBJECT_LOCAL_GATE_ROWS.map((row) =>
    compareLocalRowToOracle({
      modeId: row.modeId,
      oracle,
      scenarioId: row.scenarioId,
      workspaceRoot
    })
  );
  const directObjectProviderShapeMatchesOracle = localComparisonRows.every(
    (row) => row.matched
  );
  const publicCompatibilityClaimed = Boolean(
    oracle.conformanceClaims?.compatibilityClaimed ||
      oracle.conformanceClaims?.fastReactBehaviorCompatible ||
      oracle.packages?.["@fast-react/react"]?.behaviorCompatibilityClaimed
  );
  const violations = [];

  if (!directObjectProviderShapeMatchesOracle) {
    violations.push({
      id: "local-context-object-provider-shape-mismatch",
      reason:
        "The live Fast React context object/provider shape no longer matches the accepted React 19.2.6 context-object oracle for the admitted local gate rows.",
      rows: localComparisonRows
        .filter((row) => !row.matched)
        .map(({ modeId, scenarioId, firstDifferencePath }) => ({
          modeId,
          scenarioId,
          firstDifferencePath
        }))
    });
  }

  if (publicCompatibilityClaimed && !requiredRuntimeTargetsReady) {
    violations.push({
      id: "compatibility-claimed-before-context-runtime-propagation",
      reason:
        "Context compatibility cannot be claimed before runtime propagation, Provider begin-work handling, and function-component context reads are integrated."
    });
  }

  return {
    status:
      violations.length === 0
        ? CONTEXT_OBJECT_LOCAL_GATE_STATUS
        : "blocked-with-violations",
    directObjectProviderShapeMatchesOracle,
    requiredRuntimeTargetsReady,
    publicCompatibilityClaimed,
    localChecks,
    localComparisonRows,
    runtimeBlockingRequirements: CONTEXT_OBJECT_RUNTIME_BLOCKING_REQUIREMENTS,
    violations
  };
}

export function inspectContextObjectRuntimeLocalTargets({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const contextObjectSource = readWorkspaceFile(
    workspaceRoot,
    "packages/react/context-object.js"
  );
  const hookDispatcherSource = readWorkspaceFile(
    workspaceRoot,
    "packages/react/hook-dispatcher.js"
  );
  const beginWorkSource = readWorkspaceFile(
    workspaceRoot,
    "crates/fast-react-reconciler/src/begin_work.rs"
  );
  const functionComponentSource = readWorkspaceFile(
    workspaceRoot,
    "crates/fast-react-reconciler/src/function_component.rs"
  );
  const reconcilerSource = readWorkspaceTree(
    workspaceRoot,
    "crates/fast-react-reconciler/src"
  );

  const jsCreateContextDirectObjectPresent =
    hasSourcePattern(contextObjectSource, /\bcontext\.Provider\s*=\s*context\b/u) &&
    hasSourcePattern(
      contextObjectSource,
      /\bcontext\.Consumer\s*=\s*\{\s*\$\$typeof:\s*REACT_CONSUMER_TYPE,\s*_context:\s*context\s*\}/u
    );
  const useContextStillDispatcherOnly = hasSourcePattern(
    hookDispatcherSource,
    /\bcallDispatcherHook\('useContext',\s*arguments\)/u
  );
  const beginWorkRejectsContextProvider =
    hasSourcePattern(beginWorkSource, /\bFiberTag::ContextProvider\b/u) &&
    hasSourcePattern(beginWorkSource, /\bBeginWorkError::UnsupportedFiberTag\b/u);
  const functionComponentContextUnsupported =
    hasSourcePattern(
      functionComponentSource,
      /\bFiberTag::ContextConsumer\s*\|\s*FiberTag::ContextProvider\b/u
    ) &&
    hasSourcePattern(
      functionComponentSource,
      /\bUnsupportedFunctionComponentFeature::Context\b/u
    );
  const runtimeContextPropagationPresent =
    hasSourcePattern(reconcilerSource, /\bread_context\b/u) &&
    hasSourcePattern(reconcilerSource, /\bpush_provider\b/u) &&
    !functionComponentContextUnsupported;
  const reconcilerProviderBeginWorkIntegrationPresent =
    hasSourcePattern(beginWorkSource, /\bContextProvider\b/u) &&
    hasSourcePattern(beginWorkSource, /\bpush_provider\b/u) &&
    !beginWorkRejectsContextProvider;
  const functionComponentUseContextRenderReadPresent =
    hasSourcePattern(functionComponentSource, /\buseContext\b|\buse_context\b/u) &&
    hasSourcePattern(functionComponentSource, /\bread_context\b/u);

  return {
    jsCreateContextDirectObjectPresent,
    useContextStillDispatcherOnly,
    beginWorkRejectsContextProvider,
    functionComponentContextUnsupported,
    runtimeContextPropagationPresent,
    reconcilerProviderBeginWorkIntegrationPresent,
    functionComponentUseContextRenderReadPresent
  };
}

function compareLocalRowToOracle({
  modeId,
  oracle,
  scenarioId,
  workspaceRoot
}) {
  const mode = modeById(modeId);
  const reactObservation = findReactObservation(oracle, modeId, scenarioId);
  const localObservation = runLocalContextObjectProbe({
    mode,
    scenarioId,
    workspaceRoot
  });
  const firstDifferencePath = findFirstDifferencePath(
    comparableProbeResult(reactObservation.result),
    comparableProbeResult(localObservation)
  );

  return {
    modeId,
    scenarioId,
    status:
      firstDifferencePath === null
        ? "matched-against-checked-react-oracle"
        : "local-mismatch-against-checked-react-oracle",
    matched: firstDifferencePath === null,
    firstDifferencePath
  };
}

function runLocalContextObjectProbe({ mode, scenarioId, workspaceRoot }) {
  const probeFile = fileURLToPath(
    new URL("./context-object-probe-runner.mjs", import.meta.url)
  );
  const target = localTargetForMode({ mode, workspaceRoot });
  const spawnResult = spawnSync(
    process.execPath,
    [...mode.nodeArgs, probeFile, target, scenarioId],
    {
      cwd: workspaceRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: mode.nodeEnv
      },
      timeout: PROBE_TIMEOUT_MS
    }
  );

  return parseProbeOutput(spawnResult, {
    command: `node ${mode.nodeArgs.join(" ")} ${basename(
      probeFile
    )} ${target} ${scenarioId}`
  });
}

function localTargetForMode({ mode, workspaceRoot }) {
  const reactRoot = join(workspaceRoot, "packages/react");
  if (mode.condition === "react-server") {
    return join(reactRoot, "react.react-server.js");
  }

  return reactRoot;
}

function findReactObservation(oracle, modeId, scenarioId) {
  const observation = oracle.reactObservations?.[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(`Missing React context oracle row: ${modeId}:${scenarioId}`);
  }
  return observation;
}

function modeById(modeId) {
  const mode = CONTEXT_OBJECT_PROBE_MODES.find(
    (candidate) => candidate.id === modeId
  );
  if (!mode) {
    throw new Error(`Unknown context-object probe mode: ${modeId}`);
  }
  return mode;
}

function comparableProbeResult(result) {
  const { targetPackage: _targetPackage, ...behaviorResult } = result;
  return behaviorResult;
}

function findFirstDifferencePath(left, right, path = "$") {
  if (Object.is(left, right)) {
    return null;
  }

  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object"
  ) {
    return path;
  }

  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);
  if (leftIsArray !== rightIsArray) {
    return path;
  }

  if (leftIsArray) {
    if (left.length !== right.length) {
      return `${path}.length`;
    }

    for (let index = 0; index < left.length; index += 1) {
      const childPath = findFirstDifferencePath(
        left[index],
        right[index],
        `${path}[${index}]`
      );
      if (childPath) {
        return childPath;
      }
    }
    return null;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return `${path}.keys`;
  }

  for (let index = 0; index < leftKeys.length; index += 1) {
    if (leftKeys[index] !== rightKeys[index]) {
      return `${path}.keys[${index}]`;
    }
  }

  for (const key of leftKeys) {
    const childPath = findFirstDifferencePath(
      left[key],
      right[key],
      `${path}.${key}`
    );
    if (childPath) {
      return childPath;
    }
  }

  return null;
}

function parseProbeOutput(spawnResult, context) {
  if (spawnResult.error) {
    throw new Error(`${context.command} failed: ${spawnResult.error.message}`);
  }

  if (spawnResult.status !== 0) {
    throw new Error(
      `${context.command} exited ${spawnResult.status}: ${spawnResult.stderr}`
    );
  }

  try {
    return JSON.parse(spawnResult.stdout);
  } catch (error) {
    throw new Error(
      `${context.command} did not emit JSON: ${spawnResult.stdout}\n${error.message}`
    );
  }
}

function readWorkspaceFile(workspaceRoot, relativePath) {
  const path = join(workspaceRoot, relativePath);
  if (!existsSync(path)) {
    return "";
  }
  return readFileSync(path, "utf8");
}

function readWorkspaceTree(workspaceRoot, relativePath) {
  const root = join(workspaceRoot, relativePath);
  if (!existsSync(root)) {
    return "";
  }

  const chunks = [];
  for (const entry of walkFiles(root)) {
    chunks.push(readFileSync(entry, "utf8"));
  }
  return chunks.join("\n");
}

function walkFiles(root) {
  const entries = [];
  for (const name of readdirSync(root).sort()) {
    const path = join(root, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      entries.push(...walkFiles(path));
    } else if (stat.isFile()) {
      entries.push(path);
    }
  }
  return entries;
}

function hasSourcePattern(source, pattern) {
  return pattern.test(source);
}

for (const row of CONTEXT_OBJECT_LOCAL_GATE_ROWS) {
  modeById(row.modeId);
  if (!CONTEXT_OBJECT_SCENARIO_IDS.includes(row.scenarioId)) {
    throw new Error(
      `Unknown context-object scenario in local gate: ${row.scenarioId}`
    );
  }
}
