import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DOM_TEXT_CONTENT_SCENARIO_IDS,
  materializeProps
} from "./dom-text-content-scenarios.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);
const require = createRequire(import.meta.url);

const SHOULD_SET_REACT_STUB = Object.freeze({
  createElement(elementType, props) {
    return {
      $$typeof: "react.element.placeholder",
      type: elementType,
      props
    };
  }
});

export const DOM_TEXT_CONTENT_LOCAL_GATE_STATUS =
  "blocked-until-dom-host-text-rendering";

export const DOM_TEXT_CONTENT_LOCAL_UNSUPPORTED_SHOULD_SET_SCENARIO_IDS = [
  "should-set-textarea-special-case",
  "should-set-noscript-special-case"
];

export const DOM_TEXT_CONTENT_LOCAL_UNBLOCKING_REQUIREMENTS = [
  {
    id: "public-react-dom-client-root-render-path",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "A React DOM text-content compatibility claim needs public createRoot/root.render to route through the reconciler instead of unsupported placeholders."
  },
  {
    id: "dom-host-text-creation-helper",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "HostText evidence needs a DOM host creation path that creates text nodes from the correct ownerDocument."
  },
  {
    id: "reconciler-host-text-complete-and-commit-wiring",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "HostText creation, text updates, text reset, and child reconciliation boundaries must be wired through complete and commit work."
  },
  {
    id: "dangerously-set-inner-html-property-boundary",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "dangerouslySetInnerHTML must remain a validated leaf shortcut that excludes managed children before local behavior can be admitted."
  }
];

export const DOM_TEXT_CONTENT_LOCAL_SCENARIO_ADMISSIONS =
  DOM_TEXT_CONTENT_SCENARIO_IDS.map((scenarioId) => ({
    scenarioId,
    admittedForFastReactComparison: false,
    compatibilityClaimed: false,
    status: DOM_TEXT_CONTENT_LOCAL_GATE_STATUS,
    unblockRequires: DOM_TEXT_CONTENT_LOCAL_UNBLOCKING_REQUIREMENTS.map(
      (requirement) => requirement.id
    )
  }));

export function evaluateDomTextContentLocalGate({
  oracle,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  if (!oracle) {
    throw new Error("A checked DOM text-content oracle is required");
  }

  const localChecks = inspectDomTextContentLocalTargets({
    oracle,
    workspaceRoot
  });
  const requiredLocalTargetsReady =
    localChecks.publicReactDomClientRootRenderPathPresent &&
    localChecks.domHostTextCreationHelperPresent &&
    localChecks.reconcilerHostTextCompleteAndCommitWiringPresent &&
    localChecks.dangerouslySetInnerHtmlPropertyBoundaryPresent;
  const admittedScenarios = DOM_TEXT_CONTENT_LOCAL_SCENARIO_ADMISSIONS.filter(
    (scenario) =>
      scenario.admittedForFastReactComparison || scenario.compatibilityClaimed
  );
  const publicCompatibilityClaimed = Boolean(
    oracle.conformanceClaims?.compatibilityClaimed ||
      oracle.conformanceClaims?.fastReactBehaviorCompatible ||
      oracle.localFastReactStatus?.behaviorCompatibilityClaimed
  );
  const violations = [];

  if (publicCompatibilityClaimed && !requiredLocalTargetsReady) {
    violations.push({
      id: "compatibility-claimed-before-dom-host-text-rendering",
      reason:
        "DOM text-content compatibility cannot be claimed before public root rendering, DOM HostText creation, commit wiring, and dangerous HTML boundaries are ready."
    });
  }

  if (!localChecks.privateShouldSetTextContentHelperPresent) {
    violations.push({
      id: "private-should-set-text-content-helper-missing",
      reason:
        "The DOM text-content local gate requires the private shouldSetTextContent helper to be present before local behavior can be tracked against the React DOM oracle."
    });
  }

  if (localChecks.privateShouldSetTextContentOracleMismatches.length > 0) {
    violations.push({
      id: "private-should-set-text-content-helper-oracle-mismatch",
      reason:
        "The private shouldSetTextContent helper must match checked React DOM 19.2.6 predicate rows except for explicitly blocked local exclusions.",
      scenarioIds: localChecks.privateShouldSetTextContentOracleMismatches.map(
        (row) => row.scenarioId
      )
    });
  }

  if (admittedScenarios.length > 0 && !requiredLocalTargetsReady) {
    violations.push({
      id: "scenario-admitted-before-dom-host-text-rendering",
      reason:
        "Scenario admission must wait for public root rendering, DOM HostText creation, commit wiring, and dangerous HTML boundaries, then be updated explicitly per scenario.",
      scenarioIds: admittedScenarios.map((scenario) => scenario.scenarioId)
    });
  }

  if (
    localChecks.publicReactDomClientRootStillUnsupported &&
    oracle.localFastReactStatus?.status !== DOM_TEXT_CONTENT_LOCAL_GATE_STATUS
  ) {
    violations.push({
      id: "local-fast-react-text-status-stale",
      reason:
        "The public React DOM client root is still unsupported, but the checked oracle no longer records the local text-content gate as blocked."
    });
  }

  return {
    status:
      violations.length === 0
        ? DOM_TEXT_CONTENT_LOCAL_GATE_STATUS
        : "blocked-with-violations",
    requiredLocalTargetsReady,
    publicCompatibilityClaimed,
    localChecks,
    admittedScenarios,
    violations
  };
}

export function inspectDomTextContentLocalTargets({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  oracle = null
} = {}) {
  const clientSource = readWorkspaceFile(
    workspaceRoot,
    "packages/react-dom/client.js"
  );
  const textContentSource = readWorkspaceFile(
    workspaceRoot,
    "packages/react-dom/src/dom-host/text-content.js"
  );
  const mutationSource = readWorkspaceFile(
    workspaceRoot,
    "packages/react-dom/src/dom-host/mutation.js"
  );
  const domHostSource = readWorkspaceTree(
    workspaceRoot,
    "packages/react-dom/src/dom-host"
  );
  const reconcilerSource = readWorkspaceTree(
    workspaceRoot,
    "crates/fast-react-reconciler/src"
  );

  const publicReactDomClientRootStillUnsupported =
    hasSourcePattern(
      clientSource,
      /createUnsupportedFunction\(entrypoint,\s*'createRoot'\)/u
    );
  const publicReactDomClientRootRenderPathPresent =
    !publicReactDomClientRootStillUnsupported &&
    hasSourcePattern(clientSource, /\bcreateRoot\b/u) &&
    hasSourcePattern(clientSource, /\brender\b/u);
  const privateShouldSetTextContentHelperPresent = hasSourcePattern(
    textContentSource,
    /\bfunction\s+shouldSetTextContent\b/u
  );
  const privateShouldSetTextContentOracleRows =
    inspectPrivateShouldSetTextContentOracleRows({ oracle, workspaceRoot });
  const privateShouldSetTextContentOracleMismatches =
    privateShouldSetTextContentOracleRows.filter(
      (row) => row.status === "mismatch"
    );
  const privateShouldSetTextContentUnsupportedRows =
    privateShouldSetTextContentOracleRows.filter(
      (row) => row.status === "blocked-unsupported-local-host-type"
    );
  const privateShouldSetTextContentUnsupportedScenarioIds =
    privateShouldSetTextContentUnsupportedRows.map((row) => row.scenarioId);
  const privateShouldSetTextContentOracleGatePassed =
    privateShouldSetTextContentHelperPresent &&
    privateShouldSetTextContentOracleRows.length > 0 &&
    privateShouldSetTextContentOracleMismatches.length === 0;
  const privateTextMutationHelperPresent =
    hasSourcePattern(mutationSource, /\bfunction\s+commitTextUpdate\b/u) &&
    hasSourcePattern(mutationSource, /\bfunction\s+resetTextContent\b/u);
  const domHostTextCreationHelperPresent =
    hasSourcePattern(domHostSource, /\bcreateTextInstance\b/u) ||
    hasSourcePattern(domHostSource, /\bcreateTextNode\b/u);
  const reconcilerHostTextCompleteAndCommitWiringPresent =
    hasSourcePattern(reconcilerSource, /\bHostText\b/u) &&
    hasSourcePattern(reconcilerSource, /\bcommit_text_update\b/u) &&
    hasSourcePattern(reconcilerSource, /\breset_text_content\b/u);
  const dangerouslySetInnerHtmlPropertyBoundaryPresent =
    hasSourcePattern(domHostSource, /\bdangerouslySetInnerHTML\b/u) &&
    hasSourcePattern(domHostSource, /\binnerHTML\b/u) &&
    hasSourcePattern(domHostSource, /Can only set one of `children`/u);

  return {
    publicReactDomClientRootStillUnsupported,
    publicReactDomClientRootRenderPathPresent,
    privateShouldSetTextContentHelperPresent,
    privateShouldSetTextContentOracleGatePassed,
    privateShouldSetTextContentOracleRows,
    privateShouldSetTextContentOracleMismatches,
    privateShouldSetTextContentUnsupportedScenarioIds,
    privateTextMutationHelperPresent,
    domHostTextCreationHelperPresent,
    reconcilerHostTextCompleteAndCommitWiringPresent,
    dangerouslySetInnerHtmlPropertyBoundaryPresent
  };
}

function inspectPrivateShouldSetTextContentOracleRows({
  oracle,
  workspaceRoot
}) {
  if (!oracle?.shouldSetTextContentScenarios) {
    return [];
  }

  let shouldSetTextContent;
  try {
    ({ shouldSetTextContent } = require(
      join(workspaceRoot, "packages/react-dom/src/dom-host/text-content.js")
    ));
  } catch (error) {
    return oracle.shouldSetTextContentScenarios.map((scenario) => ({
      scenarioId: scenario.id,
      expectedReactDomValue: readOracleShouldSetValue(oracle, scenario.id),
      localValue: null,
      status: "mismatch",
      reason: `Unable to load private DOM text-content helper: ${error.message}`
    }));
  }

  if (typeof shouldSetTextContent !== "function") {
    return oracle.shouldSetTextContentScenarios.map((scenario) => ({
      scenarioId: scenario.id,
      expectedReactDomValue: readOracleShouldSetValue(oracle, scenario.id),
      localValue: null,
      status: "mismatch",
      reason: "Private DOM text-content helper does not export shouldSetTextContent"
    }));
  }

  return oracle.shouldSetTextContentScenarios.map((scenario) => {
    const expectedReactDomValue = readOracleShouldSetValue(oracle, scenario.id);
    const props = materializeProps(SHOULD_SET_REACT_STUB, scenario.props);
    let localValue;

    try {
      localValue = Boolean(shouldSetTextContent(scenario.hostType, props));
    } catch (error) {
      return {
        scenarioId: scenario.id,
        expectedReactDomValue,
        localValue: null,
        status: "mismatch",
        reason: `Private DOM text-content helper threw: ${error.message}`
      };
    }

    if (localValue === expectedReactDomValue) {
      return {
        scenarioId: scenario.id,
        expectedReactDomValue,
        localValue,
        status: "matches-react-dom"
      };
    }

    if (
      DOM_TEXT_CONTENT_LOCAL_UNSUPPORTED_SHOULD_SET_SCENARIO_IDS.includes(
        scenario.id
      ) &&
      expectedReactDomValue === true &&
      localValue === false
    ) {
      return {
        scenarioId: scenario.id,
        expectedReactDomValue,
        localValue,
        status: "blocked-unsupported-local-host-type"
      };
    }

    return {
      scenarioId: scenario.id,
      expectedReactDomValue,
      localValue,
      status: "mismatch",
      reason:
        "Private DOM text-content helper result does not match the checked React DOM oracle row"
    };
  });
}

function readOracleShouldSetValue(oracle, scenarioId) {
  const observation = oracle.shouldSetTextContentObservations?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (observation?.result?.status !== "ok") {
    return null;
  }
  return Boolean(observation.result.value);
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
