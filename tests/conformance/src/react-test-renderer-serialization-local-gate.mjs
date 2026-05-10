import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS
} from "./react-test-renderer-serialization-scenarios.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS
} from "./react-test-renderer-serialization-targets.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

export const REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS =
  "blocked-until-rust-test-renderer-root-and-commit-output";

export const REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS = [
  {
    id: "rust-test-renderer-root-facade",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public serialization needs a Rust TestRendererRoot that owns reconciler root state instead of direct host snapshots."
  },
  {
    id: "committed-test-renderer-host-output",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "toJSON output must be read after reconciler commit produces test-renderer host output."
  },
  {
    id: "committed-fiber-inspection-api",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "toTree and TestInstance queries need a read-only current-fiber view, not raw mutation host handles."
  },
  {
    id: "public-js-react-test-renderer-facade",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "A dual-run compatibility claim needs a local public @fast-react/react-test-renderer target to execute."
  }
];

export const REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS =
  REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS.map((scenarioId) => ({
    scenarioId,
    admittedForFastReactComparison: false,
    compatibilityClaimed: false,
    status: REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS,
    unblockRequires:
      REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS.map(
        (requirement) => requirement.id
      )
  }));

export function evaluateReactTestRendererSerializationLocalGate({
  oracle,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  if (!oracle) {
    throw new Error("A checked react-test-renderer serialization oracle is required");
  }

  const localChecks = inspectReactTestRendererSerializationLocalTargets({
    workspaceRoot
  });
  const requiredLocalTargetsReady =
    localChecks.rustTestRendererRootFacadePresent &&
    localChecks.committedTestRendererHostOutputPresent;
  const admittedScenarios =
    REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS.filter(
      (scenario) =>
        scenario.admittedForFastReactComparison ||
        scenario.compatibilityClaimed
    );
  const publicCompatibilityClaimed = Boolean(
    oracle.conformanceClaims?.compatibilityClaimed ||
      oracle.conformanceClaims?.fastReactBehaviorCompatible ||
      oracle.localFastReactStatus?.behaviorCompatibilityClaimed ||
      REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS
        .behaviorCompatibilityClaimed
  );
  const violations = [];

  if (publicCompatibilityClaimed && !requiredLocalTargetsReady) {
    violations.push({
      id: "compatibility-claimed-before-rust-root-and-commit-output",
      reason:
        "react-test-renderer serialization compatibility cannot be claimed before the Rust root facade and committed host output exist."
    });
  }

  if (admittedScenarios.length > 0 && !requiredLocalTargetsReady) {
    violations.push({
      id: "scenario-admitted-before-rust-root-and-commit-output",
      reason:
        "Scenario admission must wait for the Rust root facade and committed host output, then be updated explicitly per scenario.",
      scenarioIds: admittedScenarios.map((scenario) => scenario.scenarioId)
    });
  }

  if (
    localChecks.publicJsReactTestRendererFacadePresent &&
    REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS.status ===
      "not-present-in-workspace"
  ) {
    violations.push({
      id: "local-fast-react-status-stale",
      reason:
        "The local target status still says the JS react-test-renderer facade is absent, but a package facade is present."
    });
  }

  return {
    status:
      violations.length === 0
        ? REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS
        : "blocked-with-violations",
    requiredLocalTargetsReady,
    publicCompatibilityClaimed,
    localChecks,
    admittedScenarios,
    violations
  };
}

export function inspectReactTestRendererSerializationLocalTargets({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const testRendererCargo = readWorkspaceFile(
    workspaceRoot,
    "crates/fast-react-test-renderer/Cargo.toml"
  );
  const testRendererSource = readWorkspaceTree(
    workspaceRoot,
    "crates/fast-react-test-renderer/src"
  );
  const reconcilerSource = readWorkspaceTree(
    workspaceRoot,
    "crates/fast-react-reconciler/src"
  );

  const publicJsReactTestRendererFacadePresent =
    existsWorkspacePath(workspaceRoot, "packages/react-test-renderer/package.json") ||
    existsWorkspacePath(
      workspaceRoot,
      "packages/fast-react-test-renderer/package.json"
    );
  const rustTestRendererRootFacadePresent =
    hasSourcePattern(testRendererCargo, /\bfast-react-reconciler\b/u) &&
    hasSourcePattern(
      testRendererSource,
      /\b(?:pub\s+)?struct\s+TestRendererRoot\b/u
    );
  const committedTestRendererHostOutputPresent =
    hasSourcePattern(reconcilerSource, /\b(?:pub\s+)?fn\s+commit_root\b/u) &&
    hasSourcePattern(
      reconcilerSource,
      /\bappend_child_to_container\b|\bcommit_placement\b/u
    );
  const committedFiberInspectionPresent = hasSourcePattern(
    reconcilerSource,
    /\bCommitted(?:Root|Fiber)View\b|\bcommitted_fiber_(?:view|inspection)\b/u
  );
  const rustSerializationApiPresent = hasSourcePattern(
    testRendererSource,
    /\bto_json\b|\bto_tree\b|\bTestJson\b|\bReactTestInstance\b/u
  );

  return {
    publicJsReactTestRendererFacadePresent,
    rustTestRendererRootFacadePresent,
    committedTestRendererHostOutputPresent,
    committedFiberInspectionPresent,
    rustSerializationApiPresent
  };
}

function existsWorkspacePath(workspaceRoot, relativePath) {
  return existsSync(join(workspaceRoot, relativePath));
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
  return readDirectoryText(root);
}

function readDirectoryText(directory) {
  const chunks = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      chunks.push(readDirectoryText(path));
      continue;
    }
    if (entry.isFile() && isTextSourceFile(path)) {
      chunks.push(readFileSync(path, "utf8"));
    }
  }
  return chunks.join("\n");
}

function isTextSourceFile(path) {
  if (!statSync(path).isFile()) {
    return false;
  }
  return /\.(?:rs|toml|json|mjs|js)$/u.test(path);
}

function hasSourcePattern(source, pattern) {
  return pattern.test(stripLineComments(source));
}

function stripLineComments(source) {
  return source
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
}
