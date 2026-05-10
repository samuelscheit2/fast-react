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
      "no-dom-marker-parser",
      "no-boundary-dom-operations",
      "no-event-replay",
      "no-form-marker-claiming"
    ]
  );
  assert.deepEqual(
    first.record.oracleInfo.markerContractIds,
    oracle.markerContracts.map((contract) => contract.id)
  );

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
