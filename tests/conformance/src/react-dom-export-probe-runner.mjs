import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const action = process.argv[2];
const specifier = process.argv[3];

if (!action || !specifier) {
  process.stderr.write(
    "Usage: node react-dom-export-probe-runner.mjs <runtime|resolution> <specifier>\n"
  );
  process.exit(1);
}

if (action === "runtime") {
  const result = {
    specifier,
    requireResolve: null,
    require: null,
    dynamicImport: null,
    importInterop: null
  };

  let requiredModule = null;
  let importedModule = null;

  try {
    result.requireResolve = {
      status: "ok",
      path: require.resolve(specifier)
    };
  } catch (error) {
    result.requireResolve = describeThrown(error);
  }

  try {
    requiredModule = require(specifier);
    result.require = describeModule(requiredModule);
  } catch (error) {
    result.require = describeThrown(error);
  }

  try {
    importedModule = await import(specifier);
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

  process.stdout.write(JSON.stringify(result));
  process.exit(0);
}

if (action === "resolution") {
  const result = {
    specifier,
    requireResolve: null,
    importMetaResolve: null
  };

  try {
    result.requireResolve = {
      status: "ok",
      path: require.resolve(specifier)
    };
  } catch (error) {
    result.requireResolve = describeThrown(error);
  }

  try {
    result.importMetaResolve = {
      status: "ok",
      url: await import.meta.resolve(specifier)
    };
  } catch (error) {
    result.importMetaResolve = describeThrown(error);
  }

  process.stdout.write(JSON.stringify(result));
  process.exit(0);
}

process.stderr.write(`Unsupported probe action: ${JSON.stringify(action)}\n`);
process.exit(1);

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
