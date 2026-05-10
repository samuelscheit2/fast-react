import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  findReactDomHydrationMarkerContract,
  readCheckedReactDomHydrationMarkerOracle
} from "../src/react-dom-hydration-marker-oracle.mjs";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

const hydrationGate = require(
  path.join(
    repoRoot,
    "packages/react-dom/src/client/hydration-boundary-gate.js"
  )
);
const domContainer = require(
  path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
);
const rootMarkers = require(
  path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
);
const ReactDOMClient = require(path.join(repoRoot, "packages/react-dom/client.js"));
const ReactDOMProfiling = require(
  path.join(repoRoot, "packages/react-dom/profiling.js")
);

const oracle = readCheckedReactDomHydrationMarkerOracle();

test("private hydration boundary gate accepts the checked marker oracle", () => {
  const oracleInfo = hydrationGate.assertAcceptedHydrationMarkerOracle(oracle);

  assert.equal(
    oracleInfo.oracleKind,
    "react-19.2.6-react-dom-hydration-marker-oracle"
  );
  assert.equal(oracleInfo.schemaVersion, 1);
  assert.equal(oracleInfo.source, "checked-oracle");
  assert.equal(oracleInfo.compatibilityClaimed, false);
  assert.equal(oracleInfo.fastReactHydrationCompatible, false);
  assert.equal(oracleInfo.fullDualRunOracleExists, false);
  assert.equal(oracleInfo.markerContractCount, oracle.markerContracts.length);
  assert.deepEqual(
    oracleInfo.markerContractIds,
    oracle.markerContracts.map((contract) => contract.id)
  );
  assert.deepEqual(
    hydrationGate.acceptedHydrationMarkerContracts,
    oracle.markerContracts.map(
      ({
        id,
        area,
        serializedMarker,
        commentData,
        companionNode,
        lifecycle
      }) => ({
        id,
        area,
        serializedMarker,
        commentData,
        companionNode,
        lifecycle
      })
    )
  );
  assert.deepEqual(
    oracleInfo.commentMarkers,
    oracle.markerContracts
      .filter((contract) => contract.commentData !== null)
      .map((contract) => ({
        commentData: contract.commentData,
        id: contract.id
      }))
  );
  assert.equal(
    findReactDomHydrationMarkerContract(oracle, "suspense-queued-start")
      .commentData,
    "$~"
  );
});

test("private hydration boundary gate parses accepted container marker evidence read-only", () => {
  const { container, contractIds } = createAcceptedHydrationMarkerFixture(
    "parser"
  );
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle
  });
  const diagnostics = gate.inspectContainerMarkers(container);

  assert.equal(
    diagnostics.kind,
    "FastReactDomHydrationContainerMarkerDiagnostics"
  );
  assert.equal(diagnostics.status, "diagnostic-only");
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(diagnostics.canHydrate, false);
  assert.equal(diagnostics.hydrateRootSupported, false);
  assert.equal(diagnostics.rootSchedulingSupported, false);
  assert.equal(diagnostics.eventReplaySupported, false);
  assert.equal(diagnostics.domMutationSupported, false);
  assert.equal(diagnostics.suspenseHydrationSupported, false);
  assert.equal(diagnostics.formMarkerClaimingSupported, false);
  assert.equal(diagnostics.markerContractCount, oracle.markerContracts.length);
  assert.equal(diagnostics.acceptedMarkerCount, oracle.markerContracts.length);
  assert.equal(diagnostics.commentMarkerCount, 12);
  assert.equal(diagnostics.templateMarkerCount, 5);
  assert.equal(diagnostics.unrecognizedMarkerCount, 0);
  assert.deepEqual(
    diagnostics.markers.map((marker) => marker.contractId),
    contractIds
  );
  assert.deepEqual(
    diagnostics.summaryByContract,
    oracle.markerContracts.map((contract) => ({
      id: contract.id,
      count: 1
    }))
  );

  const pendingMarker = diagnostics.markers.find(
    (marker) => marker.contractId === "suspense-pending-start"
  );
  assert.equal(pendingMarker.companion.status, "matched");
  assert.equal(pendingMarker.companion.templateInfo.id, "parser-B:1a");
  assert.equal(pendingMarker.companion.acceptedEvidence, true);

  const clientRenderedMarker = diagnostics.markers.find(
    (marker) => marker.contractId === "suspense-client-rendered-start"
  );
  assert.deepEqual(clientRenderedMarker.companion.templateInfo.errorEvidence, {
    componentStack: "component-stack",
    digest: "digest",
    message: "message",
    stack: "stack"
  });

  const styledBoundaryMarker = diagnostics.markers.find(
    (marker) =>
      marker.contractId === "external-runtime-complete-boundary-with-styles"
  );
  assert.equal(
    styledBoundaryMarker.templateInfo.attributes["data-sty"],
    "[\"main\"]"
  );

  assert.deepEqual(
    container.childNodes.map((node) => node.nodeName || "#comment"),
    [
      "#comment",
      "#comment",
      "#comment",
      "#comment",
      "TEMPLATE",
      "#comment",
      "TEMPLATE",
      "#comment",
      "TEMPLATE",
      "#comment",
      "#comment",
      "#comment",
      "#comment",
      "#comment",
      "#comment",
      "TEMPLATE",
      "TEMPLATE",
      "TEMPLATE",
      "TEMPLATE",
      "TEMPLATE"
    ]
  );
});

test("private hydration boundary gate records unsupported hydrateRoot deterministically", () => {
  const first = createUnsupportedRecordScenario("deterministic");
  const second = createUnsupportedRecordScenario("deterministic");

  assert.deepEqual(first.record, second.record);
  assert.equal(Object.isFrozen(first.record), true);
  assert.equal(first.record.$$typeof, hydrationGate.privateHydrationBoundaryRecordType);
  assert.equal(first.record.kind, "FastReactDomUnsupportedHydrationBoundaryRecord");
  assert.equal(first.record.operation, "hydrateRoot");
  assert.equal(first.record.status, "unsupported");
  assert.equal(first.record.recordId, "hydration-gate:1");
  assert.equal(first.record.rootKind, "unsupported-hydration");
  assert.equal(first.record.rootTag, "ConcurrentRoot");
  assert.deepEqual(first.record.containerInfo, {
    kind: "object",
    nodeName: "DIV",
    nodeType: domContainer.ELEMENT_NODE
  });
  assert.deepEqual(first.record.initialChildrenInfo, {
    keys: ["props", "type"],
    type: "object"
  });
  assert.deepEqual(first.record.optionsInfo, {
    keys: [
      "identifierPrefix",
      "onHydrated",
      "onRecoverableError",
      "unstable_strictMode"
    ],
    type: "object"
  });
  assert.equal(first.record.canHydrate, false);
  assert.equal(first.record.publicRootCreated, false);
  assert.equal(first.record.containerMarked, false);
  assert.equal(first.record.listenersAttached, false);
  assert.equal(first.record.domMutated, false);
  assert.equal(first.record.eventsReplayed, false);
  assert.deepEqual(
    first.record.blockedOn.map((entry) => entry.id),
    [
      "no-hydration-root-constructor",
      "no-hydration-context",
      "no-hydration-root-scheduling",
      "no-hydration-marker-consumption",
      "no-boundary-dom-operations",
      "no-event-replay",
      "no-form-marker-claiming"
    ]
  );
  assert.deepEqual(
    first.record.oracleInfo.markerContractIds,
    oracle.markerContracts.map((contract) => contract.id)
  );
  assert.equal(first.record.markerDiagnostics.status, "diagnostic-only");
  assert.equal(first.record.markerDiagnostics.acceptedMarkerCount, 2);
  assert.deepEqual(
    first.record.markerDiagnostics.markers.map((marker) => marker.contractId),
    ["suspense-completed-start", "suspense-end"]
  );
  assert.equal(first.record.rootScheduled, false);
  assert.equal(first.record.suspenseHydrationScheduled, false);

  const payload = hydrationGate.getPrivateHydrationBoundaryRecordPayload(
    first.record
  );
  assert.equal(payload.container, first.container);
  assert.equal(payload.initialChildren, first.initialChildren);
  assert.equal(payload.hydrationOptions, first.hydrationOptions);
  assert.equal(hydrationGate.isPrivateHydrationBoundaryRecord(first.record), true);
  assert.equal(hydrationGate.isPrivateHydrationBoundaryRecord({}), false);
});

test("private hydration boundary gate does not mark containers, install listeners, or mutate DOM-like nodes", () => {
  const { container, document, record } =
    createUnsupportedRecordScenario("side-effects");

  assert.equal(record.containerMarked, false);
  assert.deepEqual(rootMarkers.inspectContainerRootMarker(container), {
    inspectable: true,
    nullCount: 0,
    properties: [],
    propertyCount: 0,
    truthyCount: 0
  });
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
  assert.deepEqual(container.childNodes, [
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    { data: "/$", nodeType: domContainer.COMMENT_NODE }
  ]);
  assert.equal(record.markerDiagnostics.diagnosticOnly, true);
  assert.equal(record.markerDiagnostics.domMutationSupported, false);
  assert.equal(record.markerDiagnostics.eventReplaySupported, false);
});

test("private hydration boundary gate fails closed for invalid containers and oracle drift", () => {
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle
  });
  assert.throws(
    () =>
      gate.recordUnsupportedHydrateRoot(
        {
          nodeName: "#text",
          nodeType: domContainer.TEXT_NODE,
          ownerDocument: createDocument("invalid")
        },
        "child"
      ),
    {
      code: "FAST_REACT_DOM_INVALID_CONTAINER"
    }
  );
  assert.throws(
    () =>
      gate.inspectContainerMarkers({
        nodeName: "#text",
        nodeType: domContainer.TEXT_NODE,
        ownerDocument: createDocument("invalid-parser")
      }),
    {
      code: "FAST_REACT_DOM_INVALID_CONTAINER"
    }
  );

  assert.throws(
    () =>
      hydrationGate.createHydrationBoundaryGate({
        markerOracle: {
          ...oracle,
          conformanceClaims: {
            ...oracle.conformanceClaims,
            compatibilityClaimed: true
          }
        }
      }),
    {
      code: "FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH"
    }
  );

  assert.throws(
    () =>
      hydrationGate.createHydrationBoundaryGate({
        markerOracle: {
          ...oracle,
          markerContracts: oracle.markerContracts.map((contract) =>
            contract.id === "activity-start"
              ? { ...contract, commentData: "changed" }
              : contract
          )
        }
      }),
    {
      code: "FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH"
    }
  );
});

test("public hydrateRoot exports remain unsupported placeholders", () => {
  const document = createDocument("public");
  const container = createElement("DIV", document);

  assertPublicHydrateRootUnsupported(ReactDOMClient, {
    entrypoint: "react-dom/client",
    length: 0,
    name: "hydrateRoot"
  });
  assertPublicHydrateRootUnsupported(ReactDOMProfiling, {
    entrypoint: "react-dom/profiling",
    length: 3,
    name: ""
  });
  assert.deepEqual(rootMarkers.inspectContainerRootMarker(container), {
    inspectable: true,
    nullCount: 0,
    properties: [],
    propertyCount: 0,
    truthyCount: 0
  });
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);

  function assertPublicHydrateRootUnsupported(
    moduleExports,
    { entrypoint, length, name }
  ) {
    const fn = moduleExports.hydrateRoot;
    assert.equal(typeof fn, "function", entrypoint);
    assert.equal(fn.name, name, entrypoint);
    assert.equal(fn.length, length, entrypoint);
    assert.throws(
      () => fn(container, "child"),
      (error) => {
        assert.equal(error.name, "FastReactDomUnimplementedError", entrypoint);
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", entrypoint);
        assert.equal(error.entrypoint, entrypoint, entrypoint);
        assert.equal(error.exportName, "hydrateRoot", entrypoint);
        assert.equal(error.compatibilityTarget, "react-dom@19.2.6", entrypoint);
        return true;
      }
    );
  }
});

function createUnsupportedRecordScenario(label) {
  const document = createDocument(label);
  const container = createElement("DIV", document);
  container.childNodes = [
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    { data: "/$", nodeType: domContainer.COMMENT_NODE }
  ];

  const initialChildren = {
    props: {
      children: "hello"
    },
    type: "App"
  };
  const hydrationOptions = {
    identifierPrefix: "fast-",
    onHydrated() {},
    onRecoverableError() {},
    unstable_strictMode: true
  };
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle,
    recordIdPrefix: "hydration-gate"
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );

  return {
    container,
    document,
    hydrationOptions,
    initialChildren,
    record
  };
}

function createAcceptedHydrationMarkerFixture(label) {
  const document = createDocument(label);
  const container = createElement("DIV", document);
  const prefix = `${label}-`;
  container.childNodes = [
    createComment("&"),
    createComment("/&"),
    createComment("$"),
    createComment("$?"),
    createTemplate({ id: `${prefix}B:1a` }),
    createComment("$~"),
    createTemplate({ id: `${prefix}B:2b` }),
    createComment("$!"),
    createTemplate({
      "data-cstck": "component-stack",
      "data-dgst": "digest",
      "data-msg": "message",
      "data-stck": "stack"
    }),
    createComment("/$"),
    createComment("F!"),
    createComment("F"),
    createComment("html"),
    createComment("head"),
    createComment("body"),
    createTemplate({ id: `${prefix}P:3c` }),
    createTemplate({
      "data-pid": `${prefix}P:3c`,
      "data-rsi": "",
      "data-sid": `${prefix}S:4d`
    }),
    createTemplate({
      "data-bid": `${prefix}B:1a`,
      "data-rci": "",
      "data-sid": `${prefix}S:4d`
    }),
    createTemplate({
      "data-bid": `${prefix}B:1a`,
      "data-rri": "",
      "data-sid": `${prefix}S:4d`,
      "data-sty": "[\"main\"]"
    }),
    createTemplate({
      "data-bid": `${prefix}B:1a`,
      "data-cstck": "component-stack",
      "data-dgst": "digest",
      "data-msg": "message",
      "data-rxi": "",
      "data-stck": "stack"
    })
  ];
  for (const node of container.childNodes) {
    if (node.attributes) {
      Object.freeze(node.attributes);
    }
    Object.freeze(node);
  }
  Object.freeze(container.childNodes);
  Object.freeze(container);

  return {
    container,
    document,
    contractIds: oracle.markerContracts.map((contract) => contract.id)
  };
}

function createComment(data) {
  return {
    data,
    nodeType: domContainer.COMMENT_NODE
  };
}

function createTemplate(attributes) {
  return {
    attributes,
    childNodes: [],
    nodeName: "TEMPLATE",
    nodeType: domContainer.ELEMENT_NODE,
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name)
        ? attributes[name]
        : null;
    }
  };
}

function createDocument(label) {
  const document = createEventTarget({
    label,
    nodeName: "#document",
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createEventTarget({ label: `${label}-window` });
  return document;
}

function createElement(nodeName, ownerDocument) {
  return createEventTarget({
    childNodes: [],
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument
  });
}

function createEventTarget(fields) {
  return {
    ...fields,
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
    }
  };
}
