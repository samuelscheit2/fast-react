import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_746_753_GATE_ID,
  PRIVATE_ADMISSION_746_753_GATE_STATUS,
  PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS
} from "./private-admission-746-753-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_754_766_GATE_ID =
  "private-admission-754-766-local-gate-1";
export const PRIVATE_ADMISSION_754_766_GATE_STATUS =
  "recognized-accepted-private-diagnostics-754-766-public-compatibility-blocked";
export const PRIVATE_ADMISSION_754_766_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-754-766-with-violations";

export const PRIVATE_ADMISSION_754_766_PUBLIC_COMPATIBILITY_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS,
    "publicReactActSchedulerYieldCompatibilityClaimed",
    "publicReactDomNestedRootRenderCompatibilityClaimed",
    "publicReactDomHydrateRootMarkerListenerCompatibilityClaimed",
    "publicReactDomTestUtilsActPassiveCompatibilityClaimed",
    "publicSchedulerDeferredYieldCompatibilityClaimed",
    "publicSchedulerMockDelayedRootProducerCompatibilityClaimed",
    "publicTestRendererUnmountIdentityCompatibilityClaimed",
    "publicTestRendererSiblingTextJSCompatibilityClaimed",
    "publicTestRendererSiblingTextNativeToTreeCompatibilityClaimed",
    "publicTestRendererRootFinishedLanesHandoffCompatibilityClaimed",
    "publicNativeWorkerThreadExecutableCompatibilityClaimed",
    "publicNativeNapiCleanupHookCompatibilityClaimed",
    "publicPackageExportsCompatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_754_766_BLOCKED_SURFACES = freezeUniqueArray([
  ...PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES,
  "react-act-scheduler-yield-consumer",
  "react-dom-nested-root-render-host-output",
  "react-dom-hydrateroot-marker-listener-preflight",
  "react-dom-test-utils-act-passive-recognition",
  "scheduler-post-task-deferred-yield",
  "scheduler-mock-delayed-root-producer",
  "test-renderer-cjs-unmount-finished-work-identity",
  "test-renderer-package-root-unmount-finished-work-identity",
  "test-renderer-sibling-text-js-cjs-private-admission",
  "test-renderer-sibling-text-native-totree-identity",
  "test-renderer-root-finished-lanes-handoff",
  "native-worker-thread-teardown-executable-preflight",
  "native-napi-cleanup-hook-execution",
  "public-package-exports"
]);

export const PRIVATE_ADMISSION_754_766_BLOCKED_ADMISSION_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS,
    "reactActSchedulerYieldPublicAdmissionClaimed",
    "reactDomNestedRootRenderAdmissionClaimed",
    "reactDomHydrateRootMarkerListenerAdmissionClaimed",
    "reactDomTestUtilsActPassiveAdmissionClaimed",
    "schedulerDeferredYieldPublicAdmissionClaimed",
    "schedulerMockDelayedRootProducerAdmissionClaimed",
    "testRendererUnmountIdentityPublicAdmissionClaimed",
    "testRendererSiblingTextJSCJSAdmissionClaimed",
    "testRendererSiblingTextNativeToTreeAdmissionClaimed",
    "testRendererRootFinishedLanesHandoffPublicAdmissionClaimed",
    "nativeWorkerThreadExecutablePublicAdmissionClaimed",
    "nativeNapiCleanupHookExecutionClaimed",
    "publicPackageExportsAdmissionClaimed"
  ]);

const worker754 = "worker-754-js-cjs-unmount-finished-work-identity";
const worker755 = "worker-755-dom-nested-initial-host-output";
const worker756 = "worker-756-fix-public-facade-act-passive-recognition";
const worker757 = "worker-757-react-test-renderer-index-unmount-identity";
const worker758 = "worker-758-scheduler-posttask-yield-act-consumer";
const worker759 = "worker-759-private-admission-746-753-ledger";
const worker760 = "worker-760-sibling-text-native-totree-identity";
const worker761 = "worker-761-scheduler-posttask-deferred-yield-guard";
const worker762 = "worker-762-hydration-marker-listener-private-gate";
const worker763 = "worker-763-sibling-text-js-cjs-private-admission";
const worker764 = "worker-764-native-worker-thread-teardown-executable-preflight";
const worker765 = "worker-765-scheduler-mock-delayed-root-producer-gate";
const worker766 = "worker-766-test-renderer-root-finished-lanes-handoff";

export const PRIVATE_ADMISSION_754_766_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    [worker754]: freezeArray([
      "privateUnmountFinishedWorkIdentityGateAvailable",
      "unmountNativeExecutionFinishedWorkIdentityAdmissionWorker",
      "requiresUnmountDeletionCleanupHandoffEvidence"
    ]),
    [worker755]: freezeArray([
      "nested-host-component",
      "fake-dom-nested-host-component-child",
      "accepted-private-root-host-output-diagnostic"
    ]),
    [worker756]: freezeArray([
      "accepted-private-root-act-passive-diagnostic",
      "reactDomTestUtilsActGate.sideEffectPolicy",
      "private-root-act-passive-act-evidence-mismatch"
    ]),
    [worker757]: freezeArray([
      "privateUnmountFinishedWorkIdentityGateAvailable",
      "validateAcceptedFinishedWorkIdentity",
      "requires distinct top-level deletion handoff evidence"
    ]),
    [worker758]: freezeArray([
      "consumed-accepted-scheduler-post-task-yield-act-root-handoff-diagnostics",
      "fast-react.scheduler.unstable_post_task.priority-diagnostics",
      "controlled-shim-scheduler-yield-continuation"
    ]),
    [worker759]: freezeArray([
      PRIVATE_ADMISSION_746_753_GATE_ID,
      PRIVATE_ADMISSION_746_753_GATE_STATUS,
      "static/read-only private-admission ledger"
    ]),
    [worker760]: freezeArray([
      "describe_private_to_tree_after_sibling_text_update_native_execution_for_canary",
      "source_finished_work_identity_diagnostic_name",
      "consumes_private_sibling_text_finished_work_identity_gate"
    ]),
    [worker761]: freezeArray([
      "yield.then-deferred",
      "pending private root-continuation metadata",
      "stale-continuation"
    ]),
    [worker762]: freezeArray([
      "FastReactDomPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord",
      "defer-mark-container-as-root-for-hydrate-root",
      "defer-listen-to-all-supported-events-for-hydrate-root"
    ]),
    [worker763]: freezeArray([
      "fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission",
      "createAcceptedSiblingTextDiagnosticResult",
      "canCreateAcceptedSiblingTextDiagnosticResult"
    ]),
    [worker764]: freezeArray([
      "preflighted-native-root-bridge-worker-thread-teardown-boundary",
      "NativeRootBridgeWorkerThreadTeardownExecutablePreflight",
      "post-teardown-render-boundary-validation"
    ]),
    [worker765]: freezeArray([
      "fast-react.scheduler.mock-delayed-act-root-work-metadata",
      "produced-private-delayed-act-root-work-metadata-from-accepted-root-metadata",
      "metadata-not-produced-by-private-delayed-root-producer"
    ]),
    [worker766]: freezeArray([
      "react-test-renderer-root-finished-lanes-handoff-private-diagnostic",
      "private-root-finished-work-lanes-handoff-public-serialization-native-blocked",
      "rootFinishedLanesHandoff"
    ])
  });

export const PRIVATE_ADMISSION_754_766_REQUIRED_PRIOR_LEDGER_CONTEXT =
  freezeRecord({
    [worker754]: freezeArray([
      "worker-733-test-renderer-unmount-finished-work-identity",
      PRIVATE_ADMISSION_746_753_GATE_ID
    ]),
    [worker755]: freezeArray([
      "worker-685-root-work-loop-finished-work-handoff",
      "worker-703-dom-root-render-hosttext-component-execution",
      PRIVATE_ADMISSION_746_753_GATE_ID
    ]),
    [worker756]: freezeArray([
      "worker-753-react-dom-test-utils-act-handoff",
      PRIVATE_ADMISSION_746_753_GATE_ID
    ]),
    [worker757]: freezeArray([
      worker754,
      "worker-733-test-renderer-unmount-finished-work-identity"
    ]),
    [worker758]: freezeArray([
      "worker-751-scheduler-posttask-yield-handoff",
      PRIVATE_ADMISSION_746_753_GATE_ID
    ]),
    [worker759]: freezeArray([
      PRIVATE_ADMISSION_746_753_GATE_ID,
      PRIVATE_ADMISSION_746_753_GATE_STATUS
    ]),
    [worker760]: freezeArray([
      "worker-745-test-renderer-sibling-text-identity-gate",
      "worker-749-sibling-text-native-tojson-consumes-identity"
    ]),
    [worker761]: freezeArray([
      "worker-751-scheduler-posttask-yield-handoff",
      worker758
    ]),
    [worker762]: freezeArray([
      "worker-741-react-dom-hydrateroot-private-facade-preflight",
      "worker-748-hydrateroot-boundary-metadata-snapshot"
    ]),
    [worker763]: freezeArray([
      "worker-745-test-renderer-sibling-text-identity-gate",
      worker760
    ]),
    [worker764]: freezeArray([
      "worker-524-native-transport-worker-thread-teardown",
      "worker-740-native-package-worker-thread-teardown-mirror"
    ]),
    [worker765]: freezeArray([
      "worker-742-scheduler-mock-delayed-act-root-continuation",
      worker758
    ]),
    [worker766]: freezeArray([
      worker754,
      worker757,
      worker760,
      worker763
    ])
  });

export const PRIVATE_ADMISSION_754_766_REQUIRED_GUARDS = freezeRecord({
  [worker754]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: true,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker755]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: false,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker756]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: false,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker757]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: true,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker758]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: true,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: true,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker759]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: false,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true,
    staticReadOnlyLedger: true
  }),
  [worker760]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: true,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker761]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: true,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker762]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: false,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker763]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: true,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker764]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: true,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker765]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: true,
    aliasEvidenceRejected: false,
    clonedEvidenceRejected: true,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  }),
  [worker766]: guard({
    canonicalDiagnosticNamesPinned: true,
    staleEvidenceRejected: true,
    aliasEvidenceRejected: true,
    clonedEvidenceRejected: false,
    publicCompatibilityBlocked: true,
    packageSurfaceUnchanged: true
  })
});

export const PRIVATE_ADMISSION_754_766_EXPECTED_PACKAGE_SURFACE =
  freezeRecord({
    react: packageSurface({
      packagePath: "packages/react/package.json",
      manifest: {
        name: "@fast-react/react",
        version: "0.0.0",
        private: true,
        description: "React compatibility package placeholder for Fast React.",
        license: null,
        type: "commonjs",
        main: "./index.js",
        scripts: {
          check: "node ../../tests/smoke/import-entrypoints.mjs",
          test: "node ../../tests/smoke/import-entrypoints.mjs"
        },
        dependencies: null,
        peerDependencies: null,
        engines: {
          node: ">=26.0.0"
        }
      },
      packageExports: {
        ".": {
          "react-server": "./react.react-server.js",
          default: "./index.js"
        },
        "./jsx-runtime": {
          "react-server": "./jsx-runtime.react-server.js",
          default: "./jsx-runtime.js"
        },
        "./jsx-dev-runtime": {
          "react-server": "./jsx-dev-runtime.react-server.js",
          default: "./jsx-dev-runtime.js"
        },
        "./compiler-runtime": {
          "react-server": "./compiler-runtime.js",
          default: "./compiler-runtime.js"
        },
        "./package.json": "./package.json"
      },
      runtimePath: "packages/react",
      runtimeExportKeys: [
        "Activity",
        "Children",
        "Component",
        "Fragment",
        "Profiler",
        "PureComponent",
        "StrictMode",
        "Suspense",
        "__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
        "__COMPILER_RUNTIME",
        "act",
        "cache",
        "cacheSignal",
        "captureOwnerStack",
        "cloneElement",
        "createContext",
        "createElement",
        "createRef",
        "forwardRef",
        "isValidElement",
        "lazy",
        "memo",
        "startTransition",
        "unstable_useCacheRefresh",
        "use",
        "useActionState",
        "useCallback",
        "useContext",
        "useDebugValue",
        "useDeferredValue",
        "useEffect",
        "useEffectEvent",
        "useId",
        "useImperativeHandle",
        "useInsertionEffect",
        "useLayoutEffect",
        "useMemo",
        "useOptimistic",
        "useReducer",
        "useRef",
        "useState",
        "useSyncExternalStore",
        "useTransition",
        "version"
      ],
      subpathRuntimeExports: freezeRecord({
        "packages/react/react.react-server.js": freezeArray([
          "Children",
          "Fragment",
          "Profiler",
          "StrictMode",
          "Suspense",
          "__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
          "cache",
          "cacheSignal",
          "captureOwnerStack",
          "cloneElement",
          "createElement",
          "createRef",
          "forwardRef",
          "isValidElement",
          "lazy",
          "memo",
          "use",
          "useCallback",
          "useDebugValue",
          "useId",
          "useMemo",
          "version"
        ]),
        "packages/react/jsx-runtime.js": freezeArray([
          "Fragment",
          "jsx",
          "jsxs"
        ]),
        "packages/react/jsx-runtime.react-server.js": freezeArray([
          "Fragment",
          "jsx",
          "jsxDEV",
          "jsxs"
        ]),
        "packages/react/jsx-dev-runtime.js": freezeArray([
          "Fragment",
          "jsxDEV"
        ]),
        "packages/react/jsx-dev-runtime.react-server.js": freezeArray([
          "Fragment",
          "jsx",
          "jsxDEV",
          "jsxs"
        ]),
        "packages/react/compiler-runtime.js": freezeArray(["c"])
      })
    }),
    reactDom: packageSurface({
      packagePath: "packages/react-dom/package.json",
      manifest: {
        name: "@fast-react/react-dom",
        version: "0.0.0",
        private: true,
        description:
          "React DOM compatibility package placeholder for Fast React.",
        license: null,
        type: "commonjs",
        main: "./index.js",
        scripts: {
          check:
            "node --test test/*.test.js && node ../../tests/smoke/import-entrypoints.mjs",
          test:
            "node --test test/*.test.js && node ../../tests/smoke/import-entrypoints.mjs"
        },
        dependencies: {
          scheduler: "^0.27.0"
        },
        peerDependencies: {
          "@fast-react/react": "0.0.0"
        },
        engines: {
          node: ">=26.0.0"
        }
      },
      packageExports: {
        ".": {
          "react-server": "./react-dom.react-server.js",
          default: "./index.js"
        },
        "./client": {
          "react-server": "./client.react-server.js",
          default: "./client.js"
        },
        "./server": {
          "react-server": "./server.react-server.js",
          workerd: "./server.edge.js",
          bun: "./server.bun.js",
          deno: "./server.browser.js",
          worker: "./server.browser.js",
          node: "./server.node.js",
          "edge-light": "./server.edge.js",
          browser: "./server.browser.js",
          default: "./server.node.js"
        },
        "./server.browser": {
          "react-server": "./server.react-server.js",
          default: "./server.browser.js"
        },
        "./server.bun": {
          "react-server": "./server.react-server.js",
          default: "./server.bun.js"
        },
        "./server.edge": {
          "react-server": "./server.react-server.js",
          default: "./server.edge.js"
        },
        "./server.node": {
          "react-server": "./server.react-server.js",
          default: "./server.node.js"
        },
        "./static": {
          "react-server": "./static.react-server.js",
          workerd: "./static.edge.js",
          deno: "./static.browser.js",
          worker: "./static.browser.js",
          node: "./static.node.js",
          "edge-light": "./static.edge.js",
          browser: "./static.browser.js",
          default: "./static.node.js"
        },
        "./static.browser": {
          "react-server": "./static.react-server.js",
          default: "./static.browser.js"
        },
        "./static.edge": {
          "react-server": "./static.react-server.js",
          default: "./static.edge.js"
        },
        "./static.node": {
          "react-server": "./static.react-server.js",
          default: "./static.node.js"
        },
        "./profiling": {
          "react-server": "./profiling.react-server.js",
          default: "./profiling.js"
        },
        "./test-utils": "./test-utils.js",
        "./package.json": "./package.json"
      },
      runtimePath: "packages/react-dom",
      runtimeExportKeys: [
        "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
        "createPortal",
        "flushSync",
        "preconnect",
        "prefetchDNS",
        "preinit",
        "preinitModule",
        "preload",
        "preloadModule",
        "requestFormReset",
        "unstable_batchedUpdates",
        "useFormState",
        "useFormStatus",
        "version"
      ],
      subpathRuntimeExports: freezeRecord({
        "packages/react-dom/client.js": freezeArray([
          "createRoot",
          "hydrateRoot",
          "version"
        ]),
        "packages/react-dom/test-utils.js": freezeArray(["act"]),
        "packages/react-dom/profiling.js": freezeArray([
          "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
          "createPortal",
          "createRoot",
          "flushSync",
          "hydrateRoot",
          "preconnect",
          "prefetchDNS",
          "preinit",
          "preinitModule",
          "preload",
          "preloadModule",
          "requestFormReset",
          "unstable_batchedUpdates",
          "useFormState",
          "useFormStatus",
          "version"
        ]),
        "packages/react-dom/react-dom.react-server.js": freezeArray([
          "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
          "preconnect",
          "prefetchDNS",
          "preinit",
          "preinitModule",
          "preload",
          "preloadModule",
          "version"
        ]),
        "packages/react-dom/server.node.js": freezeArray([
          "renderToPipeableStream",
          "renderToReadableStream",
          "renderToStaticMarkup",
          "renderToString",
          "resume",
          "resumeToPipeableStream",
          "version"
        ]),
        "packages/react-dom/server.browser.js": freezeArray([
          "renderToReadableStream",
          "renderToStaticMarkup",
          "renderToString",
          "resume",
          "version"
        ]),
        "packages/react-dom/server.edge.js": freezeArray([
          "renderToReadableStream",
          "renderToStaticMarkup",
          "renderToString",
          "resume",
          "version"
        ]),
        "packages/react-dom/server.bun.js": freezeArray([
          "renderToReadableStream",
          "renderToStaticMarkup",
          "renderToString",
          "resume",
          "version"
        ]),
        "packages/react-dom/static.node.js": freezeArray([
          "prerender",
          "prerenderToNodeStream",
          "resumeAndPrerender",
          "resumeAndPrerenderToNodeStream",
          "version"
        ]),
        "packages/react-dom/static.browser.js": freezeArray([
          "prerender",
          "resumeAndPrerender",
          "version"
        ]),
        "packages/react-dom/static.edge.js": freezeArray([
          "prerender",
          "resumeAndPrerender",
          "version"
        ])
      }),
      runtimeThrowSubpaths: freezeRecord({
        "packages/react-dom/client.react-server.js": freezeRecord({
          status: "throws",
          exportKeys: [],
          errorName: "FastReactDomReactServerUnsupportedError",
          errorCode: "FAST_REACT_REACT_SERVER_UNSUPPORTED"
        }),
        "packages/react-dom/server.react-server.js": freezeRecord({
          status: "throws",
          exportKeys: [],
          errorName: "FastReactDomReactServerUnsupportedError",
          errorCode: "FAST_REACT_REACT_SERVER_UNSUPPORTED"
        }),
        "packages/react-dom/static.react-server.js": freezeRecord({
          status: "throws",
          exportKeys: [],
          errorName: "FastReactDomReactServerUnsupportedError",
          errorCode: "FAST_REACT_REACT_SERVER_UNSUPPORTED"
        }),
        "packages/react-dom/profiling.react-server.js": freezeRecord({
          status: "throws",
          exportKeys: [],
          errorName: "FastReactDomReactServerUnsupportedError",
          errorCode: "FAST_REACT_REACT_SERVER_UNSUPPORTED"
        })
      })
    }),
    reactTestRenderer: packageSurface({
      packagePath: "packages/react-test-renderer/package.json",
      manifest: {
        name: "@fast-react/react-test-renderer",
        version: "0.0.0",
        private: true,
        description:
          "React Test Renderer compatibility package placeholder for Fast React.",
        license: null,
        type: null,
        main: "index.js",
        scripts: {
          check: "node ../../tests/smoke/import-entrypoints.mjs",
          test: "node ../../tests/smoke/import-entrypoints.mjs"
        },
        dependencies: {
          scheduler: "^0.27.0"
        },
        peerDependencies: {
          "@fast-react/react": "0.0.0"
        },
        engines: {
          node: ">=26.0.0"
        }
      },
      packageExports: null,
      runtimePath: "packages/react-test-renderer",
      runtimeExportKeys: [
        "_Scheduler",
        "act",
        "create",
        "unstable_batchedUpdates",
        "version"
      ]
    }),
    scheduler: packageSurface({
      packagePath: "packages/scheduler/package.json",
      manifest: {
        name: "scheduler",
        version: "0.27.0",
        private: true,
        description: "Scheduler compatibility package placeholder for Fast React.",
        license: "MIT",
        type: null,
        main: null,
        scripts: {
          check: "node ../../tests/smoke/import-entrypoints.mjs",
          test: "node ../../tests/smoke/import-entrypoints.mjs"
        },
        dependencies: null,
        peerDependencies: null,
        engines: {
          node: ">=26.0.0"
        }
      },
      packageExports: null,
      runtimePath: "packages/scheduler",
      runtimeExportKeys: [
        "unstable_IdlePriority",
        "unstable_ImmediatePriority",
        "unstable_LowPriority",
        "unstable_NormalPriority",
        "unstable_Profiling",
        "unstable_UserBlockingPriority",
        "unstable_cancelCallback",
        "unstable_forceFrameRate",
        "unstable_getCurrentPriorityLevel",
        "unstable_next",
        "unstable_now",
        "unstable_requestPaint",
        "unstable_runWithPriority",
        "unstable_scheduleCallback",
        "unstable_shouldYield",
        "unstable_wrapCallback"
      ],
      subpathRuntimeExports: freezeRecord({
        "packages/scheduler/unstable_mock.js": freezeArray([
          "log",
          "reset",
          "unstable_IdlePriority",
          "unstable_ImmediatePriority",
          "unstable_LowPriority",
          "unstable_NormalPriority",
          "unstable_Profiling",
          "unstable_UserBlockingPriority",
          "unstable_advanceTime",
          "unstable_cancelCallback",
          "unstable_clearLog",
          "unstable_flushAll",
          "unstable_flushAllWithoutAsserting",
          "unstable_flushExpired",
          "unstable_flushNumberOfYields",
          "unstable_flushUntilNextPaint",
          "unstable_forceFrameRate",
          "unstable_getCurrentPriorityLevel",
          "unstable_hasPendingWork",
          "unstable_next",
          "unstable_now",
          "unstable_requestPaint",
          "unstable_runWithPriority",
          "unstable_scheduleCallback",
          "unstable_setDisableYieldValue",
          "unstable_shouldYield",
          "unstable_wrapCallback"
        ])
      })
    }),
    native: packageSurface({
      packagePath: "bindings/node/package.json",
      manifest: {
        name: "@fast-react/native",
        version: "0.0.0",
        private: true,
        description: "Node loader placeholder for the Fast React native binding.",
        license: null,
        type: "module",
        main: "./index.cjs",
        scripts: {
          build: "cargo build -p fast-react-napi",
          check:
            "node ./test/native-loader.test.cjs && node ./test/native-no-load-guard.test.cjs && node ./test/native-loader-esm.test.mjs",
          test: "npm run check"
        },
        dependencies: null,
        peerDependencies: null,
        engines: {
          node: ">=22.0.0"
        }
      },
      packageExports: {
        ".": {
          import: "./index.mjs",
          require: "./index.cjs",
          default: "./index.mjs"
        },
        "./package.json": "./package.json"
      },
      runtimePath: "bindings/node/index.cjs",
      runtimeExportKeys: [
        "FastReactNativeBindingUnavailableError",
        "bindingStatus",
        "createNativeRootBridgeRequestShapeGate",
        "getNativeBindingLoadPlan",
        "loadNativeBinding",
        "nativeAddonName",
        "nativeBindingManifest",
        "nativeRootBridgeRequestShape",
        "nativeTargetMatrix",
        "nodeApiVersionFloor",
        "optionalPackagePrefix",
        "packageName",
        "platformArtifactPolicy",
        "platformPackages",
        "supportedNativeTargets",
        "supportedNodeEngineRange",
        "unavailableErrorCode"
      ],
      esmRuntimePath: "bindings/node/index.mjs",
      esmRuntimeExportKeys: [
        "FastReactNativeBindingUnavailableError",
        "bindingStatus",
        "createNativeRootBridgeRequestShapeGate",
        "default",
        "getNativeBindingLoadPlan",
        "loadNativeBinding",
        "nativeAddonName",
        "nativeBindingManifest",
        "nativeRootBridgeRequestShape",
        "nativeTargetMatrix",
        "nodeApiVersionFloor",
        "optionalPackagePrefix",
        "packageName",
        "platformArtifactPolicy",
        "platformPackages",
        "supportedNativeTargets",
        "supportedNodeEngineRange",
        "unavailableErrorCode"
      ]
    })
  });

const rowData754766 = freezeArray([
  rowData({
    workerId: worker754,
    privateAdmission: "accepted-private-test-renderer-cjs-unmount-identity",
    area: "react-test-renderer CJS private unmount finished-work identity admission",
    primaryCompatibilityArea:
      "test-renderer-cjs-unmount-identity-public-native-package-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-754-progress",
        path: "worker-progress/worker-754-js-cjs-unmount-finished-work-identity.md",
        tokens: [
          "# Worker 754 - JS/CJS unmount finished-work identity",
          "privateUnmountFinishedWorkIdentityGateAvailable",
          "requiresUnmountDeletionCleanupHandoffEvidence",
          "public/native/package-compatibility surfaces"
        ]
      }),
      evidenceData({
        role: "worker-754-cjs-dev-gate",
        path: "packages/react-test-renderer/cjs/react-test-renderer.development.js",
        tokens: [
          "privateUnmountFinishedWorkIdentityGateAvailable: true",
          "unmountNativeExecutionFinishedWorkIdentityAdmissionWorker",
          "privateUnmountNativeBridgeCleanupHandoffDiagnosticId",
          "privateUnmountNativeBridgeAdmissionDiagnosticId"
        ]
      }),
      evidenceData({
        role: "worker-754-conformance",
        path: "tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs",
        tokens: [
          "privateUnmountNativeBridgeAdmissionDiagnosticId",
          "privateUnmountNativeBridgeCleanupHandoffDiagnosticId",
          "staleUnmountIdentityError",
          "compatibilityHandoffError"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker755,
    privateAdmission: "accepted-private-react-dom-nested-host-output",
    area: "React DOM private nested initial host-output fake-DOM diagnostic",
    primaryCompatibilityArea:
      "react-dom-nested-root-render-public-root-hydration-native-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-755-progress",
        path: "worker-progress/worker-755-dom-nested-initial-host-output.md",
        tokens: [
          "# Worker 755: DOM Nested Initial Host Output",
          "`HostComponent > HostComponent > HostText`",
          "public root,\n  native, reconciler, hydration, event, ref, browser DOM, and compatibility\n  claims blocked",
          "mid-commit nested append failure"
        ]
      }),
      evidenceData({
        role: "worker-755-root-bridge",
        path: "packages/react-dom/src/client/root-bridge.js",
        tokens: [
          "'nested-host-component'",
          "'fake-dom-nested-host-component-child'",
          "renderRootHostOutput(createRecord, element, options)"
        ]
      }),
      evidenceData({
        role: "worker-755-e2e-conformance",
        path: "tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs",
        tokens: [
          'hostOutputShape: "nested-host-component"',
          "private facade root.render fake-DOM",
          'assert.equal(diagnostic.hostOutputShape, "nested-host-component")'
        ]
      })
    ]
  }),
  rowData({
    workerId: worker756,
    privateAdmission: "accepted-private-react-dom-act-passive-recognition",
    area: "React DOM root-render E2E private act/passive recognition fix",
    primaryCompatibilityArea:
      "react-dom-test-utils-act-passive-private-recognition-public-act-root-blocked",
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-756-progress",
        path: "worker-progress/worker-756-fix-public-facade-act-passive-recognition.md",
        tokens: [
          "# Worker 756: Public Facade Act/Passive Recognition",
          "`executesRendererWork` and\n  `executesPublicFlushSync` to stay `false`",
          "all 20 private\n  act/passive scenario-mode rows",
          "public act, public test-utils act,\n  public root render, public passive effect"
        ]
      }),
      evidenceData({
        role: "worker-756-conformance-gate",
        path: "tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs",
        tokens: [
          "accepted-private-root-act-passive-diagnostic",
          "private-root-act-passive-act-evidence-mismatch",
          "reactDomTestUtilsActGate"
        ]
      }),
      evidenceData({
        role: "worker-756-public-facade-test",
        path: "tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs",
        tokens: [
          "private act/passive",
          "reactDomTestUtilsActGate.sideEffectPolicy",
          'assert.equal(publicBoundary.createRoot.status, "throws")'
        ]
      })
    ]
  }),
  rowData({
    workerId: worker757,
    privateAdmission:
      "accepted-private-test-renderer-package-root-unmount-identity",
    area: "react-test-renderer package-root private unmount finished-work identity admission",
    primaryCompatibilityArea:
      "test-renderer-package-root-unmount-identity-public-serialization-native-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-757-progress",
        path: "worker-progress/worker-757-react-test-renderer-index-unmount-identity.md",
        tokens: [
          "# Worker 757 Progress",
          "`Unmount` identity validation rejects omitted deletion/cleanup handoff\n  evidence, mismatched cleanup request sequence, stale identity sequence, and\n  foreign root request identity",
          "missing top-level\n  deletion handoff evidence",
          "Public serialization and tree availability remain false"
        ]
      }),
      evidenceData({
        role: "worker-757-index-gate",
        path: "packages/react-test-renderer/index.js",
        tokens: [
          "privateUnmountFinishedWorkIdentityGateAvailable: true",
          "validateAcceptedFinishedWorkIdentity",
          "privateUnmountNativeBridgeCleanupHandoffDiagnosticId",
          "privateUnmountNativeBridgeAdmissionDiagnosticId"
        ]
      }),
      evidenceData({
        role: "worker-757-create-routing-test",
        path: "tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs",
        tokens: [
          "assert.equal(jsonFacade.privateUnmountFinishedWorkIdentityGateAvailable, true)",
          "staleUnmountIdentityError",
          "foreignIdentityError",
          "assert.match(foreignIdentityError.message, /foreign root/u)"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker758,
    privateAdmission: "accepted-private-react-act-scheduler-yield-consumer",
    area: "React act private Scheduler postTask scheduler.yield consumer",
    primaryCompatibilityArea:
      "react-act-scheduler-yield-private-consumer-public-act-scheduler-root-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-758-progress",
        path: "worker-progress/worker-758-scheduler-posttask-yield-act-consumer.md",
        tokens: [
          "# Worker 758: Scheduler postTask Yield Act Consumer",
          "`scheduler.yield` fallback classification",
          "stale root continuation evidence\n  rejected",
          "mutable nested evidence rejection"
        ]
      }),
      evidenceData({
        role: "worker-758-react-gate",
        path: "packages/react/private-act-dispatcher-gate.js",
        tokens: [
          "'controlled-shim-scheduler-yield-continuation'",
          "'scheduler-yield-not-selected'",
          "'rejected Scheduler postTask scheduler.yield act/root handoff diagnostics'",
          "packageCompatibilityClaimed"
        ]
      }),
      evidenceData({
        role: "worker-758-react-act-test",
        path: "tests/conformance/test/react-act-oracle.test.mjs",
        tokens: [
          "package-private React act dispatcher gate consumes Scheduler postTask scheduler.yield handoff diagnostics without root admission",
          "mutable-private-post-task-diagnostics",
          '"fast-react.scheduler.unstable_post_task.priority-diagnostics"',
          'assert.equal(bridgeReport.selectedFallback, "scheduler.yield")'
        ]
      })
    ]
  }),
  rowData({
    workerId: worker759,
    privateAdmission: "accepted-private-ledger-evidence",
    area: "static private-admission ledger evidence for accepted Workers 746-753",
    primaryCompatibilityArea:
      "private-admission-static-ledger-746-753-public-compatibility-blocked",
    runtimeCapabilityAdded: false,
    promotion: "not-applicable",
    evidenceRows: [
      evidenceData({
        role: "worker-759-progress",
        path: "worker-progress/worker-759-private-admission-746-753-ledger.md",
        tokens: [
          "# Worker 759: Private Admission 746-753 Ledger",
          "static/read-only private-admission ledger",
          "public `act`, `flushSync`, root execution",
          "Public React DOM root/render/hydration/test-utils act/flushSync"
        ]
      }),
      evidenceData({
        role: "worker-759-ledger-source",
        path: "tests/conformance/src/private-admission-746-753-gate.mjs",
        tokens: [
          "PRIVATE_ADMISSION_746_753_GATE_ID",
          "recognized-accepted-private-diagnostics-746-753-public-compatibility-blocked",
          "worker-753-react-dom-test-utils-act-handoff",
          "schedulerPostTaskYieldPublicAdmissionClaimed"
        ]
      }),
      evidenceData({
        role: "worker-759-ledger-test",
        path: "tests/conformance/test/private-admission-746-753-gate.test.mjs",
        tokens: [
          "private admission 746-753 gate recognizes accepted static evidence without compatibility",
          "private admission 746-753 gate rejects public compatibility promotion",
          "private admission 746-753 gate rejects runtime execution claims in the static ledger"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker760,
    privateAdmission:
      "accepted-private-test-renderer-native-totree-sibling-identity",
    area: "Rust-only sibling-text native toTree identity consumption",
    primaryCompatibilityArea:
      "test-renderer-sibling-text-native-totree-public-native-package-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-760-progress",
        path: "worker-progress/worker-760-sibling-text-native-totree-identity.md",
        tokens: [
          "# Worker 760: Sibling Text Native toTree Consumes Identity",
          "`describe_private_to_tree_after_sibling_text_update_native_execution_for_canary`",
          "`consumes_private_sibling_text_finished_work_identity_gate`",
          "public `toTree`, public serialization, JS/CJS facades"
        ]
      }),
      evidenceData({
        role: "worker-760-rust-source",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        tokens: [
          "pub fn describe_private_to_tree_after_sibling_text_update_native_execution_for_canary",
          "evidence.source_finished_work_identity_diagnostic_name = Some(identity.diagnostic_name());",
          "evidence.consumes_private_sibling_text_finished_work_identity_gate = true;",
          "reason: \"sibling-text-finished-work-identity-gate-not-implemented\""
        ]
      })
    ]
  }),
  rowData({
    workerId: worker761,
    privateAdmission: "accepted-private-scheduler-deferred-yield-guard",
    area: "Scheduler postTask deferred scheduler.yield fail-closed guard",
    primaryCompatibilityArea:
      "scheduler-post-task-deferred-yield-public-timing-root-blocked",
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-761-progress",
        path: "worker-progress/worker-761-scheduler-posttask-deferred-yield-guard.md",
        tokens: [
          "# Worker 761: Scheduler postTask Deferred Yield Guard",
          "`yield.then-deferred`",
          "pending private\n  root-continuation metadata row before release",
          "`stale-continuation`"
        ]
      }),
      evidenceData({
        role: "worker-761-root-continuation-test",
        path: "tests/conformance/test/scheduler-post-task-root-continuation.test.mjs",
        tokens: [
          "private postTask deferred scheduler.yield handoff stays pending until release and rejects after continuation execution",
          "yield.then-deferred",
          "public-compatibility-claimed",
          "'scheduler.yield'"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker762,
    privateAdmission:
      "accepted-private-react-dom-hydrateroot-marker-listener-gate",
    area: "React DOM hydrateRoot private marker/listener preflight",
    primaryCompatibilityArea:
      "react-dom-hydrateroot-marker-listener-public-hydration-blocked",
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-762-progress",
        path: "worker-progress/worker-762-hydration-marker-listener-private-gate.md",
        tokens: [
          "# Worker 762: Hydration Marker/Listener Private Gate",
          "`FastReactDomPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord`",
          "`defer-mark-container-as-root-for-hydrate-root`",
          "Public `hydrateRoot` remains the unsupported placeholder"
        ]
      }),
      evidenceData({
        role: "worker-762-root-bridge",
        path: "packages/react-dom/src/client/root-bridge.js",
        tokens: [
          "'FastReactDomPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord'",
          "'defer-mark-container-as-root-for-hydrate-root'",
          "'defer-listen-to-all-supported-events-for-hydrate-root'",
          "'hydrateRoot marker/listener preflight cannot accept public compatibility claims.'"
        ]
      }),
      evidenceData({
        role: "worker-762-public-facade-test",
        path: "tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs",
        tokens: [
          "React DOM client private facade preflights marker/listener setup and cleanup without public behavior",
          "marker/listener",
          'assert.equal(publicBoundary.hydrateRoot.status, "throws")'
        ]
      })
    ]
  }),
  rowData({
    workerId: worker763,
    privateAdmission: "accepted-private-test-renderer-sibling-text-js-cjs",
    area: "react-test-renderer hidden CJS sibling-text toJSON private admission",
    primaryCompatibilityArea:
      "test-renderer-sibling-text-js-cjs-public-serialization-native-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-763-progress",
        path: "worker-progress/worker-763-sibling-text-js-cjs-private-admission.md",
        tokens: [
          "# Worker 763: Sibling Text JS/CJS Private Admission",
          "`fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission`",
          "stale sequence rejection, row mismatch rejection, broad\n  multichild rejection",
          "public/native/package/JS claim rejection"
        ]
      }),
      evidenceData({
        role: "worker-763-cjs-dev",
        path: "packages/react-test-renderer/cjs/react-test-renderer.development.js",
        tokens: [
          "'fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission'",
          "createAcceptedSiblingTextDiagnosticResult",
          "canCreateAcceptedSiblingTextDiagnosticResult",
          "'sibling-text-finished-work-identity-gate-not-implemented'"
        ]
      }),
      evidenceData({
        role: "worker-763-serialization-test",
        path: "tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs",
        tokens: [
          "fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission",
          "canCreateAcceptedSiblingTextDiagnosticResult",
          "createAcceptedSiblingTextDiagnosticResult",
          "sibling-text-finished-work-identity-gate-not-implemented"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker764,
    privateAdmission: "accepted-private-native-worker-thread-executable-preflight",
    area: "fast-react-napi worker-thread teardown executable preflight",
    primaryCompatibilityArea:
      "native-worker-thread-teardown-preflight-public-native-addon-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-764-progress",
        path: "worker-progress/worker-764-native-worker-thread-teardown-executable-preflight.md",
        tokens: [
          "# Worker 764: Native Worker-Thread Teardown Executable Preflight",
          "post-teardown render request is rejected as a stale worker root",
          "peer root and value handles remain active",
          "Node `worker_threads`, N-API cleanup hooks, native addon loading"
        ]
      }),
      evidenceData({
        role: "worker-764-rust-source",
        path: "crates/fast-react-napi/src/lib.rs",
        tokens: [
          "preflighted-native-root-bridge-worker-thread-teardown-boundary",
          "pub(crate) struct NativeRootBridgeWorkerThreadTeardownExecutablePreflight",
          "post-teardown-render-boundary-validation",
          "post-teardown-peer-root-validation"
        ]
      }),
      evidenceData({
        role: "worker-764-native-loader-source",
        path: "bindings/node/index.cjs",
        tokens: [
          "'diagnosed-native-root-bridge-transport-worker-thread-teardown'",
          "'post-teardown-chunk-blocked'",
          "nativeAddonLoaded: false",
          "nativeExecution: false"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker765,
    privateAdmission: "accepted-private-scheduler-mock-delayed-root-producer",
    area: "Scheduler mock private delayed root/act metadata producer",
    primaryCompatibilityArea:
      "scheduler-mock-delayed-root-producer-public-act-root-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-765-progress",
        path: "worker-progress/worker-765-scheduler-mock-delayed-root-producer-gate.md",
        tokens: [
          "# Worker 765: Scheduler Mock Delayed Root Producer Gate",
          "`createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics`",
          "`metadata-not-produced-by-private-delayed-root-producer`",
          "does not claim public\n  Scheduler timing compatibility, public React act compatibility"
        ]
      }),
      evidenceData({
        role: "worker-765-scheduler-mock",
        path: "packages/scheduler/unstable_mock.js",
        tokens: [
          "const delayedActRootWorkMetadataSources = new WeakMap();",
          "function createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(",
          "'metadata-source-root-work-record-count-mismatch'",
          "'metadata-not-produced-by-private-delayed-root-producer'"
        ]
      }),
      evidenceData({
        role: "worker-765-delayed-test",
        path: "tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs",
        tokens: [
          "scheduler mock rejects mutated delayed producer nested evidence",
          "metadata-source-root-work-record-count-mismatch",
          "metadata-source-act-queue-record-0-identity-mismatch",
          "metadata-not-produced-by-private-delayed-root-producer"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker766,
    privateAdmission:
      "accepted-private-test-renderer-root-finished-lanes-handoff",
    area: "react-test-renderer private root finished-work and finished-lanes handoff",
    primaryCompatibilityArea:
      "test-renderer-root-finished-lanes-public-serialization-native-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-766-progress",
        path: "worker-progress/worker-766-test-renderer-root-finished-lanes-handoff.md",
        tokens: [
          "# Worker 766 - Test Renderer Root Finished Lanes Handoff",
          "outer handoff key must be canonical `rootFinishedLanesHandoff`",
          "`root_finished_lanes_handoff`, `finishedLanesHandoff`, `finished_lanes_handoff`, `finishedWorkHandoff`, and `finished_work_handoff` are rejected",
          "Public serialization, public route compatibility, native addon loading/execution"
        ]
      }),
      evidenceData({
        role: "worker-766-index-source",
        path: "packages/react-test-renderer/index.js",
        tokens: [
          "'react-test-renderer-root-finished-lanes-handoff-private-diagnostic'",
          "'private-root-finished-work-lanes-handoff-public-serialization-native-blocked'",
          "!Object.hasOwn(evidence, 'rootFinishedLanesHandoff')",
          "'Expected canonical private rootFinishedLanesHandoff evidence.'"
        ]
      }),
      evidenceData({
        role: "worker-766-alias-test",
        path: "tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs",
        tokens: [
          '"root_finished_lanes_handoff"',
          '"finishedLanesHandoff"',
          '"finished_lanes_handoff"',
          '"finishedWorkHandoff"',
          '"finished_work_handoff"'
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_754_766_ROWS = freezeArray(
  rowData754766.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      privateAdmission: sourceRow.privateAdmission,
      area: sourceRow.area,
      primaryCompatibilityArea: sourceRow.primaryCompatibilityArea,
      acceptedDiagnosticIds:
        PRIVATE_ADMISSION_754_766_REQUIRED_ACCEPTED_DIAGNOSTICS[
          sourceRow.workerId
        ],
      priorLedgerContext:
        PRIVATE_ADMISSION_754_766_REQUIRED_PRIOR_LEDGER_CONTEXT[
          sourceRow.workerId
        ],
      requiredGuards:
        PRIVATE_ADMISSION_754_766_REQUIRED_GUARDS[sourceRow.workerId],
      runtimeCapabilityAdded: sourceRow.runtimeCapabilityAdded,
      promotion: sourceRow.promotion,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_754_766_WORKERS = freezeArray(
  PRIVATE_ADMISSION_754_766_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission754766Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  expectedPackageSurface = PRIVATE_ADMISSION_754_766_EXPECTED_PACKAGE_SURFACE
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_754_766_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((row) => row.workerId);
  const manifest = freezeRecord({
    workerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_754_766_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_754_766_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    )
  });

  const evidenceTokenMismatches = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          workerId: row.workerId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError
        })
      )
  );
  const acceptedDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_754_766_REQUIRED_ACCEPTED_DIAGNOSTICS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds"
  });
  const priorLedgerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_754_766_REQUIRED_PRIOR_LEDGER_CONTEXT,
    actualKey: "priorLedgerContext",
    expectedKey: "expectedPriorLedgerContext",
    actualKeyForViolation: "actualPriorLedgerContext"
  });
  const requiredGuardMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_754_766_REQUIRED_GUARDS,
    actualKey: "requiredGuards",
    expectedKey: "expectedRequiredGuards",
    actualKeyForViolation: "actualRequiredGuards"
  });
  const publicCompatibilityClaimKeyMismatches = evaluatedRows.flatMap((row) => {
    const actualClaimIds = Object.keys(row.publicCompatibilityClaims ?? {});
    if (
      sameStringSet(
        PRIVATE_ADMISSION_754_766_PUBLIC_COMPATIBILITY_CLAIMS,
        actualClaimIds
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicCompatibilityClaims:
          PRIVATE_ADMISSION_754_766_PUBLIC_COMPATIBILITY_CLAIMS,
        actualPublicCompatibilityClaims: freezeArray(actualClaimIds)
      })
    ];
  });
  const blockedSurfaceMismatches = evaluatedRows.flatMap((row) => {
    const actualBlockedSurfaces = row.blockedPublicCompatibilitySurfaces ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_754_766_BLOCKED_SURFACES,
        actualBlockedSurfaces
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_754_766_BLOCKED_SURFACES,
        actualBlockedPublicCompatibilitySurfaces:
          freezeArray(actualBlockedSurfaces)
      })
    ];
  });
  const blockedPublicClaimMismatches = evaluatedRows.flatMap((row) => {
    const actualBlockedClaims = row.blockedPublicClaims ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_754_766_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicClaims:
          PRIVATE_ADMISSION_754_766_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedPublicClaims: freezeArray(actualBlockedClaims)
      })
    ];
  });
  const blockedAdmissionClaimMismatches = evaluatedRows.flatMap((row) => {
    const actualBlockedAdmissionClaims = row.blockedAdmissionClaimIds ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_754_766_BLOCKED_ADMISSION_CLAIMS,
        actualBlockedAdmissionClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedAdmissionClaims:
          PRIVATE_ADMISSION_754_766_BLOCKED_ADMISSION_CLAIMS,
        actualBlockedAdmissionClaims: freezeArray(actualBlockedAdmissionClaims)
      })
    ];
  });
  const packageSurface = readPackageSurface({ workspaceRoot });
  const packageSurfaceMismatches = comparePackageSurface({
    actual: packageSurface,
    expected: expectedPackageSurface
  });
  const staticReadOnlyViolations = evaluatedRows
    .filter(
      (row) =>
        row.sourceTokenChecksOnly !== true ||
        row.manifestEvaluationOnly !== true ||
        row.runtimeExecutionClaimed !== false ||
        row.ledgerEvaluationMode !== "source-token-checks-and-manifest-only"
    )
    .map((row) => row.workerId);
  const compatibilityClaimWorkerIds = evaluatedRows
    .filter((row) => row.compatibilityClaimed !== false)
    .map((row) => row.workerId);
  const publicCompatibilityViolations = evaluatedRows.flatMap((row) =>
    row.publicCompatibilityViolations.map(
      (claimId) => `${row.workerId}.${claimId}`
    )
  );
  const blockedAdmissionClaimViolations = evaluatedRows.flatMap((row) =>
    row.blockedAdmissionClaimViolations.map(
      (claimId) => `${row.workerId}.${claimId}`
    )
  );
  const promotionLeakWorkerIds = evaluatedRows
    .filter((row) => {
      if (row.privateAdmission === "accepted-private-ledger-evidence") {
        return row.promotion !== "not-applicable";
      }
      return row.promotion !== "rejected";
    })
    .map((row) => row.workerId);
  const unrecognizedWorkerIds = evaluatedRows
    .filter((row) => row.recognized !== true)
    .map((row) => row.workerId);

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("accepted-private-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-admission-evidence-file-or-token-missing",
    evidenceTokenMismatches
  );
  pushIdsViolation(
    violations,
    "required-private-admission-row-not-recognized",
    unrecognizedWorkerIds
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-id-mismatch",
    acceptedDiagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "prior-private-admission-ledger-context-mismatch",
    priorLedgerContextMismatches
  );
  pushRowsViolation(
    violations,
    "accepted-private-required-guard-mismatch",
    requiredGuardMismatches
  );
  pushRowsViolation(
    violations,
    "public-package-surface-mismatch",
    packageSurfaceMismatches
  );
  pushRowsViolation(
    violations,
    "public-compatibility-claim-key-mismatch",
    publicCompatibilityClaimKeyMismatches
  );
  pushRowsViolation(
    violations,
    "blocked-public-compatibility-surface-mismatch",
    blockedSurfaceMismatches
  );
  pushRowsViolation(
    violations,
    "blocked-public-claim-mismatch",
    blockedPublicClaimMismatches
  );
  pushRowsViolation(
    violations,
    "blocked-admission-claim-mismatch",
    blockedAdmissionClaimMismatches
  );
  pushIdsViolation(
    violations,
    "private-ledger-runtime-execution-claim",
    staticReadOnlyViolations
  );
  pushIdsViolation(
    violations,
    "private-diagnostic-claimed-compatibility",
    compatibilityClaimWorkerIds
  );
  pushClaimIdsViolation(
    violations,
    "public-compatibility-claim-detected",
    publicCompatibilityViolations
  );
  pushClaimIdsViolation(
    violations,
    "blocked-admission-claim-detected",
    blockedAdmissionClaimViolations
  );
  pushIdsViolation(
    violations,
    "private-diagnostic-public-promotion-leak",
    promotionLeakWorkerIds
  );

  const evidenceRecognized = evidenceTokenMismatches.length === 0;
  const acceptedDiagnosticsRecognized =
    acceptedDiagnosticMismatches.length === 0;
  const priorLedgerContextRecognized =
    priorLedgerContextMismatches.length === 0;
  const requiredGuardsRecognized = requiredGuardMismatches.length === 0;
  const blockedPublicSurfacesRecognized =
    blockedSurfaceMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicCompatibilityClaimKeyMismatches.length === 0 &&
    blockedPublicClaimMismatches.length === 0 &&
    publicCompatibilityViolations.length === 0;
  const blockedAdmissionClaimsRecognized =
    blockedAdmissionClaimMismatches.length === 0 &&
    blockedAdmissionClaimViolations.length === 0;
  const packageSurfaceRecognized = packageSurfaceMismatches.length === 0;
  const staticReadOnlyRecognized = staticReadOnlyViolations.length === 0;
  const rowAdmissionRecognized = unrecognizedWorkerIds.length === 0;
  const compatibilityClaimed =
    compatibilityClaimWorkerIds.length > 0 ||
    publicCompatibilityViolations.length > 0 ||
    blockedAdmissionClaimViolations.length > 0 ||
    promotionLeakWorkerIds.length > 0;
  const publicCompatibilityClaimed = publicCompatibilityViolations.length > 0;
  const privateDiagnosticsRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0 &&
    rowAdmissionRecognized &&
    evidenceRecognized &&
    acceptedDiagnosticsRecognized &&
    priorLedgerContextRecognized &&
    requiredGuardsRecognized &&
    blockedPublicSurfacesRecognized &&
    blockedPublicClaimsRecognized &&
    blockedAdmissionClaimsRecognized &&
    packageSurfaceRecognized &&
    staticReadOnlyRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_754_766_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_754_766_GATE_STATUS
      : PRIVATE_ADMISSION_754_766_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    rowAdmissionRecognized,
    evidenceRecognized,
    acceptedDiagnosticsRecognized,
    priorLedgerContextRecognized,
    requiredGuardsRecognized,
    blockedPublicSurfacesRecognized,
    blockedPublicClaimsRecognized,
    blockedAdmissionClaimsRecognized,
    packageSurfaceRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed,
    publicCompatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_754_766_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((row) => row.recognized === true)
        .map((row) => row.workerId)
    ),
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolationIds: freezeArray(
      blockedAdmissionClaimViolations
    ),
    packageSurface,
    manifest,
    rows: freezeArray(evaluatedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    violations: freezeArray(violations)
  });
}

export function readPackageSurface({ workspaceRoot = DEFAULT_WORKSPACE_ROOT } = {}) {
  return freezeRecord(
    Object.fromEntries(
      Object.entries(PRIVATE_ADMISSION_754_766_EXPECTED_PACKAGE_SURFACE).map(
        ([packageName, expected]) => {
          const packageJson = JSON.parse(
            readFileSync(join(workspaceRoot, expected.packagePath), "utf8")
          );
          const manifest = readManifestSurface(packageJson, expected.manifest);
          const runtimeExportKeys =
            expected.runtimePath == null
              ? []
              : readRuntimeExportKeys({
                  workspaceRoot,
                  path: expected.runtimePath
                });
          const esmRuntimeExportKeys =
            expected.esmRuntimePath == null
              ? []
              : readEsmRuntimeExportKeys({
                  workspaceRoot,
                  path: expected.esmRuntimePath
                });
          const subpathRuntimeExports = freezeRecord(
            Object.fromEntries(
              Object.keys(expected.subpathRuntimeExports).map((subpath) => [
                subpath,
                readRuntimeExportKeys({ workspaceRoot, path: subpath })
              ])
            )
          );
          const runtimeThrowSubpaths = freezeRecord(
            Object.fromEntries(
              Object.keys(expected.runtimeThrowSubpaths).map((subpath) => [
                subpath,
                readRuntimeThrowResult({ workspaceRoot, path: subpath })
              ])
            )
          );

          return [
            packageName,
            packageSurface({
              packagePath: expected.packagePath,
              manifest,
              packageExports: packageJson.exports ?? null,
              runtimePath: expected.runtimePath,
              runtimeExportKeys,
              esmRuntimePath: expected.esmRuntimePath,
              esmRuntimeExportKeys,
              subpathRuntimeExports,
              runtimeThrowSubpaths
            })
          ];
        }
      )
    )
  );
}

const acceptedPrivateAdmissionKinds = new Set(
  rowData754766.map((row) => row.privateAdmission)
);

function rowData(data) {
  return freezeRecord({
    ...data,
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function evidenceData({ role, path, tokens, forbiddenTokens = [] }) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens),
    forbiddenTokens: freezeArray(forbiddenTokens)
  });
}

function guard({
  canonicalDiagnosticNamesPinned,
  staleEvidenceRejected,
  aliasEvidenceRejected,
  clonedEvidenceRejected,
  publicCompatibilityBlocked,
  packageSurfaceUnchanged,
  staticReadOnlyLedger = false
}) {
  return freezeRecord({
    canonicalDiagnosticNamesPinned,
    staleEvidenceRejected,
    aliasEvidenceRejected,
    clonedEvidenceRejected,
    publicCompatibilityBlocked,
    packageSurfaceUnchanged,
    staticReadOnlyLedger
  });
}

function packageSurface({
  packagePath,
  manifest,
  packageExports,
  runtimePath,
  runtimeExportKeys,
  esmRuntimePath = null,
  esmRuntimeExportKeys = [],
  subpathRuntimeExports = {},
  runtimeThrowSubpaths = {}
}) {
  return freezeRecord({
    packagePath,
    manifest: freezeJson(manifest),
    packageExports: freezeJson(packageExports),
    runtimePath,
    runtimeExportKeys: freezeArray(runtimeExportKeys),
    esmRuntimePath,
    esmRuntimeExportKeys: freezeArray(esmRuntimeExportKeys),
    subpathRuntimeExports: freezeRecord(
      Object.fromEntries(
        Object.entries(subpathRuntimeExports).map(([path, keys]) => [
          path,
          freezeArray(keys)
        ])
      )
    ),
    runtimeThrowSubpaths: freezeRecord(
      Object.fromEntries(
        Object.entries(runtimeThrowSubpaths).map(([path, result]) => [
          path,
          freezeJson(result)
        ])
      )
    )
  });
}

function admissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_754_766_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function blockedAdmissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_754_766_BLOCKED_ADMISSION_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function row({
  workerId,
  privateAdmission,
  area,
  primaryCompatibilityArea,
  acceptedDiagnosticIds,
  priorLedgerContext,
  requiredGuards,
  runtimeCapabilityAdded,
  promotion,
  evidence,
  publicCompatibilityClaims,
  privateAdmissionClaims
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue: "754-766",
    privateAdmission,
    localGateCoverage: "private-admission-754-766-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    priorLedgerContext: freezeArray(priorLedgerContext),
    requiredGuards: freezeRecord(requiredGuards),
    evidence: freezeArray(evidence),
    runtimeCapabilityAdded,
    compatibilityClaimed: false,
    promotion,
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    runtimeExecutionClaimed: false,
    ledgerEvaluationMode: "source-token-checks-and-manifest-only",
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_754_766_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims)),
    blockedAdmissionClaims: freezeRecord(privateAdmissionClaims),
    blockedAdmissionClaimIds: freezeArray(Object.keys(privateAdmissionClaims))
  });
}

function mergeRowOverride(row, override) {
  if (override == null || Object.keys(override).length === 0) {
    return row;
  }

  const merged = { ...row, ...override };
  const arrayKeys = [
    "acceptedDiagnosticIds",
    "priorLedgerContext",
    "blockedPublicCompatibilitySurfaces",
    "blockedPublicClaims",
    "blockedAdmissionClaimIds",
    "evidence"
  ];
  for (const key of arrayKeys) {
    if (Object.hasOwn(override, key)) {
      merged[key] = freezeArray(override[key]);
    }
  }
  if (Object.hasOwn(override, "publicCompatibilityClaims")) {
    merged.publicCompatibilityClaims = freezeRecord({
      ...row.publicCompatibilityClaims,
      ...override.publicCompatibilityClaims
    });
  }
  if (Object.hasOwn(override, "blockedAdmissionClaims")) {
    merged.blockedAdmissionClaims = freezeRecord({
      ...row.blockedAdmissionClaims,
      ...override.blockedAdmissionClaims
    });
  }
  if (Object.hasOwn(override, "requiredGuards")) {
    merged.requiredGuards = freezeRecord({
      ...row.requiredGuards,
      ...override.requiredGuards
    });
  }

  return freezeRecord(merged);
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot })
  );
  const publicCompatibilityViolations = Object.entries(
    row.publicCompatibilityClaims ?? {}
  )
    .filter(([, claimed]) => claimed !== false)
    .map(([claimId]) => claimId);
  const blockedAdmissionClaimViolations = Object.entries(
    row.blockedAdmissionClaims ?? {}
  )
    .filter(([, claimed]) => claimed !== false)
    .map(([claimId]) => claimId);
  const recognized = acceptedPrivateAdmissionKinds.has(row.privateAdmission);

  return freezeRecord({
    ...row,
    recognized,
    evidence: freezeArray(evidence),
    evidenceRecognized: evidence.every(
      (evidenceRow) => evidenceRow.recognized === true
    ),
    publicCompatibilityViolations: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolations: freezeArray(
      blockedAdmissionClaimViolations
    )
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const fileText = readWorkspaceFile({
    fileCache,
    path: evidenceRow.path,
    workspaceRoot
  });
  const missingTokens =
    fileText.ok === true
      ? evidenceRow.tokens.filter((token) => !fileText.value.includes(token))
      : evidenceRow.tokens;
  const forbiddenTokensPresent =
    fileText.ok === true
      ? evidenceRow.forbiddenTokens.filter((token) => fileText.value.includes(token))
      : [];

  return freezeRecord({
    ...evidenceRow,
    recognized:
      fileText.ok === true &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0,
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    readError: fileText.ok === true ? null : fileText.error
  });
}

function readWorkspaceFile({ fileCache, path, workspaceRoot }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  let result;
  try {
    result = freezeRecord({
      ok: true,
      value: readFileSync(join(workspaceRoot, path), "utf8")
    });
  } catch (error) {
    result = freezeRecord({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
  fileCache.set(path, result);
  return result;
}

function readManifestSurface(packageJson, expectedManifest) {
  return freezeRecord(
    Object.fromEntries(
      Object.keys(expectedManifest).map((key) => [
        key,
        freezeJson(Object.hasOwn(packageJson, key) ? packageJson[key] : null)
      ])
    )
  );
}

function readRuntimeExportKeys({ workspaceRoot, path }) {
  const require = createRequire(
    pathToFileURL(
      join(
        workspaceRoot,
        "tests/conformance/src/private-admission-754-766-gate.mjs"
      )
    )
  );
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    const moduleValue = require(join(workspaceRoot, path));
    return freezeArray(Object.keys(moduleValue).sort());
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function readRuntimeThrowResult({ workspaceRoot, path }) {
  const require = createRequire(
    pathToFileURL(
      join(
        workspaceRoot,
        "tests/conformance/src/private-admission-754-766-gate.mjs"
      )
    )
  );
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    const moduleValue = require(join(workspaceRoot, path));
    return freezeRecord({
      status: "ok",
      exportKeys: freezeArray(Object.keys(moduleValue).sort()),
      errorName: null,
      errorCode: null
    });
  } catch (error) {
    return freezeRecord({
      status: "throws",
      exportKeys: freezeArray([]),
      errorName: error instanceof Error ? error.name : null,
      errorCode:
        error && typeof error === "object" && "code" in error
          ? error.code
          : null
    });
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function readEsmRuntimeExportKeys({ workspaceRoot, path }) {
  const moduleUrl = pathToFileURL(join(workspaceRoot, path)).href;
  const script = [
    `const moduleValue = await import(${JSON.stringify(moduleUrl)});`,
    "console.log(JSON.stringify(Object.keys(moduleValue).sort()));"
  ].join("\n");
  const output = execFileSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    {
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "development" }
    }
  );
  return freezeArray(JSON.parse(output));
}

function compareRequiredArrayByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const expected = requiredByWorker[row.workerId] ?? [];
    const actual = row[actualKey] ?? [];
    if (sameStringSet(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: freezeArray(expected),
        [actualKeyForViolation]: freezeArray(actual)
      })
    ];
  });
}

function compareRequiredRecordByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const expected = requiredByWorker[row.workerId] ?? {};
    const actual = row[actualKey] ?? {};
    if (sameRecord(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: freezeRecord(expected),
        [actualKeyForViolation]: freezeRecord(actual)
      })
    ];
  });
}

function comparePackageSurface({ actual, expected }) {
  return Object.entries(expected).flatMap(([packageName, expectedSurface]) => {
    const actualSurface = actual[packageName];
    if (sameJson(expectedSurface, actualSurface)) {
      return [];
    }
    return [
      freezeRecord({
        packageName,
        expectedPackageSurface: expectedSurface,
        actualPackageSurface: actualSurface
      })
    ];
  });
}

function createViolation(id, details = {}) {
  return freezeRecord({ id, ...details });
}

function pushRowsViolation(violations, id, rows) {
  if (rows.length > 0) {
    violations.push(createViolation(id, { rows: freezeArray(rows) }));
  }
}

function pushIdsViolation(violations, id, workerIds) {
  if (workerIds.length > 0) {
    violations.push(createViolation(id, { workerIds: freezeArray(workerIds) }));
  }
}

function pushClaimIdsViolation(violations, id, claimIds) {
  if (claimIds.length > 0) {
    violations.push(createViolation(id, { claimIds: freezeArray(claimIds) }));
  }
}

function indexRowsByWorker(rows) {
  return freezeRecord(
    Object.fromEntries(rows.map((row) => [row.workerId, row]))
  );
}

function sameStringSet(left, right) {
  return (
    left.length === right.length && left.every((value) => right.includes(value))
  );
}

function sameRecord(left, right) {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    sameStringSet(leftKeys, rightKeys) &&
    leftKeys.every((key) => left[key] === right[key])
  );
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function freezeUniqueArray(values) {
  return freezeArray([...new Set(values)]);
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze({ ...record });
}

function freezeJson(value) {
  if (Array.isArray(value)) {
    return freezeArray(value.map((item) => freezeJson(item)));
  }
  if (value && typeof value === "object") {
    return freezeRecord(
      Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [
          key,
          freezeJson(nestedValue)
        ])
      )
    );
  }
  return value ?? null;
}
