import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function main() {
  const reactDom = require("@fast-react/react-dom");
  const reactDomClient = require("@fast-react/react-dom/client");
  const scheduler = require("scheduler");

  const boundaries = [
    describeReactDomRoot(reactDom),
    describeReactDomClient(reactDomClient),
    describeScheduler(scheduler)
  ];

  process.stdout.write(JSON.stringify({ boundaries }));
}

function describeReactDomRoot(reactDom) {
  return {
    id: "fast-react-react-dom-root-placeholder",
    packageName: "@fast-react/react-dom",
    entrypoint: "react-dom",
    status: "unsupported-placeholder",
    placeholder: reactDom.__FAST_REACT_PLACEHOLDER__ === true,
    compatibilityTarget: reactDom.compatibilityTarget,
    eventPriorityInternalsExported: false,
    updatePriorityInternalsExported: false,
    exportKeys: Object.keys(reactDom),
    probes: {
      flushSyncCall: captureThrown(() => reactDom.flushSync(() => null)),
      internalsPriorityAccess: captureThrown(
        () =>
          reactDom.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
            .p
      )
    },
    reason:
      "The public React DOM root package is a package-surface placeholder and exposes no event priority or current update priority implementation."
  };
}

function describeReactDomClient(reactDomClient) {
  return {
    id: "fast-react-react-dom-client-placeholder",
    packageName: "@fast-react/react-dom",
    entrypoint: "react-dom/client",
    status: "unsupported-placeholder",
    placeholder: reactDomClient.__FAST_REACT_PLACEHOLDER__ === true,
    compatibilityTarget: reactDomClient.compatibilityTarget,
    eventPriorityInternalsExported: false,
    updatePriorityInternalsExported: false,
    exportKeys: Object.keys(reactDomClient),
    probes: {
      createRootCall: captureThrown(() => reactDomClient.createRoot({})),
      hydrateRootCall: captureThrown(() =>
        reactDomClient.hydrateRoot({}, null)
      )
    },
    reason:
      "Client roots are placeholders, so there is no DOM listener, dispatch wrapper, or resolveUpdatePriority behavior to compare yet."
  };
}

function describeScheduler(scheduler) {
  return {
    id: "fast-react-scheduler-placeholder-priority-context",
    packageName: "scheduler",
    entrypoint: "scheduler",
    status: "unsupported-placeholder",
    placeholder: scheduler.__FAST_REACT_PLACEHOLDER__ === true,
    compatibilityTarget: scheduler.compatibilityTarget,
    constants: {
      unstable_ImmediatePriority: scheduler.unstable_ImmediatePriority,
      unstable_UserBlockingPriority: scheduler.unstable_UserBlockingPriority,
      unstable_NormalPriority: scheduler.unstable_NormalPriority,
      unstable_LowPriority: scheduler.unstable_LowPriority,
      unstable_IdlePriority: scheduler.unstable_IdlePriority
    },
    probes: {
      getCurrentPriorityLevelCall: captureThrown(() =>
        scheduler.unstable_getCurrentPriorityLevel()
      ),
      runWithPriorityCall: captureThrown(() =>
        scheduler.unstable_runWithPriority(
          scheduler.unstable_NormalPriority,
          () => null
        )
      )
    },
    reason:
      "The current Fast React scheduler exposes public numeric constants but priority context APIs still throw placeholders, so message priority behavior cannot be behavior-compared."
  };
}

function captureThrown(fn) {
  try {
    const value = fn();
    return {
      status: "ok",
      value: describeValue(value)
    };
  } catch (error) {
    return {
      status: "throws",
      error: describeError(error)
    };
  }
}

function describeError(error) {
  return {
    name: error?.name ?? null,
    code: error?.code ?? null,
    entrypoint: error?.entrypoint ?? null,
    exportName: error?.exportName ?? null,
    compatibilityTarget: error?.compatibilityTarget ?? null,
    message: error?.message ?? String(error)
  };
}

function describeValue(value) {
  if (value === null) {
    return { type: "null" };
  }

  const valueType = typeof value;
  if (valueType === "undefined") {
    return { type: "undefined" };
  }
  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return { type: valueType, value };
  }

  return {
    type: valueType,
    stringValue: String(value)
  };
}

main();
