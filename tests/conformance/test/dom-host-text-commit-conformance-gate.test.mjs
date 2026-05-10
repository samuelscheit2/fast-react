import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS,
  DOM_TEXT_CONTENT_PRIVATE_HOST_TEXT_COMMIT_ADMISSION_KIND,
  DOM_TEXT_CONTENT_PRIVATE_HOST_TEXT_COMMIT_MATCH_STATUS,
  DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_HOST_TEXT_COMMIT_SCENARIOS,
  evaluateDomTextContentConformanceGate,
  runDomTextContentConformanceGate,
  runLocalDomHostTextCommitObservations
} from "../src/dom-text-content-conformance-gate.mjs";
import { readCheckedDomTextContentOracle } from "../src/dom-text-content-oracle.mjs";
import { DOM_TEXT_CONTENT_PROBE_MODES } from "../src/dom-text-content-targets.mjs";

const require = createRequire(import.meta.url);
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const privateMutationAdapter = require(
  join(workspaceRoot, "packages/react-dom/src/dom-host/mutation.js")
);
const oracle = readCheckedDomTextContentOracle();

test("DOM HostText commit gate compares only admitted private fake-DOM rows", () => {
  const gate = runDomTextContentConformanceGate({ checkedOracle: oracle });
  const admittedRowIds = DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS.map(
    (row) => row.rowId
  );

  assert.equal(gate.ok, true);
  assert.equal(
    gate.summary.admittedPrivateHostTextCommitRowCount,
    admittedRowIds.length * DOM_TEXT_CONTENT_PROBE_MODES.length
  );
  assert.equal(gate.summary.privateHostTextCommitBehaviorCompared, true);
  assert.equal(gate.summary.fullDomTextContentCompatibilityAdmitted, false);
  assert.equal(gate.summary.publicRootCompatibilityClaimed, false);
  assert.equal(gate.summary.serverRenderingCompatibilityClaimed, false);
  assert.equal(gate.summary.hydrationCompatibilityClaimed, false);
  assert.equal(gate.summary.compatibilityClaimed, false);
  assert.equal(
    gate.gate.unsupportedDomRenderPaths.publicRootCompatibilityClaimed,
    false
  );
  assert.deepEqual(
    gate.localHostTextCommitObservationMetadata.gateMetadata.supportedFakeDomRowIds,
    admittedRowIds
  );
  assert.equal(
    gate.localHostTextCommitObservationMetadata.gateMetadata.publicRootsCompared,
    false
  );
  assert.equal(
    gate.localHostTextCommitObservationMetadata.gateMetadata.serverRenderingCompared,
    false
  );
  assert.equal(
    gate.localHostTextCommitObservationMetadata.gateMetadata.hydrationCompared,
    false
  );
  assert.equal(
    gate.localHostTextCommitObservationMetadata.gateMetadata.browserDomCompared,
    false
  );
  assert.equal(
    gate.localHostTextCommitObservationMetadata.gateMetadata.compatibilityClaimed,
    false
  );
  for (const row of gate.admittedPrivateHostTextCommitRows) {
    const admission = DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS.find(
      (candidate) => candidate.rowId === row.rowId
    );
    assert.ok(admission, row.rowId);
    assert.equal(
      row.admissionKind,
      DOM_TEXT_CONTENT_PRIVATE_HOST_TEXT_COMMIT_ADMISSION_KIND
    );
    assert.equal(
      row.gateStatus,
      DOM_TEXT_CONTENT_PRIVATE_HOST_TEXT_COMMIT_MATCH_STATUS
    );
    assert.equal(row.localProbe, admission.localProbe);
    assert.equal(row.oracleExtractor, admission.oracleExtractor);
    assert.deepEqual(row.coverage, admission.coverage);
    assert.equal(row.reason, admission.reason);
    assert.deepEqual(row.localResult, row.reactOracleResult);
    assert.equal(row.firstDifferencePath, null);
    assert.equal(row.publicRootCompatibilityClaimed, false);
    assert.equal(row.serverRenderingCompatibilityClaimed, false);
    assert.equal(row.hydrationCompatibilityClaimed, false);
    assert.equal(row.compatibilityClaimed, false);
  }
  assert.deepEqual(
    gate.skippedUnsupportedPrivateHostTextCommitScenarioRows.map(
      (row) => row.scenarioId
    ),
    DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_HOST_TEXT_COMMIT_SCENARIOS.map(
      (scenario) => scenario.scenarioId
    )
  );
});

test("DOM HostText commit gate fails closed on admitted row drift and metadata claims", () => {
  const mismatchingObservations = cloneLocalHostTextCommitObservations();
  mismatchingObservations.observations[0].result.mutations[0].value = "wrong";

  const mismatchGate = evaluateDomTextContentConformanceGate({
    checkedOracle: oracle,
    localHostTextCommitObservations: mismatchingObservations
  });
  assert.equal(mismatchGate.ok, false);
  assert.ok(
    mismatchGate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "admitted-private-host-text-commit-output-mismatch"
    )
  );

  const claimingObservations = cloneLocalHostTextCommitObservations();
  claimingObservations.metadata.gateMetadata.compatibilityClaimed = true;
  const claimingGate = evaluateDomTextContentConformanceGate({
    checkedOracle: oracle,
    localHostTextCommitObservations: claimingObservations
  });
  assert.equal(claimingGate.ok, false);
  assert.ok(
    claimingGate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "local-host-text-commit-metadata-compatibilityClaimed-mismatch"
    )
  );

  const baseline = runDomTextContentConformanceGate({ checkedOracle: oracle });
  const publicRootGate = evaluateDomTextContentConformanceGate({
    checkedOracle: oracle,
    localChecks: {
      ...baseline.localChecks,
      publicReactDomClientRootStillUnsupported: false,
      publicReactDomClientRootRenderPathPresent: true
    }
  });
  assert.equal(publicRootGate.ok, false);
  assert.ok(
    publicRootGate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "local-public-react-dom-root-render-path-present-during-private-gate"
    )
  );
});

function cloneLocalHostTextCommitObservations() {
  return JSON.parse(JSON.stringify(runLocalDomHostTextCommitObservations()));
}

test("local DOM HostText commit probes normalize create, update, delete, insert, and reset rows", () => {
  const local = runLocalDomHostTextCommitObservations();
  const byRow = new Map(
    local.observations.map((observation) => [observation.rowId, observation])
  );

  assert.equal(local.metadata.loaded, true);
  assert.deepEqual(byRow.get("host-text-create-append").result.mutations, [
    { type: "createTextNode", value: "left" },
    { type: "createTextNode", value: "right" },
    { type: "appendChild", parent: "DIV", child: "#text" },
    { type: "appendChild", parent: "DIV", child: "#text" }
  ]);
  assert.deepEqual(byRow.get("host-text-update-node-value").result.mutations, [
    { type: "setNodeValue", target: "#text", value: "left!" },
    { type: "setNodeValue", target: "#text", value: "right!" }
  ]);
  assert.deepEqual(byRow.get("host-text-delete-remove-child").result.mutations, [
    { type: "removeChild", parent: "DIV", child: "#text", found: true },
    { type: "removeChild", parent: "DIV", child: "#text", found: true }
  ]);
  assert.deepEqual(byRow.get("host-text-insert-before").result.mutations, [
    { type: "createTextNode", value: "head" },
    {
      type: "insertBefore",
      parent: "DIV",
      child: "#text",
      before: "SPAN",
      beforeFound: true
    }
  ]);
  assert.deepEqual(
    byRow.get("reset-text-content-before-managed-child").result.mutations,
    [{ type: "setTextContent", target: "SECTION", value: "" }]
  );
});

test("private mutation adapter drives the admitted DOM HostText commit rows", () => {
  const local = runLocalDomHostTextCommitObservations();
  const localByRow = new Map(
    local.observations.map((observation) => [observation.rowId, observation])
  );
  const adapterByRow = runAdmittedRowsThroughPrivateMutationAdapter();
  const admittedRowIds = DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS.map(
    (row) => row.rowId
  );

  assert.equal(typeof privateMutationAdapter.createDomHostTextInstance, "function");
  assert.equal(
    privateMutationAdapter.DOM_HOST_TEXT_COMMIT_GATE_METADATA
      .privateTextCreationBridge,
    "createDomHostTextInstance"
  );
  assert.equal(
    privateMutationAdapter.DOM_HOST_TEXT_COMMIT_GATE_METADATA.publicRootsCompared,
    false
  );
  assert.deepEqual([...adapterByRow.keys()], admittedRowIds);

  for (const rowId of admittedRowIds) {
    assert.deepEqual(adapterByRow.get(rowId), localByRow.get(rowId).result);
  }
});

function runAdmittedRowsThroughPrivateMutationAdapter() {
  const rows = new Map();

  for (const admittedRow of DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS) {
    rows.set(
      admittedRow.rowId,
      runPrivateMutationAdapterRow(admittedRow.localProbe)
    );
  }

  return rows;
}

function runPrivateMutationAdapterRow(localProbe) {
  const document = new AdapterTextFakeDocument();

  switch (localProbe) {
    case "host-text-create-append": {
      const parent = document.createElement("div");
      const left = privateMutationAdapter.createDomHostTextInstance(
        "left",
        parent
      );
      const right = privateMutationAdapter.createDomHostTextInstance(
        "right",
        parent
      );
      privateMutationAdapter.appendChild(parent, left);
      privateMutationAdapter.appendChild(parent, right);
      return {
        rowId: "host-text-create-append",
        operation: localProbe,
        mutations: document.mutations
      };
    }
    case "host-text-update-node-value": {
      document.recording = false;
      const left = privateMutationAdapter.createDomHostTextInstance(
        "left",
        document
      );
      const right = privateMutationAdapter.createDomHostTextInstance(
        "right",
        document
      );
      document.recording = true;
      document.clearMutations();
      privateMutationAdapter.commitTextUpdate(left, "left", "left!");
      privateMutationAdapter.commitTextUpdate(right, "right", "right!");
      return {
        rowId: "host-text-update-node-value",
        operation: localProbe,
        mutations: document.mutations
      };
    }
    case "host-text-delete-remove-child": {
      const parent = document.createElement("div");
      const anchor = document.createElement("span");
      document.recording = false;
      const left = privateMutationAdapter.createDomHostTextInstance(
        "left",
        parent
      );
      const right = privateMutationAdapter.createDomHostTextInstance(
        "right",
        parent
      );
      parent.appendChild(left, { record: false });
      parent.appendChild(anchor, { record: false });
      parent.appendChild(right, { record: false });
      document.recording = true;
      document.clearMutations();
      privateMutationAdapter.removeChild(parent, left);
      privateMutationAdapter.removeChild(parent, right);
      return {
        rowId: "host-text-delete-remove-child",
        operation: localProbe,
        mutations: document.mutations
      };
    }
    case "host-text-insert-before": {
      const parent = document.createElement("div");
      const anchor = document.createElement("span");
      parent.appendChild(anchor, { record: false });
      document.clearMutations();
      const head = privateMutationAdapter.createDomHostTextInstance(
        "head",
        parent
      );
      privateMutationAdapter.insertBefore(parent, head, anchor);
      return {
        rowId: "host-text-insert-before",
        operation: localProbe,
        mutations: document.mutations
      };
    }
    case "reset-text-content-before-managed-child": {
      const section = document.createElement("section");
      document.recording = false;
      const initialText = privateMutationAdapter.createDomHostTextInstance(
        "Plain text",
        section
      );
      section.appendChild(initialText, { record: false });
      document.recording = true;
      document.clearMutations();
      privateMutationAdapter.resetTextContent(section);
      return {
        rowId: "reset-text-content-before-managed-child",
        operation: localProbe,
        mutations: document.mutations
      };
    }
    default:
      throw new Error(`Unknown admitted HostText commit row: ${localProbe}`);
  }
}

class AdapterTextFakeDocument {
  constructor() {
    this.mutations = [];
    this.nodeName = "#document";
    this.nodeType = 9;
    this.ownerDocument = this;
    this.recording = true;
  }

  createElement(tagName) {
    return new AdapterTextFakeElement(tagName, this);
  }

  createTextNode(text) {
    if (this.recording) {
      this.mutations.push({
        type: "createTextNode",
        value: String(text)
      });
    }
    return new AdapterTextFakeText(text, this);
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

  recordInsertBefore(parent, child, beforeChild, beforeFound) {
    this.mutations.push({
      type: "insertBefore",
      parent: parent.nodeName,
      child: child.nodeName,
      before: beforeChild.nodeName,
      beforeFound
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

class AdapterTextFakeNode {
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
    detachAdapterTextFakeNode(child);
    this.childNodes.push(child);
    child.parentNode = this;
    if (record) {
      this.ownerDocument.recordAppendChild(this, child);
    }
    return child;
  }

  insertBefore(child, beforeChild) {
    const beforeIndex = this.childNodes.indexOf(beforeChild);
    if (beforeIndex === -1) {
      this.ownerDocument.recordInsertBefore(this, child, beforeChild, false);
      throw new Error("Cannot insert before a node outside the parent.");
    }
    detachAdapterTextFakeNode(child);
    this.childNodes.splice(beforeIndex, 0, child);
    child.parentNode = this;
    this.ownerDocument.recordInsertBefore(this, child, beforeChild, true);
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

class AdapterTextFakeElement extends AdapterTextFakeNode {
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
      detachAdapterTextFakeNode(child);
    }
    this._textContent = String(value);
  }
}

class AdapterTextFakeText extends AdapterTextFakeNode {
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

function detachAdapterTextFakeNode(child) {
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
