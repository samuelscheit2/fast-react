import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node children-helper-probe-runner.mjs <package> <scenario>"
  );
}

const consoleCalls = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  consoleCalls.push({
    method: "error",
    args: args.map(describeValue)
  });
};
console.warn = (...args) => {
  consoleCalls.push({
    method: "warn",
    args: args.map(describeValue)
  });
};

function main() {
  try {
    const scenario = scenarios[scenarioId];
    if (!scenario) {
      throw new Error(`Unknown children-helper scenario: ${scenarioId}`);
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

function loadReact(target) {
  return require(target);
}

const scenarios = {
  "children-helper-export-shape": (target) => {
    const React = loadReact(target);
    const childrenDescriptor = Object.getOwnPropertyDescriptor(
      React,
      "Children"
    );

    return {
      reactHasChildren: Object.hasOwn(React, "Children"),
      reactKeysIncludeChildren: Object.keys(React).includes("Children"),
      reactChildrenDescriptor: childrenDescriptor
        ? describeDescriptor("Children", childrenDescriptor)
        : null,
      childrenObject: describeObject(React.Children),
      helperFunctionObjects: Object.fromEntries(
        Object.keys(React.Children).map((key) => [
          key,
          describeObject(React.Children[key])
        ])
      )
    };
  },

  "children-nullish-and-empty-values": (target) => {
    const React = loadReact(target);

    return {
      nullChild: exerciseChild(React, null),
      undefinedChild: exerciseChild(React, undefined),
      falseChild: exerciseChild(React, false),
      trueChild: exerciseChild(React, true),
      symbolChild: exerciseChild(React, Symbol("child-symbol")),
      functionChild: exerciseChild(React, function childFunction() {})
    };
  },

  "children-scalar-values": (target) => {
    const React = loadReact(target);

    return {
      stringChild: exerciseChild(React, "text-child"),
      numberChild: exerciseChild(React, 42),
      bigintChild: exerciseChild(React, 9007199254740993n)
    };
  },

  "children-array-and-nested-traversal": (target) => {
    const React = loadReact(target);
    const thisArg = { marker: "thisArg" };
    const nested = [
      "first",
      [false, , "last"],
      null,
      [["deep"]]
    ];
    const forEachCalls = [];
    const forEachResult = React.Children.forEach(
      nested,
      function (child, index) {
        forEachCalls.push({
          child: describeChildValue(child),
          index,
          thisMatchesContext: this === thisArg
        });
        return "ignored-return";
      },
      thisArg
    );

    return {
      nested: exerciseChild(React, nested),
      forEachResult: describeValue(forEachResult),
      forEachCalls
    };
  },

  "children-element-and-fragment-leaves": (target) => {
    const React = loadReact(target);
    const element = React.createElement("span", {
      key: "leaf",
      id: "leaf"
    });
    const fragment = React.createElement(
      React.Fragment,
      null,
      React.createElement("i", null, "inside-fragment")
    );
    const portal = {
      $$typeof: Symbol.for("react.portal"),
      key: "portal-key",
      children: "portal-child"
    };

    const mapped = React.Children.map([element, fragment], (child) => child);
    const portalToArray = React.Children.toArray([portal]);
    const portalMapped = React.Children.map([portal], (child) => child);

    return {
      element: describeElement(element),
      fragment: describeElement(fragment),
      portal: describePlainObject(portal),
      count: captureOperation("Children.count([element, fragment])", () =>
        describeValue(React.Children.count([element, fragment]))
      ),
      toArray: captureOperation("Children.toArray([element, fragment])", () =>
        describeChildArray(React.Children.toArray([element, fragment]))
      ),
      mapSame: describeChildArray(mapped),
      mappedElementIdentity: mapped.map((child) => ({
        key: child.key,
        sameAsElement: child === element,
        sameAsFragment: child === fragment
      })),
      portalCount: captureOperation("Children.count([portal])", () =>
        describeValue(React.Children.count([portal]))
      ),
      portalToArray: describeChildArray(portalToArray),
      portalToArraySameIdentity: portalToArray[0] === portal,
      portalMap: describeChildArray(portalMapped),
      portalMapSameIdentity: portalMapped[0] === portal,
      onlyElement: captureOperation("Children.only(element)", () =>
        describeElement(React.Children.only(element))
      ),
      onlyFragment: captureOperation("Children.only(fragment)", () =>
        describeElement(React.Children.only(fragment))
      ),
      onlyArray: captureOperation("Children.only([element])", () =>
        describeChildValue(React.Children.only([element]))
      ),
      onlyNull: captureOperation("Children.only(null)", () =>
        describeChildValue(React.Children.only(null))
      )
    };
  },

  "children-map-return-handling-and-keys": (target) => {
    const React = loadReact(target);
    const input = [
      React.createElement("span", { key: "orig" }),
      React.createElement("span", null),
      "text",
      false
    ];

    return {
      input: describeChildArray(input),
      mapToNull: captureOperation("map to null", () =>
        describeChildArray(React.Children.map(input, () => null))
      ),
      mapToUndefined: captureOperation("map to undefined", () =>
        describeChildArray(React.Children.map(input, () => undefined))
      ),
      mapToFalse: captureOperation("map to false", () =>
        describeChildArray(React.Children.map(input, () => false))
      ),
      mapToSameElement: captureOperation("map to same child", () =>
        describeChildArray(React.Children.map(input, (child) => child))
      ),
      mapToNewElements: captureOperation("map to new keyed elements", () =>
        describeChildArray(
          React.Children.map(input, (_child, index) =>
            React.createElement("b", { key: `mapped/key${index}` })
          )
        )
      ),
      mapToArrays: captureOperation("map to arrays", () =>
        describeChildArray(
          React.Children.map(input.slice(0, 1), () => [
            React.createElement("i", { key: "inner/key" }),
            React.createElement("i", null)
          ])
        )
      )
    };
  },

  "children-to-array-key-synthesis": (target) => {
    const React = loadReact(target);
    const nested = [
      React.createElement("span", { key: "a:b=c" }),
      [React.createElement("span", null), "text"],
      false,
      [[React.createElement("span", { key: "slash/key" })]]
    ];
    const unkeyedArray = [React.createElement("em", null)];
    const unkeyedResult = React.Children.toArray(unkeyedArray);

    return {
      nestedInput: describeChildArray(nested),
      nestedToArray: captureOperation("Children.toArray(nested)", () =>
        describeChildArray(React.Children.toArray(nested))
      ),
      unkeyedToArray: describeChildArray(unkeyedResult),
      unkeyedResultIdentity: unkeyedResult[0] === unkeyedArray[0]
    };
  },

  "children-iterable-values": (target) => {
    const React = loadReact(target);
    const set = new Set([
      React.createElement("span", { key: "set-key" }),
      "plain",
      false
    ]);
    const generator = function* childrenGenerator() {
      yield React.createElement("strong", null);
      yield ["nested-generator"];
    };
    const map = new Map([
      ["first-key", React.createElement("span", { key: "map-key" })],
      ["second-key", "map-value"]
    ]);

    return {
      setToArray: captureOperation("Children.toArray(set)", () =>
        describeChildArray(React.Children.toArray(set))
      ),
      generatorToArray: captureOperation("Children.toArray(generator)", () =>
        describeChildArray(React.Children.toArray(generator()))
      ),
      mapToArray: captureOperation("Children.toArray(map)", () =>
        describeChildArray(React.Children.toArray(map))
      )
    };
  },

  "children-thenable-values": (target) => {
    const React = loadReact(target);
    const fulfilled = {
      status: "fulfilled",
      value: [React.createElement("span", { key: "fulfilled" }), "ready"],
      then: function then() {}
    };
    const syncFulfilled = {
      then: function then(resolve) {
        resolve([React.createElement("span", { key: "sync" }), "sync-ready"]);
      }
    };
    const rejected = {
      status: "rejected",
      reason: new Error("rejected child"),
      then: function then() {}
    };
    const pending = {
      then: function then() {}
    };

    return {
      fulfilledToArray: captureOperation("fulfilled thenable toArray", () =>
        describeChildArray(React.Children.toArray(fulfilled))
      ),
      fulfilledAfter: describePlainObject(fulfilled),
      syncFulfilledToArray: captureOperation(
        "sync fulfilled thenable toArray",
        () => describeChildArray(React.Children.toArray(syncFulfilled))
      ),
      syncFulfilledAfter: describePlainObject(syncFulfilled),
      rejectedToArray: captureOperation("rejected thenable toArray", () =>
        describeChildArray(React.Children.toArray(rejected))
      ),
      pendingToArray: captureOperation("pending thenable toArray", () =>
        describeChildArray(React.Children.toArray(pending))
      ),
      pendingAfter: describePlainObject(pending)
    };
  },

  "children-error-behavior": (target) => {
    const React = loadReact(target);
    const iteratorThrows = {
      [Symbol.iterator]() {
        return {
          next() {
            throw new Error("iterator exploded");
          }
        };
      }
    };

    return {
      plainObject: captureOperation("Children.count(plain object)", () =>
        describeValue(React.Children.count({ a: 1, b: 2 }))
      ),
      objectWithToString: captureOperation(
        "Children.count(object with custom toString)",
        () =>
          describeValue(
            React.Children.count({
              toString() {
                return "custom child string";
              }
            })
          )
      ),
      mapMissingCallback: captureOperation(
        "Children.map(['x'], undefined)",
        () => describeChildArray(React.Children.map(["x"], undefined))
      ),
      callbackThrows: captureOperation("Children.map callback throws", () =>
        describeChildArray(
          React.Children.map(["x"], () => {
            throw new Error("callback exploded");
          })
        )
      ),
      iteratorThrows: captureOperation("Children.toArray(iterator throws)", () =>
        describeChildArray(React.Children.toArray(iteratorThrows))
      ),
      onlyString: captureOperation("Children.only('x')", () =>
        describeChildValue(React.Children.only("x"))
      )
    };
  }
};

function exerciseChild(React, child) {
  const mapCalls = [];
  const forEachCalls = [];

  return {
    count: captureOperation("Children.count", () =>
      describeValue(React.Children.count(child))
    ),
    toArray: captureOperation("Children.toArray", () =>
      describeChildArray(React.Children.toArray(child))
    ),
    mapIdentity: captureOperation("Children.map identity", () =>
      describeMaybeChildArray(
        React.Children.map(child, (value, index) => {
          mapCalls.push({
            child: describeChildValue(value),
            index
          });
          return value;
        })
      )
    ),
    mapCalls,
    forEach: captureOperation("Children.forEach", () =>
      describeValue(
        React.Children.forEach(child, (value, index) => {
          forEachCalls.push({
            child: describeChildValue(value),
            index
          });
        })
      )
    ),
    forEachCalls
  };
}

function captureOperation(label, fn) {
  try {
    return {
      label,
      status: "ok",
      value: fn()
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      error: describeThrown(error)
    };
  }
}

function describeMaybeChildArray(value) {
  if (Array.isArray(value)) {
    return describeChildArray(value);
  }

  return describeChildValue(value);
}

function describeChildArray(value) {
  if (!Array.isArray(value)) {
    return describeChildValue(value);
  }

  return {
    summary: describeValue(value),
    length: value.length,
    items: value.map(describeChildValue)
  };
}

function describeChildValue(value) {
  if (isReactElement(value)) {
    return describeElement(value);
  }

  if (Array.isArray(value)) {
    return describeChildArray(value);
  }

  return describeValue(value);
}

function isReactElement(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    value.$$typeof === Symbol.for("react.transitional.element")
  );
}

function describeElement(element) {
  return {
    summary: describeValue(element),
    ownKeys: describeOwnKeys(element),
    objectKeys: Object.keys(element),
    key: describeValue(element.key),
    type: describeElementType(element.type),
    ref: describeElementRef(element),
    props: describeProps(element.props),
    storeValidated: element._store
      ? describeValue(element._store.validated)
      : { type: "missing" },
    state: {
      frozen: Object.isFrozen(element),
      sealed: Object.isSealed(element),
      extensible: Object.isExtensible(element)
    }
  };
}

function describeElementRef(element) {
  const descriptor = Object.getOwnPropertyDescriptor(element, "ref");
  if (!descriptor) {
    return {
      type: "absent"
    };
  }

  return describeDescriptor("ref", descriptor);
}

function describeElementType(type) {
  if (typeof type === "symbol") {
    return describeValue(type);
  }

  return describeValue(type);
}

function describeProps(props) {
  if (!props || typeof props !== "object") {
    return describeValue(props);
  }

  return {
    summary: describeValue(props),
    objectKeys: Object.keys(props),
    ownKeys: describeOwnKeys(props),
    id: Object.hasOwn(props, "id") ? describeValue(props.id) : { type: "absent" },
    children: Object.hasOwn(props, "children")
      ? describeChildValue(props.children)
      : { type: "absent" },
    state: {
      frozen: Object.isFrozen(props),
      sealed: Object.isSealed(props),
      extensible: Object.isExtensible(props)
    }
  };
}

function describeObject(value) {
  const summary = describeValue(value);
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    return {
      summary,
      objectKeys: null,
      ownKeys: null,
      descriptors: null,
      state: null
    };
  }

  return {
    summary,
    objectKeys: Object.keys(value),
    ownKeys: describeOwnKeys(value),
    descriptors: describeDescriptors(value),
    state: {
      frozen: Object.isFrozen(value),
      sealed: Object.isSealed(value),
      extensible: Object.isExtensible(value),
      objectTag: Object.prototype.toString.call(value),
      prototype: describePrototype(value)
    }
  };
}

function describePlainObject(value) {
  if (!value || typeof value !== "object") {
    return describeValue(value);
  }

  return {
    summary: describeValue(value),
    objectKeys: Object.keys(value),
    ownKeys: describeOwnKeys(value),
    properties: Object.fromEntries(
      Object.keys(value).map((key) => [key, describeValue(value[key])])
    )
  };
}

function describeOwnKeys(value) {
  return Reflect.ownKeys(value).map(describePropertyKey);
}

function describeDescriptors(value) {
  return Reflect.ownKeys(value).map((key) =>
    describeDescriptor(key, Object.getOwnPropertyDescriptor(value, key))
  );
}

function describeDescriptor(key, descriptor) {
  const described = {
    key: describePropertyKey(key),
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable
  };

  if ("value" in descriptor) {
    described.kind = "data";
    described.writable = descriptor.writable;
    described.value = describeValue(descriptor.value);
  } else {
    described.kind = "accessor";
    described.get = describeAccessor(descriptor.get);
    described.set = describeAccessor(descriptor.set);
  }

  return described;
}

function describeAccessor(accessor) {
  if (typeof accessor !== "function") {
    return {
      present: false
    };
  }

  return {
    present: true,
    name: accessor.name,
    length: accessor.length,
    isReactWarning: accessor.isReactWarning === true
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

function describeValue(value) {
  const valueType = typeof value;

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

  if (valueType === "string" || valueType === "boolean") {
    return {
      type: valueType,
      value
    };
  }

  if (valueType === "number") {
    return {
      type: "number",
      value: Number.isFinite(value) ? value : String(value)
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
      isReactWarning: value.isReactWarning === true
    };
  }

  const summary = {
    type: "object",
    objectTag: Object.prototype.toString.call(value),
    prototype: describePrototype(value)
  };

  if (value instanceof Error) {
    summary.error = {
      name: value.name,
      message: value.message
    };
  }

  if (Array.isArray(value)) {
    summary.arrayLength = value.length;
  }

  if (isReactElement(value)) {
    summary.reactElement = true;
  }

  return summary;
}

function describePrototype(value) {
  const prototype = Object.getPrototypeOf(value);
  if (prototype === null) {
    return "null";
  }
  if (prototype === Object.prototype) {
    return "Object.prototype";
  }
  if (prototype === Array.prototype) {
    return "Array.prototype";
  }
  if (prototype === Function.prototype) {
    return "Function.prototype";
  }
  if (prototype === Error.prototype) {
    return "Error.prototype";
  }
  if (prototype?.constructor?.name) {
    return `${prototype.constructor.name}.prototype`;
  }
  return Object.prototype.toString.call(prototype);
}

function describeThrown(error) {
  return {
    thrownValue: describeValue(error),
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    entrypoint: error?.entrypoint ?? null,
    exportName: error?.exportName ?? null,
    objectKeys:
      error && typeof error === "object" ? Object.keys(error) : null
  };
}

main();
