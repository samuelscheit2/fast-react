import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  findReactDomPortalObservation,
  readCheckedReactDomPortalOracle
} from "../src/react-dom-portal-oracle.mjs";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const ReactDOM = require(path.join(repoRoot, "packages/react-dom/index.js"));
const ReactDOMProfiling = require(
  path.join(repoRoot, "packages/react-dom/profiling.js")
);
const React = require(path.join(repoRoot, "packages/react/index.js"));
const { invalidContainerErrorCode } = require(
  path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
);
const {
  containerMarkerPrefix,
  inspectContainerRootMarker
} = require(path.join(repoRoot, "packages/react-dom/src/client/root-markers.js"));
const {
  createPortalObject,
  createPortalRecordFromNormalizedParts,
  normalizePortalKey,
  reactDomPortalImplementation,
  unnormalizedPortalKeyErrorCode,
  unsupportedPortalImplementationErrorCode
} = require(
  path.join(repoRoot, "packages/react-dom/src/shared/create-portal.js")
);

const oracle = readCheckedReactDomPortalOracle();
const child = { marker: "child-object" };

test("Fast React createPortal export descriptors match the accepted React DOM oracle slice", () => {
  const rootExpected = scenarioValue(
    "default-node-development",
    "portal-export-descriptors"
  ).root.value.createPortalDescriptor;
  const profilingExpected = scenarioValue(
    "default-node-development",
    "portal-export-descriptors"
  ).profiling.value.createPortalDescriptor;

  assertFunctionDescriptor(ReactDOM, "createPortal", rootExpected);
  assertFunctionDescriptor(
    ReactDOMProfiling,
    "createPortal",
    profilingExpected
  );
});

test("Fast React private createPortal record mirrors core normalized portal parts and fails closed", () => {
  const container = createElement("DIV", createDocument("private-record"));
  const privateChild = {
    marker: "private-child"
  };
  const portal = createPortalRecordFromNormalizedParts(
    "core-key",
    privateChild,
    container,
    reactDomPortalImplementation
  );

  assert.deepEqual(Reflect.ownKeys(portal), [
    "$$typeof",
    "key",
    "children",
    "containerInfo",
    "implementation"
  ]);
  assert.equal(portal.$$typeof, Symbol.for("react.portal"));
  assert.equal(portal.key, "core-key");
  assert.equal(portal.children, privateChild);
  assert.equal(portal.containerInfo, container);
  assert.equal(portal.implementation, null);

  assert.equal(normalizePortalKey(undefined), null);
  assert.equal(normalizePortalKey(null), null);
  assert.equal(normalizePortalKey("already-normalized"), "already-normalized");
  assert.equal(normalizePortalKey(12), "12");

  assertFastReactPortalRecordError(
    () =>
      createPortalRecordFromNormalizedParts(
        undefined,
        privateChild,
        container,
        null
      ),
    unnormalizedPortalKeyErrorCode
  );
  assertFastReactPortalRecordError(
    () => createPortalObject(privateChild, container, { renderer: "dom" }, "key"),
    unsupportedPortalImplementationErrorCode
  );
});

test("Fast React createPortal accepts oracle-backed containers and returns portal objects", () => {
  withNodeEnv("development", () => {
    const ownerDocument = createDocument("owner");
    const cases = [
      {
        actual: createElement("DIV", ownerDocument),
        expected: scenarioValue(
          "default-node-development",
          "portal-valid-containers"
        ).element.value
      },
      {
        actual: createDocument("document"),
        expected: scenarioValue(
          "default-node-development",
          "portal-valid-containers"
        ).document.value
      },
      {
        actual: createDocumentFragment(ownerDocument),
        expected: scenarioValue(
          "default-node-development",
          "portal-valid-containers"
        ).documentFragment.value
      }
    ];

    for (const { actual, expected } of cases) {
      const portal = ReactDOM.createPortal(
        child,
        actual,
        expected.selectedValues.key.value
      );
      assertPortalMatchesOracleSlice(portal, expected, child, actual);
      assert.equal(React.isValidElement(portal), false);
    }
  });
});

test("Fast React createPortal key coercion follows accepted oracle observations", () => {
  const container = createElement("DIV", createDocument("keys"));

  withNodeEnv("development", () => {
    const expected = scenarioValue(
      "default-node-development",
      "portal-key-handling"
    );
    assertPortalKey(
      ReactDOM.createPortal(child, container),
      expected.operations.omitted.value.selectedValues.key
    );
    assertPortalKey(
      ReactDOM.createPortal(child, container, undefined),
      expected.operations.undefined.value.selectedValues.key
    );
    assertPortalKey(
      ReactDOM.createPortal(child, container, null),
      expected.operations.null.value.selectedValues.key
    );
    assertPortalKey(
      ReactDOM.createPortal(child, container, ""),
      expected.operations.emptyString.value.selectedValues.key
    );
    assertPortalKey(
      ReactDOM.createPortal(child, container, "portal-key"),
      expected.operations.string.value.selectedValues.key
    );
    assertPortalKey(
      ReactDOM.createPortal(child, container, 12),
      expected.operations.number.value.selectedValues.key
    );
    assertPortalKey(
      ReactDOM.createPortal(child, container, true),
      expected.operations.booleanTrue.value.selectedValues.key
    );
    assertPortalKey(
      ReactDOM.createPortal(child, container, false),
      expected.operations.booleanFalse.value.selectedValues.key
    );
    assertPortalKey(
      ReactDOM.createPortal(child, container, 10n),
      expected.operations.bigint.value.selectedValues.key
    );

    let objectKeyToStringCalls = 0;
    const objectKey = {
      toString() {
        objectKeyToStringCalls += 1;
        return "object-key";
      }
    };
    assertPortalKey(
      ReactDOM.createPortal(child, container, objectKey),
      expected.operations.objectToString.value.selectedValues.key
    );
    assert.equal(objectKeyToStringCalls, expected.objectKeyToStringCalls);

    const symbolResult = captureConsoleError(() =>
      ReactDOM.createPortal(child, container, Symbol("portal-key"))
    );
    assert.equal(symbolResult.status, "throws");
    assert.equal(symbolResult.error.name, expected.operations.symbol.name);
    assert.equal(symbolResult.error.message, expected.operations.symbol.message);
    assert.deepEqual(
      symbolResult.consoleCalls,
      observation("default-node-development", "portal-key-handling").result
        .consoleCalls.map((call) => ({
          method: call.method,
          args: call.args.map(serializedValueToRawValue)
        }))
    );
  });

  withNodeEnv("production", () => {
    const expected = scenarioValue(
      "default-node-production",
      "portal-key-handling"
    );
    let objectKeyToStringCalls = 0;
    const objectKey = {
      toString() {
        objectKeyToStringCalls += 1;
        return "object-key";
      }
    };
    assertPortalKey(
      ReactDOM.createPortal(child, container, objectKey),
      expected.operations.objectToString.value.selectedValues.key
    );
    assert.equal(objectKeyToStringCalls, expected.objectKeyToStringCalls);

    const symbolResult = captureConsoleError(() =>
      ReactDOM.createPortal(child, container, Symbol("portal-key"))
    );
    assert.equal(symbolResult.status, "throws");
    assert.equal(symbolResult.error.name, expected.operations.symbol.name);
    assert.equal(symbolResult.error.message, expected.operations.symbol.message);
    assert.deepEqual(symbolResult.consoleCalls, []);
  });
});

test("Fast React createPortal preserves oracle object mutability and invocation boundaries", () => {
  withNodeEnv("development", () => {
    const container = createElement("DIV", createDocument("shape"));
    const shapeExpected = scenarioValue(
      "default-node-development",
      "portal-object-shape"
    );
    const portal = ReactDOM.createPortal(child, container, "shape-key");

    assertPortalMatchesOracleSlice(
      portal,
      shapeExpected.before,
      child,
      container
    );
    assert.equal(
      React.isValidElement(portal),
      shapeExpected.reactIsValidElement.value
    );

    portal.key = "mutated-key";
    assert.equal(
      portal.key,
      shapeExpected.mutations.assignKey.value.selectedValues.key.value
    );

    portal.extra = "extra-value";
    assert.deepEqual(
      Reflect.ownKeys(portal),
      keyValues(shapeExpected.mutations.addExtra.value.object.ownKeys)
    );

    assert.equal(
      Reflect.deleteProperty(portal, "implementation"),
      shapeExpected.mutations.deleteImplementation.value.deleted
    );
    assert.equal(portal.implementation, undefined);
    assert.equal(
      typeof portal.implementation,
      shapeExpected.mutations.deleteImplementation.value.portal.selectedValues
        .implementation.type
    );

    const invocationExpected = scenarioValue(
      "default-node-development",
      "portal-invocation-boundaries"
    );
    const invocationCases = [
      {
        actual: ReactDOM.createPortal.call(
          null,
          "call-child",
          container,
          "call-key"
        ),
        expected: invocationExpected.callNullThis.value,
        expectedChildren: "call-child"
      },
      {
        actual: ReactDOM.createPortal.apply(
          {
            marker: "receiver"
          },
          ["apply-child", container, "apply-key"]
        ),
        expected: invocationExpected.applyReceiver.value,
        expectedChildren: "apply-child"
      },
      {
        actual: ReactDOM.createPortal(
          "extra-child",
          container,
          "extra-key",
          "ignored"
        ),
        expected: invocationExpected.extraArgument.value,
        expectedChildren: "extra-child"
      },
      {
        actual: new ReactDOM.createPortal(
          "new-child",
          container,
          "new-key"
        ),
        expected: invocationExpected.constructorInvocation.value,
        expectedChildren: "new-child"
      }
    ];

    for (const invocationCase of invocationCases) {
      assertPortalMatchesOracleSlice(
        invocationCase.actual,
        invocationCase.expected,
        invocationCase.expectedChildren,
        container
      );
    }
  });
});

test("Fast React createPortal constructs only a local record without DOM, root, or event side effects", () => {
  const calls = [];
  const ownerDocument = createInstrumentedTarget({
    calls,
    label: "document",
    nodeName: "#document",
    nodeType: 9
  });
  const container = createInstrumentedTarget({
    calls,
    extraProperties: {
      ownerDocument
    },
    label: "container",
    nodeName: "DIV",
    nodeType: 1
  });
  const beforeOwnKeys = Reflect.ownKeys(container);

  const portal = ReactDOM.createPortal(child, container, "side-effect-key");

  assert.equal(portal.containerInfo, container);
  assert.deepEqual(calls, []);
  assert.deepEqual(Reflect.ownKeys(container), beforeOwnKeys);
  assert.equal(
    Reflect.ownKeys(container).some(
      (key) =>
        typeof key === "string" && key.startsWith(containerMarkerPrefix)
    ),
    false
  );
  assert.equal(inspectContainerRootMarker(container).propertyCount, 0);
  assert.deepEqual(calls, []);
});

test("Fast React createPortal preserves the accepted invalid-container behavior", () => {
  for (const modeId of [
    "default-node-development",
    "default-node-production"
  ]) {
    withNodeEnv(modeId === "default-node-production" ? "production" : "development", () => {
      const expected = scenarioValue(modeId, "portal-invalid-containers");
      const containers = createInvalidContainerCases();

      for (const [caseId, container] of Object.entries(containers)) {
        assert.throws(
          () => ReactDOM.createPortal(child, container, "invalid-key"),
          (error) => {
            assert.equal(error.name, expected[caseId].name, caseId);
            assert.equal(error.message, expected[caseId].message, caseId);
            assert.equal(error.code, invalidContainerErrorCode, caseId);
            return true;
          },
          caseId
        );
      }
    });
  }
});

function observation(modeId, scenarioId) {
  return findReactDomPortalObservation(oracle, modeId, scenarioId);
}

function scenarioValue(modeId, scenarioId) {
  return observation(modeId, scenarioId).result.result.value;
}

function assertFunctionDescriptor(moduleExports, key, expected) {
  const descriptor = Object.getOwnPropertyDescriptor(moduleExports, key);
  assert.deepEqual(dataDescriptorFlags(descriptor), dataDescriptorFlags(expected));
  assert.equal(typeof descriptor.value, "function");
  assert.equal(descriptor.value.name, expected.value.name);
  assert.equal(descriptor.value.length, expected.value.length);
  assert.deepEqual(
    Object.getOwnPropertyNames(descriptor.value),
    expected.value.ownPropertyNames
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(descriptor.value, "prototype"),
    expected.value.hasOwnPrototype
  );
}

function assertPortalMatchesOracleSlice(
  portal,
  expected,
  expectedChildren,
  expectedContainer
) {
  assert.equal(portal.$$typeof, Symbol.for("react.portal"));
  assert.equal(Symbol.keyFor(portal.$$typeof), expected.brand.keyFor);
  assert.equal(portal.$$typeof.description, expected.brand.description);
  assert.equal(String(portal.$$typeof), expected.brand.stringValue);

  assert.deepEqual(Object.keys(portal), expected.object.objectKeys);
  assert.deepEqual(
    Object.getOwnPropertyNames(portal),
    expected.object.ownPropertyNames
  );
  assert.deepEqual(Object.getOwnPropertySymbols(portal), []);
  assert.deepEqual(Reflect.ownKeys(portal), keyValues(expected.object.ownKeys));
  assert.equal(Object.isExtensible(portal), expected.object.state.extensible);
  assert.equal(Object.isSealed(portal), expected.object.state.sealed);
  assert.equal(Object.isFrozen(portal), expected.object.state.frozen);

  for (const entry of expected.object.descriptors) {
    const key = entry.key.value;
    assert.deepEqual(
      dataDescriptorFlags(Object.getOwnPropertyDescriptor(portal, key)),
      dataDescriptorFlags(entry.descriptor),
      key
    );
  }

  assertPortalKey(portal, expected.selectedValues.key);
  assert.equal(portal.children, expectedChildren);
  assert.equal(portal.containerInfo, expectedContainer);
  assert.equal(portal.implementation, null);
}

function assertPortalKey(portal, expected) {
  if (expected.type === "null") {
    assert.equal(portal.key, null);
    return;
  }

  assert.equal(expected.type, "string");
  assert.equal(portal.key, expected.value);
}

function assertFastReactPortalRecordError(callback, expectedCode) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, "FastReactDomPortalRecordError");
      assert.equal(error.code, expectedCode);
      return true;
    }
  );
}

function dataDescriptorFlags(descriptor) {
  assert.equal(descriptor.kind ?? "data", "data");
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}

function keyValues(keys) {
  return keys.map((key) => {
    assert.equal(key.type, "string");
    return key.value;
  });
}

function createInstrumentedTarget({
  calls,
  extraProperties = {},
  label,
  nodeName,
  nodeType
}) {
  const target = {
    ...extraProperties,
    nodeName,
    nodeType,
    addEventListener(eventName) {
      calls.push(`${label}.addEventListener:${eventName}`);
    },
    appendChild() {
      calls.push(`${label}.appendChild`);
    },
    insertBefore() {
      calls.push(`${label}.insertBefore`);
    },
    removeChild() {
      calls.push(`${label}.removeChild`);
    },
    removeEventListener(eventName) {
      calls.push(`${label}.removeEventListener:${eventName}`);
    },
    textContent: ""
  };

  return new Proxy(target, {
    defineProperty(proxyTarget, property, descriptor) {
      calls.push(`${label}.defineProperty:${String(property)}`);
      return Reflect.defineProperty(proxyTarget, property, descriptor);
    },
    deleteProperty(proxyTarget, property) {
      calls.push(`${label}.deleteProperty:${String(property)}`);
      return Reflect.deleteProperty(proxyTarget, property);
    },
    set(proxyTarget, property, value, receiver) {
      calls.push(`${label}.set:${String(property)}`);
      return Reflect.set(proxyTarget, property, value, receiver);
    }
  });
}

function createDocument(label) {
  return {
    label,
    nodeType: 9,
    nodeName: "#document"
  };
}

function createElement(nodeName, ownerDocument) {
  return {
    nodeType: 1,
    nodeName,
    ownerDocument
  };
}

function createDocumentFragment(ownerDocument) {
  return {
    nodeType: 11,
    nodeName: "#document-fragment",
    ownerDocument
  };
}

function createInvalidContainerCases() {
  const ownerDocument = createDocument("invalid-owner");
  return {
    undefinedValue: undefined,
    nullValue: null,
    falseValue: false,
    zeroValue: 0,
    stringValue: "not-a-container",
    plainObject: {},
    textNode: {
      nodeType: 3,
      nodeName: "#text",
      ownerDocument
    },
    commentMountPoint: {
      nodeType: 8,
      nodeName: "#comment",
      nodeValue: " react-mount-point-unstable ",
      ownerDocument
    },
    commentOther: {
      nodeType: 8,
      nodeName: "#comment",
      nodeValue: "not-react",
      ownerDocument
    }
  };
}

function captureConsoleError(callback) {
  const originalError = console.error;
  const consoleCalls = [];
  console.error = (...args) => {
    consoleCalls.push({
      method: "error",
      args
    });
  };

  try {
    return {
      status: "ok",
      value: callback(),
      consoleCalls
    };
  } catch (error) {
    return {
      status: "throws",
      error,
      consoleCalls
    };
  } finally {
    console.error = originalError;
  }
}

function withNodeEnv(nodeEnv, callback) {
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = nodeEnv;
    return callback();
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function serializedValueToRawValue(value) {
  if (value.type === "string") {
    return value.value;
  }

  throw new Error(`Unsupported serialized console value: ${value.type}`);
}
