import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const scenarioId = process.argv[2];

const scenarios = {
  "root-api-descriptors": () =>
    captureOperation("describe react-dom root form API descriptors", () => {
      const ReactDOM = loadReactDom();
      const descriptors = Object.getOwnPropertyDescriptors(ReactDOM);

      return {
        module: describeModule(ReactDOM),
        selectedAPIs: Object.fromEntries(
          ["requestFormReset", "useFormState", "useFormStatus"].map((apiName) => [
            apiName,
            describeDescriptor(descriptors[apiName])
          ])
        ),
        domInternals: describeDomInternals(
          ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
        )
      };
    }),

  "request-form-reset-invalid-inputs": () => {
    const ReactDOM = loadReactDom();
    const inputs = [
      {
        id: "no-argument",
        call: () => callReactDomApi(ReactDOM, "requestFormReset", [])
      },
      {
        id: "undefined",
        call: () => callReactDomApi(ReactDOM, "requestFormReset", [undefined])
      },
      {
        id: "null",
        call: () => callReactDomApi(ReactDOM, "requestFormReset", [null])
      },
      {
        id: "plain-object",
        call: () => callReactDomApi(ReactDOM, "requestFormReset", [{}])
      },
      {
        id: "form-like-tagName",
        call: () =>
          callReactDomApi(ReactDOM, "requestFormReset", [
            { tagName: "FORM", nodeName: "FORM" }
          ])
      },
      {
        id: "non-form-like-tagName",
        call: () =>
          callReactDomApi(ReactDOM, "requestFormReset", [
            { tagName: "DIV", nodeName: "DIV" }
          ])
      }
    ];

    return inputs.map((input) => ({
      id: input.id,
      operation: captureOperation(`requestFormReset ${input.id}`, () =>
        describeValue(input.call())
      )
    }));
  },

  "hook-calls-outside-render": () => {
    const ReactDOM = loadReactDom();

    return {
      useFormStatus: captureOperation("useFormStatus outside render", () =>
        describeValue(callReactDomApi(ReactDOM, "useFormStatus", []))
      ),
      useFormState: captureOperation("useFormState outside render", () =>
        describeValue(
          callReactDomApi(ReactDOM, "useFormState", [
            function action(previousState) {
              return previousState;
            },
            "initial-state",
            "/form-action-permalink"
          ])
        )
      )
    };
  },

  "server-render-use-form-status": () =>
    captureOperation("server render useFormStatus", () => {
      const React = loadReact();
      const ReactDOM = loadReactDom();
      const ReactDOMServer = loadReactDomServer();
      let statusSnapshot = null;

      function StatusProbe() {
        const status = callReactDomApi(ReactDOM, "useFormStatus", []);
        statusSnapshot = describeFormStatus(status);
        return React.createElement(
          "output",
          { "data-pending": String(status.pending) },
          status.pending ? "pending" : "not-pending"
        );
      }

      const html = ReactDOMServer.renderToString(
        React.createElement(StatusProbe)
      );

      return {
        status: statusSnapshot,
        html: summarizeHtml(html)
      };
    }),

  "server-render-use-form-state": () =>
    captureOperation("server render useFormState", () => {
      const React = loadReact();
      const ReactDOM = loadReactDom();
      const ReactDOMServer = loadReactDomServer();
      let tupleSnapshot = null;

      function action(previousState) {
        return `${previousState}:submitted`;
      }

      function StateProbe() {
        const tuple = callReactDomApi(ReactDOM, "useFormState", [
          action,
          "initial-state",
          "/form-action-permalink"
        ]);
        tupleSnapshot = describeFormStateTuple(tuple);
        return React.createElement("output", null, String(tuple[0]));
      }

      const html = ReactDOMServer.renderToString(
        React.createElement(StateProbe)
      );

      return {
        tuple: tupleSnapshot,
        html: summarizeHtml(html)
      };
    }),

  "server-render-function-form-action-boundary": () =>
    captureOperation("server render function form action boundary", () => {
      const React = loadReact();
      const ReactDOM = loadReactDom();
      const ReactDOMServer = loadReactDomServer();
      let statusSnapshot = null;

      function formAction() {}

      function StatusProbe() {
        const status = callReactDomApi(ReactDOM, "useFormStatus", []);
        statusSnapshot = describeFormStatus(status);
        return React.createElement(
          "button",
          { type: "submit", name: "intent", value: "save" },
          status.pending ? "saving" : "save"
        );
      }

      const html = ReactDOMServer.renderToString(
        React.createElement(
          "form",
          { action: formAction },
          React.createElement(StatusProbe)
        )
      );

      return {
        status: statusSnapshot,
        html: summarizeHtml(html),
        formBoundary: {
          hasUnexpectedSubmitAction: html.includes(
            "React form unexpectedly submitted."
          ),
          hasSubmitReplayScript: html.includes("$$reactFormReplay"),
          hasSubmitListener: html.includes('addEventListener("submit"'),
          hasFormDataCapture: html.includes("new FormData")
        }
      };
    })
};

if (!scenarioId) {
  process.stderr.write(
    "Usage: node react-dom-form-actions-probe-runner.mjs <scenario>\n"
  );
  process.exit(1);
}

const scenario = scenarios[scenarioId];
if (!scenario) {
  process.stderr.write(
    `Unknown React DOM form-actions scenario: ${JSON.stringify(scenarioId)}\n`
  );
  process.exit(1);
}

const result = captureConsole(() => scenario());
process.stdout.write(JSON.stringify({ scenarioId, ...result }));

function loadReact() {
  return require("react");
}

function loadReactDom() {
  return require("react-dom");
}

function loadReactDomServer() {
  return require("react-dom/server");
}

function callReactDomApi(ReactDOM, apiName, args) {
  switch (apiName) {
    case "requestFormReset":
      return ReactDOM.requestFormReset(...args);
    case "useFormStatus":
      return ReactDOM.useFormStatus(...args);
    case "useFormState":
      return ReactDOM.useFormState(...args);
    default:
      throw new Error(`Unsupported React DOM form API ${apiName}`);
  }
}

function captureConsole(fn) {
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

  try {
    return {
      result: fn(),
      consoleCalls
    };
  } catch (error) {
    return {
      result: describeThrown(error),
      consoleCalls
    };
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
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

function describeModule(value) {
  const ownKeys = Reflect.ownKeys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);

  return {
    objectTag: Object.prototype.toString.call(value),
    isExtensible: Object.isExtensible(value),
    exportKeys: Object.keys(value),
    ownPropertyNames: Object.getOwnPropertyNames(value),
    ownSymbolKeys: Object.getOwnPropertySymbols(value).map(describePropertyKey),
    ownKeys: ownKeys.map(describePropertyKey),
    selectedDescriptors: ownKeys.map((key) => ({
      key: describePropertyKey(key),
      descriptor: describeDescriptor(descriptors[key])
    }))
  };
}

function describeDescriptor(descriptor) {
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
      value: describeValue(descriptor.value)
    };
  }

  return {
    ...base,
    get: describeAccessor(descriptor.get),
    set: describeAccessor(descriptor.set)
  };
}

function describeAccessor(value) {
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

function describeDomInternals(value) {
  if (!value || typeof value !== "object") {
    return describeValue(value);
  }

  const dispatcher = value.d;
  return {
    keys: Object.keys(value),
    findDOMNode: describeValue(value.findDOMNode),
    priority: describeValue(value.p),
    dispatcher: dispatcher
      ? {
          keys: Object.keys(dispatcher),
          methods: Object.fromEntries(
            Object.keys(dispatcher).map((key) => [key, describeValue(dispatcher[key])])
          )
        }
      : describeValue(dispatcher)
  };
}

function describeFormStatus(status) {
  return {
    value: describeValue(status),
    objectKeys: Object.keys(status),
    ownPropertyNames: Object.getOwnPropertyNames(status),
    pending: describeValue(status?.pending),
    data: describeValue(status?.data),
    method: describeValue(status?.method),
    action: describeValue(status?.action)
  };
}

function describeFormStateTuple(tuple) {
  return {
    value: describeValue(tuple),
    isArray: Array.isArray(tuple),
    length: tuple?.length ?? null,
    state: describeValue(tuple?.[0]),
    dispatch: describeValue(tuple?.[1]),
    pending: describeValue(tuple?.[2])
  };
}

function summarizeHtml(html) {
  return {
    value: html,
    length: html.length,
    startsWith: html.slice(0, 120),
    includesUnexpectedSubmitMessage: html.includes(
      "React form unexpectedly submitted."
    ),
    includesReactFormReplayMarker: html.includes("$$reactFormReplay"),
    includesSubmitListener: html.includes('addEventListener("submit"'),
    includesJavascriptThrowAction: html.includes("javascript:throw new Error")
  };
}

function describeValue(value) {
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

  if (Array.isArray(value)) {
    return {
      type: "array",
      objectTag: Object.prototype.toString.call(value),
      length: value.length,
      values: value.map((entry) => describeValue(entry)),
      ownPropertyNames: Object.getOwnPropertyNames(value)
    };
  }

  if (valueType === "object") {
    const ownKeys = Reflect.ownKeys(value);
    return {
      type: "object",
      objectTag: Object.prototype.toString.call(value),
      isExtensible: Object.isExtensible(value),
      ownPropertyNames: Object.getOwnPropertyNames(value),
      ownSymbolKeys: Object.getOwnPropertySymbols(value).map(describePropertyKey),
      ownKeys: ownKeys.map(describePropertyKey),
      entries: Object.fromEntries(
        Object.keys(value).map((key) => [key, describeValue(value[key])])
      )
    };
  }

  return {
    type: valueType
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
