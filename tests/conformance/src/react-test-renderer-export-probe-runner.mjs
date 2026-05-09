import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const action = process.argv[2];
const specifier = process.argv[3];
const options = parseOptions(process.argv[4]);

if (!action || !specifier) {
  process.stderr.write(
    "Usage: node react-test-renderer-export-probe-runner.mjs <runtime|resolution|create-warning|shallow-invocation> <specifier> [json-options]\n"
  );
  process.exit(1);
}

if (action === "runtime") {
  await runRuntimeProbe(specifier);
} else if (action === "resolution") {
  await runResolutionProbe(specifier);
} else if (action === "create-warning") {
  await runCreateWarningProbe(specifier, options);
} else if (action === "shallow-invocation") {
  runShallowInvocationProbe(specifier);
} else {
  process.stderr.write(`Unsupported probe action: ${JSON.stringify(action)}\n`);
  process.exit(1);
}

async function runRuntimeProbe(currentSpecifier) {
  const result = {
    specifier: currentSpecifier,
    requireResolve: null,
    require: null,
    dynamicImport: null,
    importInterop: null,
    requireCacheFiles: null,
    finalCacheFiles: null
  };

  let requiredModule = null;
  let importedModule = null;

  try {
    result.requireResolve = {
      status: "ok",
      path: require.resolve(currentSpecifier)
    };
  } catch (error) {
    result.requireResolve = describeThrown(error);
  }

  const beforeRequireCache = cacheFiles();
  try {
    requiredModule = require(currentSpecifier);
    result.require = describeModule(requiredModule);
  } catch (error) {
    result.require = describeThrown(error);
  }
  result.requireCacheFiles = cacheFiles().filter(
    (file) => !beforeRequireCache.includes(file)
  );

  try {
    importedModule = await import(currentSpecifier);
    result.dynamicImport = describeModule(importedModule);
  } catch (error) {
    result.dynamicImport = describeThrown(error);
  }

  if (result.require.status === "ok" && result.dynamicImport.status === "ok") {
    result.importInterop = describeImportInterop({
      importedModule,
      requiredModule
    });
  }

  result.finalCacheFiles = cacheFiles();
  process.stdout.write(JSON.stringify(result));
}

async function runResolutionProbe(currentSpecifier) {
  const result = {
    specifier: currentSpecifier,
    requireResolve: null,
    importMetaResolve: null
  };

  try {
    result.requireResolve = {
      status: "ok",
      path: require.resolve(currentSpecifier)
    };
  } catch (error) {
    result.requireResolve = describeThrown(error);
  }

  try {
    result.importMetaResolve = {
      status: "ok",
      url: await import.meta.resolve(currentSpecifier)
    };
  } catch (error) {
    result.importMetaResolve = describeThrown(error);
  }

  process.stdout.write(JSON.stringify(result));
}

async function runCreateWarningProbe(currentSpecifier, currentOptions) {
  if (currentOptions.reactNativeTestEnvironment === true) {
    global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
  } else {
    delete global.IS_REACT_NATIVE_TEST_ENVIRONMENT;
  }

  const warnings = [];
  const originalError = console.error;
  console.error = (...args) => {
    warnings.push(args.map((arg) => String(arg)));
  };

  const result = {
    specifier: currentSpecifier,
    reactNativeTestEnvironment:
      global.IS_REACT_NATIVE_TEST_ENVIRONMENT === true,
    warnings,
    require: null,
    create: null
  };

  try {
    const React = require("react");
    const TestRenderer = require(currentSpecifier);
    result.require = describeModule(TestRenderer);
    const renderer = TestRenderer.create(React.createElement("div", null));
    result.create = {
      status: "ok",
      renderer: describeModule(renderer),
      rootDescriptor: describeDescriptor(
        Object.getOwnPropertyDescriptor(renderer, "root"),
        0
      )
    };
  } catch (error) {
    result.create = describeThrown(error);
  } finally {
    console.error = originalError;
  }

  process.stdout.write(JSON.stringify(result));
}

function runShallowInvocationProbe(currentSpecifier) {
  const result = {
    specifier: currentSpecifier,
    requireResolve: null,
    require: null,
    callWithoutNew: null,
    constructWithNew: null
  };

  let ShallowRenderer = null;

  try {
    result.requireResolve = {
      status: "ok",
      path: require.resolve(currentSpecifier)
    };
  } catch (error) {
    result.requireResolve = describeThrown(error);
  }

  try {
    ShallowRenderer = require(currentSpecifier);
    result.require = describeModule(ShallowRenderer);
  } catch (error) {
    result.require = describeThrown(error);
  }

  if (typeof ShallowRenderer === "function") {
    try {
      result.callWithoutNew = {
        status: "ok",
        value: describeValue(ShallowRenderer(), 0)
      };
    } catch (error) {
      result.callWithoutNew = describeThrown(error);
    }

    try {
      result.constructWithNew = {
        status: "ok",
        value: describeValue(new ShallowRenderer(), 0)
      };
    } catch (error) {
      result.constructWithNew = describeThrown(error);
    }
  }

  process.stdout.write(JSON.stringify(result));
}

function parseOptions(raw) {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    process.stderr.write(`Invalid JSON options: ${error.message}\n`);
    process.exit(1);
  }
}

function cacheFiles() {
  return Object.keys(require.cache).sort();
}

function describeThrown(error) {
  return {
    status: "throws",
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error)
  };
}

function describeModule(value) {
  const ownKeys = Reflect.ownKeys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);

  return {
    status: "ok",
    objectTag: Object.prototype.toString.call(value),
    isExtensible: Object.isExtensible(value),
    exportKeys: Object.keys(value),
    ownPropertyNames: Object.getOwnPropertyNames(value),
    ownSymbolKeys: Object.getOwnPropertySymbols(value).map(describePropertyKey),
    ownKeys: ownKeys.map(describePropertyKey),
    descriptors: ownKeys.map((key) => ({
      key: describePropertyKey(key),
      descriptor: describeDescriptor(descriptors[key], 0)
    }))
  };
}

function describeImportInterop({ importedModule, requiredModule }) {
  const requireKeys = Object.keys(requiredModule);
  return {
    defaultEqualsRequire: importedModule.default === requiredModule,
    moduleExportsEqualsRequire:
      importedModule["module.exports"] === requiredModule,
    namedExportEqualsRequireValue: requireKeys.map((key) => ({
      key,
      equal: importedModule[key] === requiredModule[key]
    }))
  };
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
      value: describeValue(descriptor.value, depth)
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
    return {
      type: "function",
      name: value.name,
      length: value.length,
      isAsync: value.constructor?.name === "AsyncFunction",
      ownPropertyNames: Object.getOwnPropertyNames(value)
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
      description: key.description ?? null,
      stringValue: String(key)
    };
  }

  return {
    type: "string",
    value: key
  };
}
