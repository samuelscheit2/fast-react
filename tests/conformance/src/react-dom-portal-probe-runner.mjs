import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node react-dom-portal-probe-runner.mjs <package> <scenario>"
  );
}

const consoleCalls = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  consoleCalls.push({
    method: "error",
    args: args.map((arg) => describeValue(arg))
  });
};
console.warn = (...args) => {
  consoleCalls.push({
    method: "warn",
    args: args.map((arg) => describeValue(arg))
  });
};

function main() {
  try {
    const scenario = scenarios[scenarioId];
    if (!scenario) {
      throw new Error(`Unknown react-dom-portal scenario: ${scenarioId}`);
    }

    const result = captureOperation(scenarioId, () => scenario(targetPackage));
    process.stdout.write(
      JSON.stringify({
        targetPackage,
        scenarioId,
        result,
        consoleCalls
      })
    );
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
}

function loadModule(specifier) {
  return require(specifier);
}

const scenarios = {
  "portal-export-descriptors": (target) => ({
    root: captureOperation(`require(${target})`, () =>
      describePortalEntrypoint(loadModule(target))
    ),
    profiling: captureOperation(`require(${target}/profiling)`, () =>
      describePortalEntrypoint(loadModule(`${target}/profiling`))
    ),
    client: captureOperation(`require(${target}/client)`, () =>
      describePortalEntrypoint(loadModule(`${target}/client`))
    )
  }),

  "portal-valid-containers": (target) =>
    withCreatePortal(target, ({ createPortal }) => {
      const containers = createContainerCases();
      return {
        element: capturePortalOperation({
          createPortal,
          container: containers.element,
          key: "element-key",
          label: "createPortal(child, element, key)"
        }),
        document: capturePortalOperation({
          createPortal,
          container: containers.document,
          key: "document-key",
          label: "createPortal(child, document, key)"
        }),
        documentFragment: capturePortalOperation({
          createPortal,
          container: containers.documentFragment,
          key: "fragment-key",
          label: "createPortal(child, documentFragment, key)"
        })
      };
    }),

  "portal-invalid-containers": (target) =>
    withCreatePortal(target, ({ createPortal }) => {
      const invalidContainers = createInvalidContainerCases();
      return Object.fromEntries(
        invalidContainers.map((containerCase) => [
          containerCase.id,
          captureOperation(containerCase.label, () =>
            describePortal(
              createPortal("invalid-child", containerCase.value, "invalid-key"),
              {
                expectedChildren: "invalid-child",
                expectedContainer: containerCase.value
              }
            )
          )
        ])
      );
    }),

  "portal-key-handling": (target) =>
    withCreatePortal(target, ({ createPortal }) => {
      const container = createContainerCases().element;
      let objectKeyToStringCalls = 0;
      const objectKey = {
        toString() {
          objectKeyToStringCalls += 1;
          return "object-key";
        }
      };
      const keyCases = [
        {
          id: "omitted",
          label: "createPortal(child, container)",
          invoke: () => createPortal("key-child", container)
        },
        {
          id: "undefined",
          label: "createPortal(child, container, undefined)",
          invoke: () => createPortal("key-child", container, undefined)
        },
        {
          id: "null",
          label: "createPortal(child, container, null)",
          invoke: () => createPortal("key-child", container, null)
        },
        {
          id: "emptyString",
          label: "createPortal(child, container, empty string)",
          invoke: () => createPortal("key-child", container, "")
        },
        {
          id: "string",
          label: "createPortal(child, container, string)",
          invoke: () => createPortal("key-child", container, "portal-key")
        },
        {
          id: "number",
          label: "createPortal(child, container, number)",
          invoke: () => createPortal("key-child", container, 12)
        },
        {
          id: "booleanTrue",
          label: "createPortal(child, container, true)",
          invoke: () => createPortal("key-child", container, true)
        },
        {
          id: "booleanFalse",
          label: "createPortal(child, container, false)",
          invoke: () => createPortal("key-child", container, false)
        },
        {
          id: "bigint",
          label: "createPortal(child, container, bigint)",
          invoke: () => createPortal("key-child", container, 10n)
        },
        {
          id: "objectToString",
          label: "createPortal(child, container, object key)",
          invoke: () => createPortal("key-child", container, objectKey)
        },
        {
          id: "symbol",
          label: "createPortal(child, container, Symbol key)",
          invoke: () => createPortal("key-child", container, Symbol("portal"))
        }
      ];

      const operations = Object.fromEntries(
        keyCases.map((keyCase) => [
          keyCase.id,
          captureOperation(keyCase.label, () =>
            describePortal(keyCase.invoke(), {
              expectedChildren: "key-child",
              expectedContainer: container
            })
          )
        ])
      );

      return {
        operations,
        objectKeyToStringCalls
      };
    }),

  "portal-object-shape": (target) =>
    withCreatePortal(target, ({ createPortal }) => {
      const React = loadModule("react");
      const container = createContainerCases().element;
      const child = {
        marker: "child-object"
      };
      const portal = createPortal(child, container, "shape-key");
      const before = describePortal(portal, {
        expectedChildren: child,
        expectedContainer: container
      });

      const assignKey = captureOperation("portal.key = mutated-key", () => {
        portal.key = "mutated-key";
        return describePortal(portal, {
          expectedChildren: child,
          expectedContainer: container
        });
      });
      const addExtra = captureOperation("portal.extra = extra-value", () => {
        portal.extra = "extra-value";
        return describePortal(portal, {
          expectedChildren: child,
          expectedContainer: container
        });
      });
      const deleteImplementation = captureOperation(
        "delete portal.implementation",
        () => ({
          deleted: Reflect.deleteProperty(portal, "implementation"),
          portal: describePortal(portal, {
            expectedChildren: child,
            expectedContainer: container
          })
        })
      );

      return {
        before,
        reactIsValidElement: describeValue(React.isValidElement(portal)),
        mutations: {
          assignKey,
          addExtra,
          deleteImplementation
        }
      };
    }),

  "portal-invocation-boundaries": (target) =>
    withCreatePortal(target, ({ createPortal, rootModule }) => {
      const container = createContainerCases().element;
      const receiver = {
        marker: "receiver"
      };

      return {
        exportShape: describePortalEntrypoint(rootModule),
        callNullThis: captureOperation(
          "createPortal.call(null, child, container, key)",
          () =>
            describePortal(
              createPortal.call(null, "call-child", container, "call-key"),
              {
                expectedChildren: "call-child",
                expectedContainer: container
              }
            )
        ),
        applyReceiver: captureOperation(
          "createPortal.apply(receiver, [child, container, key])",
          () =>
            describePortal(
              createPortal.apply(receiver, [
                "apply-child",
                container,
                "apply-key"
              ]),
              {
                expectedChildren: "apply-child",
                expectedContainer: container
              }
            )
        ),
        extraArgument: captureOperation(
          "createPortal(child, container, key, extra)",
          () =>
            describePortal(
              createPortal("extra-child", container, "extra-key", "ignored"),
              {
                expectedChildren: "extra-child",
                expectedContainer: container
              }
            )
        ),
        constructorInvocation: captureOperation(
          "new createPortal(child, container, key)",
          () =>
            describePortal(new createPortal("new-child", container, "new-key"), {
              expectedChildren: "new-child",
              expectedContainer: container
            })
        )
      };
    })
};

function withCreatePortal(target, callback) {
  const rootModule = loadModule(target);
  if (typeof rootModule.createPortal !== "function") {
    return {
      unavailable: true,
      exportShape: describePortalEntrypoint(rootModule),
      directCall: captureOperation("rootModule.createPortal()", () =>
        rootModule.createPortal("child", createContainerCases().element, "key")
      )
    };
  }

  return callback({
    createPortal: rootModule.createPortal,
    rootModule
  });
}

function capturePortalOperation({ container, createPortal, key, label }) {
  const child = {
    marker: label
  };
  return captureOperation(label, () =>
    describePortal(createPortal(child, container, key), {
      expectedChildren: child,
      expectedContainer: container
    })
  );
}

function createContainerCases() {
  return {
    element: {
      nodeType: 1,
      nodeName: "DIV",
      ownerDocument: null
    },
    document: {
      nodeType: 9,
      nodeName: "#document"
    },
    documentFragment: {
      nodeType: 11,
      nodeName: "#document-fragment",
      ownerDocument: null
    }
  };
}

function createInvalidContainerCases() {
  return [
    {
      id: "undefinedValue",
      label: "createPortal(child, undefined, key)",
      value: undefined
    },
    {
      id: "nullValue",
      label: "createPortal(child, null, key)",
      value: null
    },
    {
      id: "falseValue",
      label: "createPortal(child, false, key)",
      value: false
    },
    {
      id: "zeroValue",
      label: "createPortal(child, 0, key)",
      value: 0
    },
    {
      id: "stringValue",
      label: "createPortal(child, string, key)",
      value: "container"
    },
    {
      id: "plainObject",
      label: "createPortal(child, plain object, key)",
      value: {}
    },
    {
      id: "textNode",
      label: "createPortal(child, text node, key)",
      value: {
        nodeType: 3,
        nodeName: "#text"
      }
    },
    {
      id: "commentMountPoint",
      label: "createPortal(child, mount-point comment, key)",
      value: {
        nodeType: 8,
        nodeName: "#comment",
        nodeValue: " react-mount-point-unstable "
      }
    },
    {
      id: "commentOther",
      label: "createPortal(child, other comment, key)",
      value: {
        nodeType: 8,
        nodeName: "#comment",
        nodeValue: "not-a-mount-point"
      }
    }
  ];
}

function describePortalEntrypoint(moduleValue) {
  return {
    module: describeModuleShape(moduleValue),
    createPortalInModule: "createPortal" in Object(moduleValue),
    createPortalType: describeValue(moduleValue?.createPortal),
    createPortalDescriptor: describeSingleDescriptor(moduleValue, "createPortal"),
    versionDescriptor: describeSingleDescriptor(moduleValue, "version")
  };
}

function describeModuleShape(value) {
  return {
    type: typeof value,
    objectTag: Object.prototype.toString.call(value),
    isExtensible: Object.isExtensible(Object(value)),
    exportKeys: Object.keys(Object(value)),
    ownPropertyNames: Object.getOwnPropertyNames(Object(value)),
    ownSymbolKeys: Object.getOwnPropertySymbols(Object(value)).map(
      describePropertyKey
    ),
    ownKeys: Reflect.ownKeys(Object(value)).map(describePropertyKey)
  };
}

function describePortal(portal, { expectedChildren, expectedContainer }) {
  return {
    object: describeObjectShape(portal),
    brand: describeValue(portal?.$$typeof),
    selectedValues: {
      key: describeValue(portal?.key),
      children: describeValue(portal?.children),
      containerInfo: describeContainer(portal?.containerInfo),
      implementation: describeValue(portal?.implementation)
    },
    relationships: {
      childrenSameAsInput: portal?.children === expectedChildren,
      containerInfoSameAsInput: portal?.containerInfo === expectedContainer,
      implementationIsNull: portal?.implementation === null
    }
  };
}

function describeContainer(container) {
  if (container === null) {
    return {
      type: "null"
    };
  }

  if (typeof container === "undefined") {
    return {
      type: "undefined"
    };
  }

  if (typeof container !== "object") {
    return describeValue(container);
  }

  return {
    type: "object",
    objectTag: Object.prototype.toString.call(container),
    nodeType: Object.hasOwn(container, "nodeType")
      ? describeValue(container.nodeType)
      : {
          type: "absent"
        },
    nodeName: Object.hasOwn(container, "nodeName")
      ? describeValue(container.nodeName)
      : {
          type: "absent"
        },
    nodeValue: Object.hasOwn(container, "nodeValue")
      ? describeValue(container.nodeValue)
      : {
          type: "absent"
        },
    ownKeys: Reflect.ownKeys(container).map(describePropertyKey)
  };
}

function describeObjectShape(value) {
  const objectValue = Object(value);
  const ownKeys = Reflect.ownKeys(objectValue);
  const descriptors = Object.getOwnPropertyDescriptors(objectValue);

  return {
    type: typeof value,
    objectTag: Object.prototype.toString.call(value),
    isArray: Array.isArray(value),
    state: {
      extensible: Object.isExtensible(objectValue),
      sealed: Object.isSealed(objectValue),
      frozen: Object.isFrozen(objectValue)
    },
    objectKeys: Object.keys(objectValue),
    ownPropertyNames: Object.getOwnPropertyNames(objectValue),
    ownSymbolKeys: Object.getOwnPropertySymbols(objectValue).map(
      describePropertyKey
    ),
    ownKeys: ownKeys.map(describePropertyKey),
    descriptors: ownKeys.map((key) => ({
      key: describePropertyKey(key),
      descriptor: describeDescriptor(descriptors[key], 0)
    }))
  };
}

function describeSingleDescriptor(value, key) {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  return describeDescriptor(Object.getOwnPropertyDescriptor(Object(value), key), 0);
}

function describeDescriptor(descriptor, depth) {
  if (!descriptor) {
    return null;
  }

  const base = {
    kind: "value" in descriptor ? "data" : "accessor",
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable
  };

  if ("value" in descriptor) {
    return {
      ...base,
      writable: descriptor.writable,
      value: describeValue(descriptor.value, depth + 1)
    };
  }

  return {
    ...base,
    get: describeValue(descriptor.get, depth + 1),
    set: describeValue(descriptor.set, depth + 1)
  };
}

function captureOperation(label, operation) {
  try {
    return {
      label,
      status: "ok",
      value: operation()
    };
  } catch (error) {
    return {
      label,
      ...describeThrown(error)
    };
  }
}

function describeThrown(error) {
  return {
    status: "throws",
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error)
  };
}

function describeValue(value, depth = 0) {
  const valueType = typeof value;

  if (value === null) {
    return {
      type: "null"
    };
  }

  if (valueType === "undefined") {
    return {
      type: "undefined"
    };
  }

  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return {
      type: valueType,
      value
    };
  }

  if (valueType === "bigint") {
    return {
      type: "bigint",
      value: value.toString()
    };
  }

  if (valueType === "symbol") {
    return {
      type: "symbol",
      keyFor: Symbol.keyFor(value) ?? null,
      description: value.description ?? null,
      stringValue: String(value)
    };
  }

  if (valueType === "function") {
    return {
      type: "function",
      name: value.name,
      length: value.length,
      isAsync: value.constructor?.name === "AsyncFunction",
      ownPropertyNames: Object.getOwnPropertyNames(value),
      hasOwnPrototype: Object.hasOwn(value, "prototype")
    };
  }

  if (valueType === "object") {
    return describeObjectValue(value, depth);
  }

  return {
    type: valueType
  };
}

function describeObjectValue(value, depth) {
  const ownKeys = Reflect.ownKeys(value);
  const summary = {
    type: "object",
    objectTag: Object.prototype.toString.call(value),
    isArray: Array.isArray(value),
    isExtensible: Object.isExtensible(value),
    ownPropertyNames: Object.getOwnPropertyNames(value),
    ownSymbolKeys: Object.getOwnPropertySymbols(value).map(describePropertyKey),
    ownKeys: ownKeys.map(describePropertyKey)
  };

  if (depth >= 1) {
    return summary;
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  return {
    ...summary,
    descriptors: ownKeys.map((key) => ({
      key: describePropertyKey(key),
      descriptor: describeDescriptor(descriptors[key], depth + 1)
    }))
  };
}

function describePropertyKey(key) {
  if (typeof key === "symbol") {
    return {
      type: "symbol",
      keyFor: Symbol.keyFor(key) ?? null,
      description: key.description ?? null,
      stringValue: String(key)
    };
  }

  return {
    type: "string",
    value: key
  };
}

main();
