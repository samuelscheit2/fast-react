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

export const DOM_TEXT_CONTENT_LOCAL_TEXT_TRANSITION_ORDER_STATUS =
  "matched-react-dom-19.2.6-private-text-content-transition-order";

export const DOM_TEXT_CONTENT_LOCAL_TEXT_TRANSITION_ORDER_ROWS = Object.freeze([
  {
    rowId: "text-content-reset-before-managed-child-append",
    scenarioId: "text-content-to-managed-child-boundary",
    phaseId: "managed-child",
    oracleExtractor: "text-content-reset-before-managed-child-append",
    localProbe: "text-content-reset-before-managed-child-append",
    coverage: [
      "element-text-content-shortcut",
      "managed-child-boundary",
      "resetTextContent",
      "appendChild",
      "ordering"
    ],
    reason:
      "A text-content shortcut must clear the host element before appending the first managed element child."
  },
  {
    rowId: "managed-child-remove-before-text-content-update",
    scenarioId: "text-content-to-managed-child-boundary",
    phaseId: "text-again",
    oracleExtractor: "managed-child-remove-before-text-content-update",
    localProbe: "managed-child-remove-before-text-content-update",
    coverage: [
      "element-text-content-shortcut",
      "managed-child-boundary",
      "removeChild",
      "setTextContent",
      "ordering"
    ],
    reason:
      "A managed element child must be removed before the host element receives the next text-content shortcut update."
  }
]);

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

  if (!localChecks.privateTextContentTransitionOrderGatePresent) {
    violations.push({
      id: "private-text-content-transition-order-gate-missing",
      reason:
        "The DOM text-content local gate requires private reset/update transition metadata from the text-content and mutation helpers."
    });
  }

  if (localChecks.privateTextContentTransitionOrderMismatches.length > 0) {
    violations.push({
      id: "private-text-content-transition-order-oracle-mismatch",
      reason:
        "The private fake-DOM text-content transition gate must preserve React DOM 19.2.6 reset/update ordering for text-to-element and element-to-text child switches.",
      rowIds: localChecks.privateTextContentTransitionOrderMismatches.map(
        (row) => row.rowId
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
  const privateTextContentTransitionOrderMetadata =
    inspectPrivateTextContentTransitionOrderMetadata({ workspaceRoot });
  const privateTextContentTransitionOrderMetadataMismatches =
    validatePrivateTextContentTransitionOrderMetadata(
      privateTextContentTransitionOrderMetadata
    );
  const privateTextContentTransitionOrderRows =
    inspectPrivateTextContentTransitionOrderRows({ oracle, workspaceRoot });
  const privateTextContentTransitionOrderMismatches =
    privateTextContentTransitionOrderRows.filter(
      (row) => row.status === "mismatch"
    );
  const privateTextContentTransitionOrderGatePresent =
    privateTextContentTransitionOrderMetadata.textContentMetadataPresent &&
    privateTextContentTransitionOrderMetadata.mutationMetadataPresent &&
    privateTextContentTransitionOrderMetadataMismatches.length === 0;
  const privateTextContentTransitionOrderGatePassed =
    privateTextContentTransitionOrderGatePresent &&
    privateTextContentTransitionOrderRows.length > 0 &&
    privateTextContentTransitionOrderMismatches.length === 0;
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
    privateTextContentTransitionOrderGatePresent,
    privateTextContentTransitionOrderGatePassed,
    privateTextContentTransitionOrderMetadata,
    privateTextContentTransitionOrderMetadataMismatches,
    privateTextContentTransitionOrderRows,
    privateTextContentTransitionOrderMismatches,
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

function inspectPrivateTextContentTransitionOrderMetadata({ workspaceRoot }) {
  const loadResult = loadPrivateTextContentTransitionOrderHelpers({
    workspaceRoot
  });
  if (loadResult.error) {
    return {
      loadError: loadResult.error,
      textContentMetadata: null,
      mutationMetadata: null,
      textContentMetadataPresent: false,
      mutationMetadataPresent: false
    };
  }

  return {
    loadError: null,
    textContentMetadata: loadResult.textContentMetadata,
    mutationMetadata: loadResult.mutationMetadata,
    textContentMetadataPresent:
      loadResult.textContentMetadata !== null &&
      typeof loadResult.textContentMetadata === "object",
    mutationMetadataPresent:
      loadResult.mutationMetadata !== null &&
      typeof loadResult.mutationMetadata === "object"
  };
}

function validatePrivateTextContentTransitionOrderMetadata(metadata) {
  const expectedRowIds = DOM_TEXT_CONTENT_LOCAL_TEXT_TRANSITION_ORDER_ROWS.map(
    (row) => row.rowId
  );
  const mismatches = [];

  if (metadata.loadError !== null) {
    mismatches.push({
      id: "private-text-content-transition-order-load-error",
      reason: metadata.loadError
    });
    return mismatches;
  }

  for (const [metadataName, gateMetadata] of [
    ["textContent", metadata.textContentMetadata],
    ["mutation", metadata.mutationMetadata]
  ]) {
    if (gateMetadata === null || typeof gateMetadata !== "object") {
      mismatches.push({
        id: `private-text-content-transition-order-${metadataName}-metadata-missing`
      });
      continue;
    }

    const rowDifference = findFirstDifferencePath(
      gateMetadata.supportedFakeDomRowIds,
      expectedRowIds
    );
    if (rowDifference !== null) {
      mismatches.push({
        id: `private-text-content-transition-order-${metadataName}-row-mismatch`,
        firstDifferencePath: rowDifference,
        supportedFakeDomRowIds: gateMetadata.supportedFakeDomRowIds ?? null,
        expectedRowIds
      });
    }

    for (const key of [
      "publicRootsCompared",
      "serverRenderingCompared",
      "hydrationCompared",
      "browserDomCompared",
      "compatibilityClaimed"
    ]) {
      if (gateMetadata[key] !== false) {
        mismatches.push({
          id: `private-text-content-transition-order-${metadataName}-${key}-claim`,
          value: gateMetadata[key] ?? null
        });
      }
    }
  }

  return mismatches;
}

function inspectPrivateTextContentTransitionOrderRows({
  oracle,
  workspaceRoot
}) {
  if (!oracle?.clientMutationObservations) {
    return [];
  }

  const expectedRows =
    readExpectedPrivateTextContentTransitionOrderRows(oracle);
  const loadResult = loadPrivateTextContentTransitionOrderHelpers({
    workspaceRoot
  });
  if (loadResult.error) {
    return expectedRows.map((row) => ({
      ...row,
      localResult: null,
      status: "mismatch",
      firstDifferencePath: "$",
      reason: `Unable to load private text-content transition helpers: ${loadResult.error}`
    }));
  }

  let localResults;
  try {
    localResults = runPrivateTextContentTransitionOrderProbes(
      loadResult.mutation
    );
  } catch (error) {
    return expectedRows.map((row) => ({
      ...row,
      localResult: null,
      status: "mismatch",
      firstDifferencePath: "$",
      reason: `Private text-content transition probe failed: ${
        error?.message ?? String(error)
      }`
    }));
  }

  return expectedRows.map((row) => {
    if (row.expectedReactDomResult === null) {
      return {
        ...row,
        localResult: localResults.get(row.rowId) ?? null,
        status: "mismatch",
        firstDifferencePath: "$",
        reason: row.expectedReactDomError
      };
    }

    const localResult = localResults.get(row.rowId) ?? null;
    const firstDifferencePath = findFirstDifferencePath(
      row.expectedReactDomResult,
      localResult
    );
    if (firstDifferencePath === null) {
      return {
        ...row,
        localResult,
        status: DOM_TEXT_CONTENT_LOCAL_TEXT_TRANSITION_ORDER_STATUS,
        firstDifferencePath: null
      };
    }

    return {
      ...row,
      localResult,
      status: "mismatch",
      firstDifferencePath,
      reason:
        "Private fake-DOM text-content transition mutations do not match the checked React DOM oracle row"
    };
  });
}

function loadPrivateTextContentTransitionOrderHelpers({ workspaceRoot }) {
  try {
    const textContent = require(
      join(workspaceRoot, "packages/react-dom/src/dom-host/text-content.js")
    );
    const mutation = require(
      join(workspaceRoot, "packages/react-dom/src/dom-host/mutation.js")
    );
    return {
      textContentMetadata:
        textContent.DOM_TEXT_CONTENT_RESET_UPDATE_GATE_METADATA ?? null,
      mutationMetadata:
        mutation.DOM_TEXT_CONTENT_RESET_UPDATE_MUTATION_GATE_METADATA ?? null,
      mutation,
      error: null
    };
  } catch (error) {
    return {
      textContentMetadata: null,
      mutationMetadata: null,
      mutation: null,
      error: error?.message ?? String(error)
    };
  }
}

function readExpectedPrivateTextContentTransitionOrderRows(oracle) {
  const rows = [];
  for (const [modeId] of Object.entries(
    oracle.clientMutationObservations ?? {}
  )) {
    for (const transitionRow of DOM_TEXT_CONTENT_LOCAL_TEXT_TRANSITION_ORDER_ROWS) {
      const expected = readExpectedTextContentTransitionOrderResult({
        oracle,
        modeId,
        transitionRow
      });
      rows.push({
        modeId,
        rowId: transitionRow.rowId,
        scenarioId: transitionRow.scenarioId,
        phaseId: transitionRow.phaseId,
        oracleExtractor: transitionRow.oracleExtractor,
        localProbe: transitionRow.localProbe,
        coverage: transitionRow.coverage,
        reason: transitionRow.reason,
        expectedReactDomResult: expected.result,
        expectedReactDomError: expected.error
      });
    }
  }
  return rows;
}

function readExpectedTextContentTransitionOrderResult({
  oracle,
  modeId,
  transitionRow
}) {
  const observation = oracle.clientMutationObservations?.[modeId]?.find(
    (candidate) =>
      candidate.scenarioId === transitionRow.scenarioId &&
      candidate.action === "client"
  );
  const phase = observation?.result?.phases?.find(
    (candidate) => candidate.phaseId === transitionRow.phaseId
  );

  if (!phase || !Array.isArray(phase.mutations)) {
    return {
      result: null,
      error: `Missing client mutation phase ${transitionRow.phaseId} for ${transitionRow.scenarioId}.`
    };
  }

  return {
    result: {
      rowId: transitionRow.rowId,
      operation: transitionRow.localProbe,
      mutations: phase.mutations.map(normalizeTextContentTransitionMutation)
    },
    error: null
  };
}

function normalizeTextContentTransitionMutation(mutation) {
  if (mutation.type === "createElement") {
    return {
      type: mutation.type,
      tagName: mutation.tagName
    };
  }

  if (mutation.type === "setTextContent") {
    return {
      type: mutation.type,
      target: mutation.target,
      value: mutation.value
    };
  }

  if (mutation.type === "createTextNode") {
    return {
      type: mutation.type,
      value: mutation.value
    };
  }

  if (mutation.type === "appendChild") {
    return {
      type: mutation.type,
      parent: mutation.parent,
      child: mutation.child
    };
  }

  if (mutation.type === "removeChild") {
    return {
      type: mutation.type,
      parent: mutation.parent,
      child: mutation.child,
      found: mutation.found
    };
  }

  return { ...mutation };
}

function runPrivateTextContentTransitionOrderProbes(mutation) {
  const results = new Map();

  for (const transitionRow of DOM_TEXT_CONTENT_LOCAL_TEXT_TRANSITION_ORDER_ROWS) {
    results.set(
      transitionRow.rowId,
      runPrivateTextContentTransitionOrderProbe({
        mutation,
        transitionRow
      })
    );
  }

  return results;
}

function runPrivateTextContentTransitionOrderProbe({
  mutation,
  transitionRow
}) {
  const document = new TextContentTransitionFakeDocument();

  switch (transitionRow.localProbe) {
    case "text-content-reset-before-managed-child-append": {
      const section = document.createElement("section", { record: false });
      const existingText = document.createTextNode("Plain text", {
        record: false
      });
      section.appendChild(existingText, { record: false });
      document.clearMutations();

      const span = mutation.createDomHostElementInstance("span", section);
      mutation.setTextContent(span, "Managed child");
      mutation.resetTextContent(section);
      mutation.appendChild(section, span);

      return {
        rowId: transitionRow.rowId,
        operation: transitionRow.localProbe,
        mutations: document.mutations
      };
    }
    case "managed-child-remove-before-text-content-update": {
      const section = document.createElement("section", { record: false });
      const span = document.createElement("span", { record: false });
      const existingText = document.createTextNode("Managed child", {
        record: false
      });
      span.appendChild(existingText, { record: false });
      section.appendChild(span, { record: false });
      document.clearMutations();

      mutation.removeChild(section, span);
      mutation.setTextContent(section, "Plain text again");

      return {
        rowId: transitionRow.rowId,
        operation: transitionRow.localProbe,
        mutations: document.mutations
      };
    }
    default:
      throw new Error(
        `Unknown text-content transition probe: ${transitionRow.localProbe}`
      );
  }
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

class TextContentTransitionFakeDocument {
  constructor() {
    this.mutations = [];
    this.nodeName = "#document";
    this.nodeType = 9;
    this.ownerDocument = this;
  }

  createElement(tagName, { record = true } = {}) {
    if (record) {
      this.mutations.push({
        type: "createElement",
        tagName
      });
    }
    return new TextContentTransitionFakeElement(tagName, this);
  }

  createTextNode(text, { record = true } = {}) {
    if (record) {
      this.mutations.push({
        type: "createTextNode",
        value: String(text)
      });
    }
    return new TextContentTransitionFakeText(text, this);
  }

  clearMutations() {
    this.mutations.length = 0;
  }

  recordAppendChild(parent, child) {
    this.mutations.push({
      type: "appendChild",
      parent: parent.nodeName,
      child: child.nodeName
    });
  }

  recordRemoveChild(parent, child, found) {
    this.mutations.push({
      type: "removeChild",
      parent: parent.nodeName,
      child: child.nodeName,
      found
    });
  }

  recordSetTextContent(node, value) {
    this.mutations.push({
      type: "setTextContent",
      target: node.nodeName,
      value: String(value)
    });
  }

  recordSetNodeValue(node, value) {
    this.mutations.push({
      type: "setNodeValue",
      target: node.nodeName,
      value: String(value)
    });
  }
}

class TextContentTransitionFakeNode {
  constructor(nodeName, nodeType, ownerDocument) {
    this.childNodes = [];
    this.nodeName = nodeName;
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }

  appendChild(child, { record = true } = {}) {
    assertTextContentTransitionFakeChild(child);
    detachTextContentTransitionFakeNode(child);
    this.childNodes.push(child);
    child.parentNode = this;
    if (record) {
      this.ownerDocument.recordAppendChild(this, child);
    }
    return child;
  }

  removeChild(child) {
    const childIndex = this.childNodes.indexOf(child);
    if (childIndex === -1) {
      this.ownerDocument.recordRemoveChild(this, child, false);
      throw new Error("Cannot remove a node outside the parent.");
    }
    this.childNodes.splice(childIndex, 1);
    child.parentNode = null;
    this.ownerDocument.recordRemoveChild(this, child, true);
    return child;
  }
}

class TextContentTransitionFakeElement extends TextContentTransitionFakeNode {
  constructor(tagName, ownerDocument) {
    super(tagName.toUpperCase(), 1, ownerDocument);
    this._textContent = "";
  }

  get textContent() {
    if (this.childNodes.length === 0) {
      return this._textContent;
    }
    return this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this.ownerDocument.recordSetTextContent(this, value);
    for (const child of [...this.childNodes]) {
      detachTextContentTransitionFakeNode(child);
    }
    this._textContent = String(value);
    if (this._textContent !== "") {
      this.appendChild(this.ownerDocument.createTextNode(this._textContent));
    }
  }
}

class TextContentTransitionFakeText extends TextContentTransitionFakeNode {
  constructor(text, ownerDocument) {
    super("#text", 3, ownerDocument);
    this._text = String(text);
  }

  get data() {
    return this._text;
  }

  set data(value) {
    this.nodeValue = value;
  }

  get nodeValue() {
    return this._text;
  }

  set nodeValue(value) {
    this._text = String(value);
    this.ownerDocument.recordSetNodeValue(this, this._text);
  }

  get textContent() {
    return this._text;
  }

  set textContent(value) {
    this.nodeValue = value;
  }
}

function assertTextContentTransitionFakeChild(child) {
  if (child == null || typeof child !== "object") {
    throw new Error("Fake DOM child must be an object.");
  }
}

function detachTextContentTransitionFakeNode(child) {
  if (child.parentNode === null) {
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
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
      const difference = findFirstDifferencePath(
        left[index],
        right[index],
        `${path}[${index}]`
      );
      if (difference !== null) {
        return difference;
      }
    }
    return null;
  }

  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (findFirstDifferencePath(leftKeys, rightKeys, `${path}{keys}`) !== null) {
    return `${path}{keys}`;
  }

  for (const key of leftKeys) {
    const difference = findFirstDifferencePath(
      left[key],
      right[key],
      `${path}.${key}`
    );
    if (difference !== null) {
      return difference;
    }
  }

  return null;
}
