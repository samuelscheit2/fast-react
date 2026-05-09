import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const scenarioId = process.argv[2];

const consoleCalls = [];
const processEvents = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const scenarios = {
  "module-export-shape": async () => {
    const React = require("react");
    const TestUtils = require("react-dom/test-utils");
    const importedTestUtils = await import("react-dom/test-utils");

    return {
      requireModule: describeModule(TestUtils, 0),
      dynamicImportModule: describeModule(importedTestUtils, 0),
      reactActExport: describeExport(React, "act"),
      testUtilsActExport: describeExport(TestUtils, "act"),
      dynamicImportActExport: describeExport(importedTestUtils, "act"),
      relationships: {
        testUtilsActEqualsReactAct: TestUtils.act === React.act,
        importedActEqualsRequiredAct: importedTestUtils.act === TestUtils.act,
        importedDefaultEqualsRequire: importedTestUtils.default === TestUtils,
        importedModuleExportsEqualsRequire:
          importedTestUtils["module.exports"] === TestUtils,
        reactActType: typeof React.act,
        testUtilsActType: typeof TestUtils.act
      }
    };
  },

  "descriptor-mutability": async () => {
    const TestUtils = require("react-dom/test-utils");
    const importedTestUtils = await import("react-dom/test-utils");
    const originalAct = TestUtils.act;
    const replacementAct = function replacementAct() {};
    const requireBefore = describeExport(TestUtils, "act");
    const importBefore = describeExport(importedTestUtils, "act");

    const importAssignment = captureOperation("importedTestUtils.act assignment", () => {
      importedTestUtils.act = replacementAct;
      return importedTestUtils.act === replacementAct;
    });
    const importDelete = captureOperation("delete importedTestUtils.act", () =>
      delete importedTestUtils.act
    );
    const requireAssignment = captureOperation("TestUtils.act assignment", () => {
      TestUtils.act = replacementAct;
      return {
        actEqualsReplacement: TestUtils.act === replacementAct,
        importedNamedActEqualsReplacement:
          importedTestUtils.act === replacementAct,
        importedDefaultActEqualsReplacement:
          importedTestUtils.default.act === replacementAct,
        importedModuleExportsActEqualsReplacement:
          importedTestUtils["module.exports"].act === replacementAct,
        requireModule: describeModule(TestUtils, 0)
      };
    });
    const requireDelete = captureOperation("delete TestUtils.act", () =>
      delete TestUtils.act
    );

    return {
      requireBefore,
      importBefore,
      importAssignment,
      importDelete,
      requireAssignment,
      requireDelete,
      requireAfterDelete: describeModule(TestUtils, 0),
      importAfterMutatingRequire: describeModule(importedTestUtils, 0),
      relationshipsAfterMutation: {
        importedNamedActEqualsOriginal: importedTestUtils.act === originalAct,
        importedDefaultEqualsRequire: importedTestUtils.default === TestUtils,
        importedModuleExportsEqualsRequire:
          importedTestUtils["module.exports"] === TestUtils,
        importedDefaultHasAct: Object.prototype.hasOwnProperty.call(
          importedTestUtils.default,
          "act"
        ),
        importedModuleExportsHasAct: Object.prototype.hasOwnProperty.call(
          importedTestUtils["module.exports"],
          "act"
        )
      }
    };
  },

  "deprecation-warning-dedup": async () => {
    const TestUtils = require("react-dom/test-utils");
    const first = captureActCall("first TestUtils.act call", (callback) =>
      TestUtils.act(callback)
    );
    const second = captureActCall("second TestUtils.act call", (callback) =>
      TestUtils.act(callback)
    );

    return {
      first,
      second
    };
  },

  "sync-callback-return": async () => {
    const React = require("react");
    const TestUtils = require("react-dom/test-utils");

    const testUtils = await invokeAndSettleAct({
      label: "react-dom/test-utils.act sync callback",
      callAct: (callback) => TestUtils.act(callback),
      callbackResult: () => "sync-return-value"
    });
    const reactAct = await invokeAndSettleAct({
      label: "React.act sync callback",
      callAct: (callback) => React.act(callback),
      callbackResult: () => "sync-return-value"
    });

    return {
      testUtils,
      reactAct,
      comparison: compareInvocationResults(testUtils, reactAct)
    };
  },

  "async-callback-return": async () => {
    const React = require("react");
    const TestUtils = require("react-dom/test-utils");

    const testUtils = await invokeAndSettleAct({
      label: "react-dom/test-utils.act async callback",
      callAct: (callback) => TestUtils.act(callback),
      callbackResult: () => Promise.resolve("async-return-value")
    });
    const reactAct = await invokeAndSettleAct({
      label: "React.act async callback",
      callAct: (callback) => React.act(callback),
      callbackResult: () => Promise.resolve("async-return-value")
    });

    return {
      testUtils,
      reactAct,
      comparison: compareInvocationResults(testUtils, reactAct)
    };
  },

  "callback-throws": async () => {
    const React = require("react");
    const TestUtils = require("react-dom/test-utils");
    const createThrownError = () => {
      const error = new Error("sync callback boom");
      error.name = "ProbeSyncError";
      return error;
    };

    const testUtils = captureActCall(
      "react-dom/test-utils.act throwing callback",
      (callback) => TestUtils.act(callback),
      () => {
        throw createThrownError();
      }
    );
    const reactAct = captureActCall(
      "React.act throwing callback",
      (callback) => React.act(callback),
      () => {
        throw createThrownError();
      }
    );

    return {
      testUtils,
      reactAct,
      comparison: compareInvocationResults(testUtils, reactAct)
    };
  },

  "async-callback-rejects": async () => {
    const React = require("react");
    const TestUtils = require("react-dom/test-utils");
    const createRejectedError = () => {
      const error = new Error("async callback boom");
      error.name = "ProbeAsyncError";
      return error;
    };

    const testUtils = await invokeAndSettleAct({
      label: "react-dom/test-utils.act rejecting callback",
      callAct: (callback) => TestUtils.act(callback),
      callbackResult: () => Promise.reject(createRejectedError())
    });
    const reactAct = await invokeAndSettleAct({
      label: "React.act rejecting callback",
      callAct: (callback) => React.act(callback),
      callbackResult: () => Promise.reject(createRejectedError())
    });

    return {
      testUtils,
      reactAct,
      comparison: compareInvocationResults(testUtils, reactAct)
    };
  },

  "thenable-classification": async () => {
    const React = require("react");
    const TestUtils = require("react-dom/test-utils");

    const testUtils = await runThenableClassificationSet({
      label: "react-dom/test-utils.act",
      callAct: (callback) => TestUtils.act(callback)
    });
    const reactAct = await runThenableClassificationSet({
      label: "React.act",
      callAct: (callback) => React.act(callback)
    });

    return {
      testUtils,
      reactAct
    };
  },

  "async-not-awaited-warning": async () => {
    const TestUtils = require("react-dom/test-utils");
    const callbackEvents = [];
    const call = captureRawOperation(
      "react-dom/test-utils.act unawaited async callback",
      () =>
        TestUtils.act(() => {
          callbackEvents.push("callback-called");
          return Promise.resolve("not-awaited-value");
        })
    );

    return {
      callbackEvents,
      call: describeRawOperation(call)
    };
  }
};

function captureActCall(label, callAct, callbackResult = () => "unused") {
  return publicActObservation(
    captureActCallWithRaw(label, callAct, callbackResult)
  );
}

function captureActCallWithRaw(label, callAct, callbackResult = () => "unused") {
  let callbackCallCount = 0;
  const rawCall = captureRawOperation(label, () =>
    callAct(() => {
      callbackCallCount++;
      return callbackResult();
    })
  );

  return {
    label,
    callbackCallCount,
    call: describeRawOperation(rawCall),
    rawCall
  };
}

async function invokeAndSettleAct({ label, callAct, callbackResult }) {
  const observation = captureActCallWithRaw(label, callAct, callbackResult);

  if (observation.call.status !== "ok") {
    return publicActObservation(observation);
  }

  if (typeof observation.rawCall.rawValue?.then !== "function") {
    return {
      ...publicActObservation(observation),
      settlement: {
        status: "not-thenable"
      }
    };
  }

  return {
    ...publicActObservation(observation),
    settlement: await settleThenable(observation.rawCall.rawValue)
  };
}

function publicActObservation(observation) {
  const { rawCall, ...publicObservation } = observation;
  return publicObservation;
}

async function runThenableClassificationSet({ label, callAct }) {
  const events = [];

  const objectThenable = await invokeAndSettleAct({
    label: `${label} object thenable`,
    callAct,
    callbackResult: () => ({
      then(resolve) {
        events.push("object-then-called");
        resolve("object-then-value");
      }
    })
  });
  const functionThenable = await invokeAndSettleAct({
    label: `${label} function thenable`,
    callAct,
    callbackResult: () => {
      function functionThenableValue() {}
      functionThenableValue.then = (resolve) => {
        events.push("function-then-called");
        resolve("function-then-value");
      };
      return functionThenableValue;
    }
  });
  const nonFunctionThen = await invokeAndSettleAct({
    label: `${label} non-function then property`,
    callAct,
    callbackResult: () => ({
      marker: "non-function-then-value",
      then: "not-a-function"
    })
  });
  const nullReturn = await invokeAndSettleAct({
    label: `${label} null return`,
    callAct,
    callbackResult: () => null
  });

  return {
    events,
    objectThenable,
    functionThenable,
    nonFunctionThen,
    nullReturn
  };
}

function captureRawOperation(label, operation) {
  try {
    return {
      label,
      status: "ok",
      rawValue: operation()
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      error
    };
  }
}

function describeRawOperation(operation) {
  if (operation.status === "throws") {
    return {
      label: operation.label,
      status: "throws",
      error: describeError(operation.error)
    };
  }

  return {
    label: operation.label,
    status: "ok",
    value: describeValue(operation.rawValue, 0)
  };
}

function captureOperation(label, operation) {
  const raw = captureRawOperation(label, operation);
  return describeRawOperation(raw);
}

function settleThenable(thenable) {
  return new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({
          status: "timeout"
        });
      }
    }, 1_000);

    try {
      thenable.then(
        (value) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            resolve({
              status: "resolved",
              value: describeValue(value, 0)
            });
          }
        },
        (error) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            resolve({
              status: "rejected",
              error: describeError(error)
            });
          }
        }
      );
    } catch (error) {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        resolve({
          status: "then-call-threw",
          error: describeError(error)
        });
      }
    }
  });
}

function compareInvocationResults(left, right) {
  return {
    callStatusesEqual: left.call.status === right.call.status,
    callbackCallCountsEqual: left.callbackCallCount === right.callbackCallCount,
    throwNamesEqual:
      left.call.error?.name === right.call.error?.name ||
      left.call.error === right.call.error,
    throwMessagesEqual:
      left.call.error?.message === right.call.error?.message ||
      left.call.error === right.call.error,
    settlementStatusesEqual:
      left.settlement?.status === right.settlement?.status ||
      left.settlement === right.settlement,
    settlementResolvedTypeEqual:
      left.settlement?.value?.type === right.settlement?.value?.type ||
      left.settlement?.value === right.settlement?.value
  };
}

async function flushAsyncNotifications() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 20));
}

function describeExport(moduleValue, key) {
  const hasOwn = Object.prototype.hasOwnProperty.call(moduleValue, key);
  const descriptor = Object.getOwnPropertyDescriptor(moduleValue, key);
  return {
    key,
    hasOwn,
    inModule: key in moduleValue,
    descriptor: describeDescriptor(descriptor, 0),
    value: hasOwn ? describeValue(moduleValue[key], 0) : null
  };
}

function describeModule(value, depth) {
  return describeObjectValue(value, depth);
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
    get: describeAccessorFunction(descriptor.get),
    set: describeAccessorFunction(descriptor.set)
  };
}

function describeAccessorFunction(value) {
  return typeof value === "function"
    ? {
        type: "function",
        name: value.name,
        length: value.length
      }
    : {
        type: typeof value
      };
}

function describeValue(value, depth) {
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
    valueType === "boolean" ||
    valueType === "bigint"
  ) {
    return {
      type: valueType,
      value: valueType === "bigint" ? value.toString() : value
    };
  }

  if (valueType === "symbol") {
    return {
      type: "symbol",
      description: value.description ?? null,
      stringValue: String(value)
    };
  }

  if (valueType === "function") {
    return describeFunctionValue(value, depth);
  }

  if (valueType === "object") {
    if (value instanceof Error) {
      return {
        type: "error",
        error: describeError(value)
      };
    }
    return describeObjectValue(value, depth);
  }

  return {
    type: valueType
  };
}

function describeFunctionValue(value, depth) {
  const summary = {
    type: "function",
    name: value.name,
    length: value.length,
    isAsync: value.constructor?.name === "AsyncFunction",
    ownPropertyNames: Object.getOwnPropertyNames(value),
    ownKeys: Reflect.ownKeys(value).map(describePropertyKey)
  };

  if (depth >= 1) {
    return summary;
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  return {
    ...summary,
    descriptors: Reflect.ownKeys(descriptors).map((key) => ({
      key: describePropertyKey(key),
      descriptor: describeDescriptor(descriptors[key], depth + 1)
    }))
  };
}

function describeObjectValue(value, depth) {
  const ownKeys = Reflect.ownKeys(value);
  const summary = {
    type: "object",
    objectTag: Object.prototype.toString.call(value),
    isArray: Array.isArray(value),
    isExtensible: Object.isExtensible(value),
    objectKeys: Object.keys(value),
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
      description: key.description ?? null,
      stringValue: String(key)
    };
  }

  return {
    type: "string",
    value: key
  };
}

function describeError(error) {
  return {
    name: error?.name ?? null,
    message: error?.message ?? String(error),
    constructorName: error?.constructor?.name ?? null,
    errors: Array.isArray(error?.errors)
      ? error.errors.map((child) => describeError(child))
      : null
  };
}

async function main() {
  if (!scenarioId) {
    throw new Error("Usage: node react-dom-test-utils-act-probe-runner.mjs <scenario>");
  }

  const onUnhandledRejection = (reason) => {
    processEvents.push({
      type: "unhandledRejection",
      reason: describeValue(reason, 0)
    });
  };
  const onRejectionHandled = () => {
    processEvents.push({
      type: "rejectionHandled"
    });
  };

  process.on("unhandledRejection", onUnhandledRejection);
  process.on("rejectionHandled", onRejectionHandled);

  console.error = (...args) => {
    consoleCalls.push({
      method: "error",
      args: args.map((arg) => describeValue(arg, 0))
    });
  };
  console.warn = (...args) => {
    consoleCalls.push({
      method: "warn",
      args: args.map((arg) => describeValue(arg, 0))
    });
  };

  try {
    const scenario = scenarios[scenarioId];
    if (!scenario) {
      throw new Error(
        `Unknown react-dom test-utils act scenario: ${scenarioId}`
      );
    }

    const result = await scenario();
    await flushAsyncNotifications();

    process.stdout.write(
      JSON.stringify({
        scenarioId,
        result,
        consoleCalls,
        processEvents
      })
    );
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    process.off("unhandledRejection", onUnhandledRejection);
    process.off("rejectionHandled", onRejectionHandled);
  }
}

await main();
