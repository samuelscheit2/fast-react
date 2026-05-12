import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS
} from "./react-dom-root-render-e2e-scenarios.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES
} from "./react-dom-root-render-e2e-targets.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);
const require = createRequire(import.meta.url);

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_GATE_ID =
  "root-render-private-host-output-diagnostic-gate-1";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS =
  "accepted-private-root-host-output-diagnostic";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_BLOCKED_STATUS =
  "blocked-private-root-host-output-diagnostic";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ADMISSIONS =
  Object.freeze([
    {
      scenarioId: "create-root-no-render",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "The private root bridge can apply and revert explicit createRoot marker/listener diagnostics without exposing a public root object or mutating host children."
    },
    {
      scenarioId: "initial-host-render",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM HostComponent/HostText helpers can produce initial host output behind a private render request while public createRoot remains blocked."
    },
    {
      scenarioId: "update-host-render",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM property/text mutation helpers can update host output and publish latest props only after mutation handoff validation."
    },
    {
      scenarioId: "replace-host-tree",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM removal and placement helpers can replace the root host child while detaching the old latest-props mapping."
    },
    {
      scenarioId: "render-null-clears-container",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM clearContainer and component-tree detach helpers can clear mounted host output while the private root marker/listener gate remains active."
    },
    {
      scenarioId: "root-unmount",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private unmount diagnostics can clear fake host output and revert explicit createRoot marker/listener side effects without admitting public root unmount behavior."
    },
    {
      scenarioId: "double-unmount",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM unmount diagnostics can prove the first unmount clears host output and the second private unmount records no additional host mutation."
    },
    {
      scenarioId: "render-after-unmount",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM unmount diagnostics can prove the stale render guard throws after host output is cleared without mutating the container again."
    },
    {
      scenarioId: "flush-sync-cross-root-render",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private flushSync guard, reconciler cross-root sync-flush diagnostics, and fake-DOM host-output helpers prove two private root.render requests can be flushed and committed together without admitting public flushSync behavior."
    },
    ...REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.filter(
      (scenarioId) =>
        ![
          "create-root-no-render",
          "initial-host-render",
          "update-host-render",
          "replace-host-tree",
          "render-null-clears-container",
          "root-unmount",
          "double-unmount",
          "render-after-unmount",
          "flush-sync-cross-root-render"
        ].includes(scenarioId)
    ).map((scenarioId) => ({
      scenarioId,
      admission: "unsupported",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_BLOCKED_STATUS,
      reason:
        "This root E2E scenario still needs private warning-boundary evidence before it can be admitted as a host-output diagnostic row."
    }))
  ]);

export function inspectReactDomRootRenderE2EPrivateHostOutputDiagnostics({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  try {
    const modules = loadPrivateHostOutputModules(workspaceRoot);
    const rows = [];

    for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
      for (const admission of REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ADMISSIONS) {
        if (admission.admission !== "private-host-output-diagnostic") {
          continue;
        }

        rows.push(
          runPrivateHostOutputDiagnosticScenario({
            mode,
            modules,
            scenarioId: admission.scenarioId
          })
        );
      }
    }

    return {
      loadError: null,
      rows
    };
  } catch (error) {
    return {
      loadError: describePrivateBridgeError(error),
      rows: []
    };
  }
}

function loadPrivateBridgeModules(workspaceRoot) {
  const reactDomRoot = join(workspaceRoot, "packages/react-dom");
  return {
    rootBridge: require(join(reactDomRoot, "src/client/root-bridge.js")),
    rootMarkers: require(join(reactDomRoot, "src/client/root-markers.js")),
    listenerRegistry: require(
      join(reactDomRoot, "src/events/listener-registry.js")
    ),
    domContainer: require(join(reactDomRoot, "src/client/dom-container.js"))
  };
}

function loadPrivateHostOutputModules(workspaceRoot) {
  const reactDomRoot = join(workspaceRoot, "packages/react-dom");
  return {
    ...loadPrivateBridgeModules(workspaceRoot),
    componentTree: require(join(reactDomRoot, "src/client/component-tree.js")),
    domHost: require(join(reactDomRoot, "src/dom-host/mutation.js")),
    flushSyncGuard: require(join(reactDomRoot, "src/shared/flush-sync-guard.js")),
    syncFlushCrossRootReconcilerDiagnostics:
      inspectSyncFlushCrossRootReconcilerDiagnostics({ workspaceRoot })
  };
}

function runPrivateHostOutputDiagnosticScenario({ mode, modules, scenarioId }) {
  try {
    const harness = createPrivateHostOutputHarness({
      mode,
      modules,
      scenarioId
    });
    const sideEffects = applyPrivateHostOutputRootSideEffects(harness);
    let hostOutputEvidence;

    if (scenarioId === "create-root-no-render") {
      hostOutputEvidence = {
        childNodeNames: summarizeChildNodeNames(harness.container),
        containerChildCount: harness.container.childNodes.length,
        containerTextContent: harness.container.textContent,
        hostMutationObserved: false,
        latestPropsPublished: false
      };
    } else if (scenarioId === "initial-host-render") {
      const render = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, render);
      hostOutputEvidence = mountPrivateInitialHostOutput(harness);
    } else if (scenarioId === "update-host-render") {
      const initialRender = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, initialRender);
      const mounted = mountPrivateInitialHostOutput(harness);
      const updateRender = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("updated")
      );
      recordPrivateHostOutputRootRequest(harness, updateRender);
      hostOutputEvidence = updatePrivateHostOutput(harness, mounted);
    } else if (scenarioId === "replace-host-tree") {
      const initialRender = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("replace-before")
      );
      recordPrivateHostOutputRootRequest(harness, initialRender);
      const mounted = mountPrivateReplacementInitialHostOutput(harness);
      const replaceRender = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("replace-after")
      );
      recordPrivateHostOutputRootRequest(harness, replaceRender);
      hostOutputEvidence = replacePrivateHostOutput(harness, mounted);
    } else if (scenarioId === "render-null-clears-container") {
      const render = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, render);
      const mounted = mountPrivateInitialHostOutput(harness);
      const renderNull = harness.bridge.renderContainer(
        harness.create.handle,
        null
      );
      recordPrivateHostOutputRootRequest(harness, renderNull);
      hostOutputEvidence = renderNullPrivateHostOutput(harness, mounted);
    } else if (scenarioId === "root-unmount") {
      const render = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, render);
      const mounted = mountPrivateInitialHostOutput(harness);
      const unmount = harness.bridge.unmountContainer(harness.create.handle);
      recordPrivateHostOutputRootRequest(harness, unmount);
      hostOutputEvidence = unmountPrivateHostOutput(harness, mounted);
    } else if (scenarioId === "double-unmount") {
      const render = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, render);
      const mounted = mountPrivateInitialHostOutput(harness);
      const firstUnmount = harness.bridge.unmountContainer(
        harness.create.handle
      );
      recordPrivateHostOutputRootRequest(harness, firstUnmount);
      hostOutputEvidence = unmountPrivateHostOutput(harness, mounted);
      const secondUnmount = harness.bridge.unmountContainer(
        harness.create.handle
      );
      recordPrivateHostOutputRootRequest(harness, secondUnmount);
      hostOutputEvidence = recordPrivateDoubleUnmountNoop(
        harness,
        hostOutputEvidence
      );
    } else if (scenarioId === "render-after-unmount") {
      const render = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, render);
      const mounted = mountPrivateInitialHostOutput(harness);
      const unmount = harness.bridge.unmountContainer(harness.create.handle);
      recordPrivateHostOutputRootRequest(harness, unmount);
      hostOutputEvidence = unmountPrivateHostOutput(harness, mounted);
      hostOutputEvidence = recordPrivateRenderAfterUnmountGuard(
        harness,
        hostOutputEvidence
      );
    } else if (scenarioId === "flush-sync-cross-root-render") {
      hostOutputEvidence = flushSyncCrossRootPrivateHostOutput(harness);
    } else {
      throw new Error(
        `No private host-output diagnostic plan for scenario: ${scenarioId}`
      );
    }

    const cleanup = cleanupPrivateHostOutputRootSideEffects(
      harness,
      sideEffects.rawRecord
    );
    const { rawRecord, ...sideEffectEvidence } = sideEffects;

    return {
      modeId: mode.id,
      scenarioId,
      status: "ok",
      evidence: {
        compatibilityClaimed: false,
        comparedToReactDomOracle: false,
        diagnosticKind: "private-fake-dom-root-host-output",
        hostOutputEvidence,
        publicRootCompatibilitySurface: false,
        rootBridgeEvidence: summarizePrivateHostOutputRootBridgeEvidence(
          harness
        ),
        rootSideEffectEvidence: {
          ...sideEffectEvidence,
          cleanup
        }
      }
    };
  } catch (error) {
    return {
      modeId: mode.id,
      scenarioId,
      status: "throws",
      error: describePrivateBridgeError(error)
    };
  }
}

function createPrivateHostOutputHarness({ mode, modules, scenarioId }) {
  const document = createPrivateHostOutputDocument({
    domContainer: modules.domContainer,
    label: `${mode.id}:${scenarioId}:host-output`
  });
  const container = document.createElement("div");
  const bridge = modules.rootBridge.createPrivateRootBridgeShell({
    requestIdPrefix: "host-output-request",
    rootIdPrefix: "host-output-root",
    sideEffectIdPrefix: "host-output-side-effect",
    updateIdPrefix: "host-output-update"
  });
  const create = bridge.createClientRoot(container);
  const harness = {
    bridge,
    container,
    create,
    document,
    mode,
    modules,
    nativeHandoffRecords: [],
    requestAdmissionRecords: [],
    requestRecords: [],
    scenarioId,
    thrownOperations: [],
    rootOwner: modules.rootBridge.getRootOwnerFromHandle(create.handle)
  };
  recordPrivateHostOutputRootRequest(harness, create);
  return harness;
}

function createPrivateCrossRootSchedulingHarness({ mode, modules, scenarioId }) {
  const document = createPrivateHostOutputDocument({
    domContainer: modules.domContainer,
    label: `${mode.id}:${scenarioId}:cross-root-scheduling`
  });
  const container = document.createElement("div");
  const bridge = modules.rootBridge.createPrivateRootBridgeShell({
    requestIdPrefix: "cross-root-scheduling-request",
    rootIdPrefix: "cross-root-scheduling-root",
    sideEffectIdPrefix: "cross-root-scheduling-side-effect",
    updateIdPrefix: "cross-root-scheduling-update"
  });
  const create = bridge.createClientRoot(container);
  const harness = {
    bridge,
    container,
    create,
    document,
    mode,
    modules,
    nativeHandoffRecords: [],
    requestAdmissionRecords: [],
    requestRecords: [],
    scenarioId,
    thrownOperations: [],
    rootOwner: modules.rootBridge.getRootOwnerFromHandle(create.handle)
  };
  recordPrivateHostOutputRootRequest(harness, create);
  return harness;
}

function recordPrivateHostOutputRootRequest(harness, record) {
  harness.requestRecords.push(normalizePrivateBridgeRequestRecord(record));
  harness.requestAdmissionRecords.push(
    summarizePrivateRootBridgeAdmissionRecord(harness.bridge.admitRequest(record))
  );
  harness.nativeHandoffRecords.push(
    summarizeNativeRootBridgeHandoffRecord(
      harness.bridge.createNativeRequestHandoff(record)
    )
  );
}

function applyPrivateHostOutputRootSideEffects(harness) {
  return applyPrivateHostOutputRootSideEffectsForRoot(harness, {
    container: harness.container,
    create: harness.create,
    document: harness.document
  });
}

function applyPrivateHostOutputRootSideEffectsForRoot(harness, root) {
  const before = summarizePrivateRootMarkerListenerState({
    container: root.container,
    document: root.document,
    modules: harness.modules
  });
  const record = harness.bridge.applyCreateRootSideEffects(root.create);
  const afterApply = summarizePrivateRootMarkerListenerState({
    container: root.container,
    document: root.document,
    modules: harness.modules
  });
  return {
    afterApply,
    before,
    rawRecord: record,
    record: summarizePrivateRootCreateSideEffectRecord(record)
  };
}

function cleanupPrivateHostOutputRootSideEffects(harness, rawRecord) {
  return cleanupPrivateHostOutputRootSideEffectsForRoot(
    harness,
    {
      container: harness.container,
      document: harness.document
    },
    rawRecord
  );
}

function cleanupPrivateHostOutputRootSideEffectsForRoot(
  harness,
  root,
  rawRecord
) {
  const cleanupRecord = harness.bridge.revertCreateRootSideEffects(rawRecord);
  return {
    afterCleanup: summarizePrivateRootMarkerListenerState({
      container: root.container,
      document: root.document,
      modules: harness.modules
    }),
    record: summarizePrivateRootCreateSideEffectCleanupRecord(cleanupRecord)
  };
}

function mountPrivateInitialHostOutput(harness) {
  const previousProps = {};
  const nextProps = createPrivateHostOutputProps("initial");
  const host = harness.document.createElement("div");
  const token = harness.modules.componentTree.createHostInstanceToken(
    {
      kind: "PrivateHostOutputDiagnosticHost",
      phase: "initial"
    },
    harness.rootOwner
  );
  harness.modules.componentTree.attachHostInstanceNode(
    host,
    token,
    previousProps
  );
  const handoff = harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
    host,
    "div",
    previousProps,
    nextProps
  );
  const latestPropsBeforeCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const handoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      handoff
    );
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(handoff);
  const latestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const text = harness.modules.domHost.createDomHostTextInstance(
    "hello",
    harness.container
  );

  harness.modules.domHost.appendInitialChild(host, text);
  harness.modules.domHost.appendChildToContainer(harness.container, host);

  return {
    attributes: summarizeAttributeEntries(host),
    childNodeNames: summarizeChildNodeNames(harness.container),
    containerChildCount: harness.container.childNodes.length,
    containerMutationLog: harness.container.mutationLog.slice(),
    containerTextContent: harness.container.textContent,
    handoff: summarizePrivateHostOutputHandoff(handoff, handoffPayload),
    hostAttributeLog: host.attributeLog.slice(),
    hostMutationObserved: true,
    latestPropsAfterCommit: summarizePrivateHostOutputProps(
      latestPropsAfterCommit
    ),
    latestPropsBeforeCommit: summarizePrivateHostOutputProps(
      latestPropsBeforeCommit
    ),
    latestPropsPublished: latestPropsAfterCommit === nextProps,
    textNodeValue: text.nodeValue,
    textWriteLog: text.writeLog.slice()
  };
}

function updatePrivateHostOutput(harness, mounted) {
  const host = harness.container.childNodes[0];
  const text = host.childNodes[0];
  const previousProps =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const nextProps = createPrivateHostOutputProps("updated");
  const handoff = harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
    host,
    "div",
    previousProps,
    nextProps
  );
  const latestPropsBeforeCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const handoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      handoff
    );
  harness.modules.domHost.commitTextUpdate(text, "hello", "goodbye");
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(handoff);
  const latestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);

  return {
    ...mounted,
    attributes: summarizeAttributeEntries(host),
    childNodeNames: summarizeChildNodeNames(harness.container),
    containerChildCount: harness.container.childNodes.length,
    containerTextContent: harness.container.textContent,
    handoff: summarizePrivateHostOutputHandoff(handoff, handoffPayload),
    hostAttributeLog: host.attributeLog.slice(),
    latestPropsAfterCommit: summarizePrivateHostOutputProps(
      latestPropsAfterCommit
    ),
    latestPropsBeforeCommit: summarizePrivateHostOutputProps(
      latestPropsBeforeCommit
    ),
    latestPropsPublished: latestPropsAfterCommit === nextProps,
    textNodeValue: text.nodeValue,
    textWriteLog: text.writeLog.slice(),
    updateMutationObserved: true
  };
}

function mountPrivateReplacementInitialHostOutput(harness) {
  const previousProps = {};
  const nextProps = createPrivateHostOutputProps("replace-before");
  const host = harness.document.createElement("span");
  const token = harness.modules.componentTree.createHostInstanceToken(
    {
      kind: "PrivateHostOutputDiagnosticHost",
      phase: "replace-before"
    },
    harness.rootOwner
  );
  harness.modules.componentTree.attachHostInstanceNode(
    host,
    token,
    previousProps
  );
  const handoff = harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
    host,
    "span",
    previousProps,
    nextProps
  );
  const handoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      handoff
    );
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(handoff);
  const latestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const text = harness.modules.domHost.createDomHostTextInstance(
    "before",
    harness.container
  );

  harness.modules.domHost.appendInitialChild(host, text);
  harness.modules.domHost.appendChildToContainer(harness.container, host);

  return {
    initialAttributes: summarizeAttributeEntries(host),
    initialChildNodeNames: summarizeChildNodeNames(harness.container),
    initialContainerTextContent: harness.container.textContent,
    initialHandoff: summarizePrivateHostOutputHandoff(
      handoff,
      handoffPayload
    ),
    initialLatestPropsPublished: latestPropsAfterCommit === nextProps
  };
}

function replacePrivateHostOutput(harness, mounted) {
  const previousHost = harness.container.childNodes[0];
  const replaceMutationStart = harness.container.mutationLog.length;
  harness.modules.domHost.removeChildFromContainer(
    harness.container,
    previousHost
  );
  harness.modules.componentTree.detachHostInstanceNode(previousHost);

  const replacementHost = harness.document.createElement("section");
  const replacementPreviousProps = {};
  const replacementNextProps = createPrivateHostOutputProps("replace-after");
  const replacementToken =
    harness.modules.componentTree.createHostInstanceToken(
      {
        kind: "PrivateHostOutputDiagnosticHost",
        phase: "replace-after"
      },
      harness.rootOwner
    );
  harness.modules.componentTree.attachHostInstanceNode(
    replacementHost,
    replacementToken,
    replacementPreviousProps
  );
  const replacementHandoff =
    harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
      replacementHost,
      "section",
      replacementPreviousProps,
      replacementNextProps
    );
  const replacementHandoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      replacementHandoff
    );
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(
    replacementHandoff
  );
  const replacementLatestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(replacementHost);

  const bold = harness.document.createElement("b");
  const boldPreviousProps = {};
  const boldNextProps = createPrivateHostOutputProps("replace-bold");
  const boldToken = harness.modules.componentTree.createHostInstanceToken(
    {
      kind: "PrivateHostOutputDiagnosticHost",
      phase: "replace-bold"
    },
    harness.rootOwner
  );
  harness.modules.componentTree.attachHostInstanceNode(
    bold,
    boldToken,
    boldPreviousProps
  );
  const boldHandoff =
    harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
      bold,
      "b",
      boldPreviousProps,
      boldNextProps
    );
  const boldHandoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      boldHandoff
    );
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(
    boldHandoff
  );
  const boldLatestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(bold);
  const text = harness.modules.domHost.createDomHostTextInstance(
    "after",
    harness.container
  );

  harness.modules.domHost.appendInitialChild(bold, text);
  harness.modules.domHost.appendInitialChild(replacementHost, bold);
  harness.modules.domHost.appendChildToContainer(
    harness.container,
    replacementHost
  );

  return {
    ...mounted,
    nestedChildNodeNames: summarizeChildNodeNames(replacementHost),
    nestedHandoff: summarizePrivateHostOutputHandoff(
      boldHandoff,
      boldHandoffPayload
    ),
    nestedLatestPropsPublished: boldLatestPropsAfterCommit === boldNextProps,
    removedHostDetachedFromLatestPropsMap:
      harness.modules.componentTree.getLatestPropsFromNode(previousHost) ===
      null,
    replaceAttributes: summarizeAttributeEntries(replacementHost),
    replaceChildNodeNames: summarizeChildNodeNames(harness.container),
    replaceContainerChildCount: harness.container.childNodes.length,
    replaceContainerTextContent: harness.container.textContent,
    replacementHandoff: summarizePrivateHostOutputHandoff(
      replacementHandoff,
      replacementHandoffPayload
    ),
    replacementLatestPropsPublished:
      replacementLatestPropsAfterCommit === replacementNextProps,
    replaceMutationLog: harness.container.mutationLog.slice(
      replaceMutationStart
    ),
    textNodeValue: text.nodeValue,
    textWriteLog: text.writeLog.slice()
  };
}

function renderNullPrivateHostOutput(harness, mounted) {
  const host = harness.container.childNodes[0] ?? null;
  const renderNullMutationStart = harness.container.mutationLog.length;
  if (host !== null) {
    harness.modules.domHost.clearContainer(harness.container);
    harness.modules.componentTree.detachHostInstanceNode(host);
  }

  return {
    ...mounted,
    childNodeNamesAfterRenderNull: summarizeChildNodeNames(harness.container),
    containerChildCountAfterRenderNull: harness.container.childNodes.length,
    containerTextContentAfterRenderNull: harness.container.textContent,
    hostDetachedFromLatestPropsMap:
      host === null
        ? false
        : harness.modules.componentTree.getLatestPropsFromNode(host) === null,
    renderNullMutationLog: harness.container.mutationLog.slice(
      renderNullMutationStart
    ),
    renderNullMutationObserved: true,
    rootSideEffectStateAfterRenderNull:
      summarizePrivateRootMarkerListenerState(harness)
  };
}

function unmountPrivateHostOutput(harness, mounted) {
  const host = harness.container.childNodes[0] ?? null;
  if (host !== null) {
    harness.modules.domHost.clearContainer(harness.container);
    harness.modules.componentTree.detachHostInstanceNode(host);
  }

  return {
    ...mounted,
    childNodeNamesAfterUnmount: summarizeChildNodeNames(harness.container),
    containerChildCountAfterUnmount: harness.container.childNodes.length,
    containerMutationLogAfterUnmount: harness.container.mutationLog.slice(),
    containerTextContentAfterUnmount: harness.container.textContent,
    hostDetachedFromLatestPropsMap:
      host === null
        ? false
        : harness.modules.componentTree.getLatestPropsFromNode(host) === null,
    unmountMutationObserved: true
  };
}

function recordPrivateDoubleUnmountNoop(harness, unmounted) {
  const secondUnmountMutationStart = harness.container.mutationLog.length;
  const secondUnmountRecord =
    harness.requestRecords[harness.requestRecords.length - 1];

  return {
    ...unmounted,
    childNodeNamesAfterSecondUnmount: summarizeChildNodeNames(
      harness.container
    ),
    containerChildCountAfterSecondUnmount: harness.container.childNodes.length,
    containerTextContentAfterSecondUnmount: harness.container.textContent,
    secondUnmountBridgeNoOp: secondUnmountRecord?.noOp === true,
    secondUnmountHostMutationObserved: false,
    secondUnmountMutationLog: harness.container.mutationLog.slice(
      secondUnmountMutationStart
    )
  };
}

function recordPrivateRenderAfterUnmountGuard(harness, unmounted) {
  const renderAfterUnmountMutationStart = harness.container.mutationLog.length;
  let thrownError = null;
  try {
    harness.bridge.renderContainer(
      harness.create.handle,
      createPrivateHostOutputElementValue("stale")
    );
  } catch (error) {
    thrownError = describePrivateBridgeError(error);
    harness.thrownOperations.push({
      operation: "root.render",
      error: thrownError
    });
  }

  if (thrownError === null) {
    throw new Error("Private host-output render-after-unmount did not throw.");
  }

  return {
    ...unmounted,
    childNodeNamesAfterRenderAttempt: summarizeChildNodeNames(
      harness.container
    ),
    containerChildCountAfterRenderAttempt: harness.container.childNodes.length,
    containerTextContentAfterRenderAttempt: harness.container.textContent,
    renderAfterUnmountError: thrownError,
    renderAfterUnmountHostMutationObserved: false,
    renderAfterUnmountMutationLog: harness.container.mutationLog.slice(
      renderAfterUnmountMutationStart
    )
  };
}

function flushSyncCrossRootPrivateHostOutput(harness) {
  const firstRoot = {
    container: harness.container,
    create: harness.create,
    document: harness.document,
    rootOwner: harness.rootOwner
  };
  const secondRoot = createAdditionalPrivateHostOutputRoot(
    harness,
    "cross-root-b"
  );
  recordPrivateHostOutputRootRequest(harness, secondRoot.create);
  const secondSideEffects =
    applyPrivateHostOutputRootSideEffectsForRoot(harness, secondRoot);
  const { rawRecord: secondRawSideEffectRecord, ...secondSideEffectEvidence } =
    secondSideEffects;

  const callbackEvents = [];
  const firstRender = harness.bridge.renderContainer(
    firstRoot.create.handle,
    createPrivateHostOutputElementValue("cross-a")
  );
  recordPrivateHostOutputRootRequest(harness, firstRender);
  callbackEvents.push("root.render:first");
  const secondRender = harness.bridge.renderContainer(
    secondRoot.create.handle,
    createPrivateHostOutputElementValue("cross-b")
  );
  recordPrivateHostOutputRootRequest(harness, secondRender);
  callbackEvents.push("root.render:second");

  const flushSyncWarnings = [];
  const flushSyncWorkWasInRender =
    harness.modules.flushSyncGuard.finishFlushSyncGuard(
      {
        f() {
          callbackEvents.push("flushSyncWork");
          return false;
        }
      },
      {
        console: {
          error(message) {
            flushSyncWarnings.push(message);
          }
        },
        development: harness.mode.nodeEnv !== "production"
      }
    );
  const rootSideEffectStateAfterFlush = {
    first: summarizePrivateRootMarkerListenerState({
      container: firstRoot.container,
      document: firstRoot.document,
      modules: harness.modules
    }),
    second: summarizePrivateRootMarkerListenerState({
      container: secondRoot.container,
      document: secondRoot.document,
      modules: harness.modules
    })
  };
  const firstHostOutput = mountPrivateCrossRootHostOutput(
    harness,
    firstRoot,
    "cross-a"
  );
  const secondHostOutput = mountPrivateCrossRootHostOutput(
    harness,
    secondRoot,
    "cross-b"
  );
  const secondCleanup = cleanupPrivateHostOutputRootSideEffectsForRoot(
    harness,
    secondRoot,
    secondRawSideEffectRecord
  );

  return {
    firstRoot: firstHostOutput,
    flushSyncEvidence: {
      callbackEvents,
      callbackRenderRequestCount: 2,
      callbackReturnValue: "two-root-flush-complete",
      committedRootCountAfterFlush: 2,
      flushSyncGuardWarningCount: flushSyncWarnings.length,
      flushSyncWorkCallCount: callbackEvents.filter(
        (event) => event === "flushSyncWork"
      ).length,
      flushSyncWorkWasInRender,
      privateReconcilerDiagnostics:
        harness.modules.syncFlushCrossRootReconcilerDiagnostics,
      publicFlushSyncCompatibilityClaimed: false,
      rootSideEffectStateAfterFlush
    },
    secondRoot: secondHostOutput,
    secondRootSideEffectEvidence: {
      ...secondSideEffectEvidence,
      cleanup: secondCleanup
    }
  };
}

function createAdditionalPrivateHostOutputRoot(harness, label) {
  const document = createPrivateHostOutputDocument({
    domContainer: harness.modules.domContainer,
    label: `${harness.mode.id}:${harness.scenarioId}:${label}:host-output`
  });
  const container = document.createElement("div");
  const create = harness.bridge.createClientRoot(container);
  return {
    container,
    create,
    document,
    rootOwner: harness.modules.rootBridge.getRootOwnerFromHandle(create.handle)
  };
}

function mountPrivateCrossRootHostOutput(harness, root, phase) {
  const previousProps = {};
  const nextProps = createPrivateHostOutputProps(phase);
  const host = root.document.createElement("div");
  const token = harness.modules.componentTree.createHostInstanceToken(
    {
      kind: "PrivateHostOutputDiagnosticHost",
      phase
    },
    root.rootOwner
  );
  harness.modules.componentTree.attachHostInstanceNode(
    host,
    token,
    previousProps
  );
  const handoff = harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
    host,
    "div",
    previousProps,
    nextProps
  );
  const latestPropsBeforeCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const handoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      handoff
    );
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(handoff);
  const latestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const text = harness.modules.domHost.createDomHostTextInstance(
    nextProps.children,
    root.container
  );

  harness.modules.domHost.appendInitialChild(host, text);
  harness.modules.domHost.appendChildToContainer(root.container, host);

  return {
    attributes: summarizeAttributeEntries(host),
    childNodeNames: summarizeChildNodeNames(root.container),
    containerChildCount: root.container.childNodes.length,
    containerMutationLog: root.container.mutationLog.slice(),
    containerTextContent: root.container.textContent,
    handoff: summarizePrivateHostOutputHandoff(handoff, handoffPayload),
    hostMutationObserved: true,
    latestPropsAfterCommit: summarizePrivateHostOutputProps(
      latestPropsAfterCommit
    ),
    latestPropsBeforeCommit: summarizePrivateHostOutputProps(
      latestPropsBeforeCommit
    ),
    latestPropsPublished: latestPropsAfterCommit === nextProps,
    textNodeValue: text.nodeValue,
    textWriteLog: text.writeLog.slice()
  };
}

function summarizePrivateHostOutputRootBridgeEvidence(harness) {
  return {
    admissions: harness.requestAdmissionRecords.map((record) => ({
      admissionStatus: record.admissionStatus,
      compatibilityClaimed: record.compatibilityClaimed,
      executionStatus: record.executionStatus,
      operation: record.operation,
      requestType: record.requestType
    })),
    nativeHandoffs: harness.nativeHandoffRecords,
    requestNoOps: harness.requestRecords.map((record) => record.noOp ?? false),
    requestOperations: harness.requestRecords.map((record) => record.operation),
    requestRecordCount: harness.requestRecords.length,
    requestTypes: harness.requestRecords.map((record) => record.requestType),
    thrownOperations: harness.thrownOperations
  };
}

function normalizePrivateBridgeRequestRecord(record) {
  const base = {
    kind: record.kind,
    nativeExecution: record.nativeExecution,
    operation: record.operation,
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    requestType: record.requestType,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    sequence: record.sequence
  };

  if (record.operation === "create") {
    return {
      ...base,
      containerInfo: record.containerInfo,
      listenerGuard: record.listenerGuard,
      markerGuard: record.markerGuard,
      rootOptionsInfo: record.rootOptionsInfo
    };
  }

  return {
    ...base,
    callbackInfo: record.callbackInfo,
    elementInfo: record.elementInfo,
    lifecycleStatusAfter: record.lifecycleStatusAfter,
    lifecycleStatusBefore: record.lifecycleStatusBefore,
    markerGuard: record.markerGuard,
    noOp: record.noOp,
    renderCount: record.renderCount,
    sync: record.sync,
    updateId: record.updateId
  };
}

function summarizePrivateRootBridgeAdmissionRecord(record) {
  return {
    $$typeof: record.$$typeof,
    kind: record.kind,
    operation: record.operation,
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    requestType: record.requestType,
    sequence: record.sequence,
    updateId: record.updateId,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    admissionStatus: record.admissionStatus,
    executionStatus: record.executionStatus,
    compatibilityStatus: record.compatibilityStatus,
    lifecyclePrerequisites: record.lifecyclePrerequisites,
    blockedCapabilities: record.blockedCapabilities.map((capability) => ({
      blocked: capability.blocked,
      id: capability.id
    })),
    nativeExecution: record.nativeExecution,
    reconcilerExecution: record.reconcilerExecution,
    domMutation: record.domMutation,
    markerWrites: record.markerWrites,
    listenerInstallation: record.listenerInstallation,
    hydration: record.hydration,
    eventDispatch: record.eventDispatch,
    compatibilityClaimed: record.compatibilityClaimed
  };
}

function summarizeNativeRootBridgeHandoffRecord(record) {
  return {
    compatibilityClaimed: record.compatibilityClaimed,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    handoffStatus: record.handoffStatus,
    hydration: record.hydration,
    listenerInstallation: record.listenerInstallation,
    markerWrites: record.markerWrites,
    nativeExecution: record.nativeExecution,
    nativeRequestKind: record.nativeRequestRecord?.kind ?? null,
    nativeRootHandleState:
      record.nativeRequestRecord?.rootHandle?.state ?? null,
    operation: record.operation,
    reconcilerExecution: record.reconcilerExecution,
    requestType: record.sourceRequestType
  };
}

function summarizePrivateRootCreateSideEffectRecord(record) {
  return {
    compatibilityClaimed: record.compatibilityClaimed,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    hydration: record.hydration,
    listenerInstallation: record.listenerInstallation,
    listenerRegistrationCount:
      record.listenerRegistration?.registrationCount ?? 0,
    markerStatus: record.markerRecord?.markerStatus ?? null,
    markerWrites: record.markerWrites,
    nativeExecution: record.nativeExecution,
    reconcilerExecution: record.reconcilerExecution,
    reversible: record.reversible,
    sideEffectStatus: record.sideEffectStatus
  };
}

function summarizePrivateRootCreateSideEffectCleanupRecord(record) {
  return {
    compatibilityClaimed: record.compatibilityClaimed,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    hydration: record.hydration,
    listenerInstallation: record.listenerInstallation,
    listenerRemovalCount: record.listenerCleanup?.listenerRemovalCount ?? 0,
    markerCleanupStatus: record.markerCleanup?.markerStatus ?? null,
    markerWrites: record.markerWrites,
    nativeExecution: record.nativeExecution,
    reconcilerExecution: record.reconcilerExecution,
    reversible: record.reversible,
    sideEffectStatus: record.sideEffectStatus
  };
}

function summarizePrivateRootMarkerListenerState({
  container,
  document,
  modules
}) {
  const containerMarker =
    modules.rootMarkers.inspectContainerRootMarker(container);
  const containerListening =
    modules.listenerRegistry.inspectListeningMarker(container);
  const documentListening =
    modules.listenerRegistry.inspectListeningMarker(document);

  return {
    containerListenerRegistrationCount: container.__registrations.length,
    containerListeningMarkerPropertyCount: containerListening.propertyCount,
    containerMarkerPropertyCount: containerMarker.propertyCount,
    containerMarkerTruthyCount: containerMarker.truthyCount,
    ownerDocumentListenerRegistrationCount: document.__registrations.length,
    ownerDocumentListeningMarkerPropertyCount: documentListening.propertyCount
  };
}

function summarizePrivateHostOutputHandoff(handoff, payload) {
  return {
    kind: handoff.kind,
    latestPropsCommitRecordKind: payload.latestPropsCommitRecord.kind,
    latestPropsCommitRecordStatus: payload.latestPropsCommitRecord.status,
    mutationRecordCount: payload.mutationRecords.length,
    payloadCount: handoff.payloadCount,
    status: handoff.status
  };
}

function summarizePrivateHostOutputProps(props) {
  if (props == null || typeof props !== "object") {
    return describeLocalValue(props);
  }

  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key,
      typeof value === "function" ? { type: "function" } : value
    ])
  );
}

function summarizeAttributeEntries(element) {
  return Array.from(element.attributes.entries()).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function summarizeChildNodeNames(parent) {
  return parent.childNodes.map((child) => child.nodeName);
}

function createPrivateHostOutputProps(phase) {
  if (phase === "updated") {
    return {
      id: "message",
      className: "root-card updated",
      title: "updated title",
      "data-phase": "updated",
      children: "goodbye"
    };
  }
  if (phase === "replace-before") {
    return {
      id: "replace-before",
      title: "before",
      children: "before"
    };
  }
  if (phase === "replace-after") {
    return {
      id: "replace-after",
      title: "after",
      children: {
        props: createPrivateHostOutputProps("replace-bold"),
        type: "b"
      }
    };
  }
  if (phase === "replace-bold") {
    return {
      children: "after"
    };
  }
  if (phase === "stale") {
    return {
      children: "stale"
    };
  }
  if (phase === "cross-a") {
    return {
      id: "cross-a",
      children: "A"
    };
  }
  if (phase === "cross-b") {
    return {
      id: "cross-b",
      children: "B"
    };
  }

  return {
    id: "message",
    className: "root-card",
    title: "initial title",
    "data-phase": "initial",
    children: "hello"
  };
}

function createPrivateHostOutputElementValue(phase) {
  return {
    props: createPrivateHostOutputProps(phase),
    type: "div"
  };
}

function createPrivateHostOutputDocument({ domContainer, label }) {
  return new PrivateHostOutputDocument({
    documentNodeType: domContainer.DOCUMENT_NODE,
    elementNodeType: domContainer.ELEMENT_NODE,
    label,
    textNodeType: domContainer.TEXT_NODE
  });
}

class PrivateHostOutputNode {
  constructor({ nodeName, nodeType, ownerDocument }) {
    this.__mutationLog = [];
    this.__registrations = [];
    this.childNodes = [];
    this.mutationLog = [];
    this.nodeName = nodeName;
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
  }

  get firstChild() {
    return this.childNodes[0] ?? null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }

  get textContent() {
    return this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    for (const child of [...this.childNodes]) {
      detachPrivateHostOutputChild(child);
    }
    const text = String(value);
    this.__mutationLog.push({ type: "textContent", value: text });
    this.mutationLog.push(["textContent", text]);
  }

  addEventListener(type, listener, options) {
    this.__registrations.push({
      listener,
      options,
      type
    });
  }

  removeEventListener(type, listener, options) {
    const index = this.__registrations.findIndex(
      (entry) =>
        entry.type === type &&
        entry.listener === listener &&
        entry.options === options
    );
    if (index !== -1) {
      this.__registrations.splice(index, 1);
    }
  }

  appendChild(child) {
    assertPrivateHostOutputChild(child);
    assertPrivateHostOutputCanAcceptChild(this, child);
    detachPrivateHostOutputChild(child);
    this.childNodes.push(child);
    child.parentNode = this;
    this.__mutationLog.push({ child: child.nodeName, type: "appendChild" });
    this.mutationLog.push(["appendChild", child.nodeName]);
    return child;
  }

  insertBefore(child, beforeChild) {
    assertPrivateHostOutputChild(child);
    assertPrivateHostOutputCanAcceptChild(this, child);
    if (beforeChild?.parentNode !== this) {
      throw new Error("Private host-output insert target is not a child.");
    }
    if (child === beforeChild) {
      return child;
    }

    detachPrivateHostOutputChild(child);
    const index = this.childNodes.indexOf(beforeChild);
    this.childNodes.splice(index, 0, child);
    child.parentNode = this;
    this.__mutationLog.push({
      beforeChild: beforeChild.nodeName,
      child: child.nodeName,
      type: "insertBefore"
    });
    this.mutationLog.push(["insertBefore", child.nodeName, beforeChild.nodeName]);
    return child;
  }

  removeChild(child) {
    if (child?.parentNode !== this) {
      throw new Error("Private host-output remove target is not a child.");
    }

    detachPrivateHostOutputChild(child);
    this.__mutationLog.push({ child: child.nodeName, type: "removeChild" });
    this.mutationLog.push(["removeChild", child.nodeName]);
    return child;
  }
}

class PrivateHostOutputDocument extends PrivateHostOutputNode {
  constructor({ documentNodeType, elementNodeType, label, textNodeType }) {
    super({
      nodeName: "#document",
      nodeType: documentNodeType,
      ownerDocument: null
    });
    this.defaultView = new PrivateHostOutputNode({
      nodeName: `${label}:window`,
      nodeType: 0,
      ownerDocument: this
    });
    this.elementNodeType = elementNodeType;
    this.ownerDocument = this;
    this.textNodeType = textNodeType;
  }

  createElement(nodeName) {
    return new PrivateHostOutputElement({
      nodeName: String(nodeName).toUpperCase(),
      nodeType: this.elementNodeType,
      ownerDocument: this
    });
  }

  createTextNode(text) {
    return new PrivateHostOutputText({
      nodeType: this.textNodeType,
      ownerDocument: this,
      text
    });
  }
}

class PrivateHostOutputElement extends PrivateHostOutputNode {
  constructor(fields) {
    super(fields);
    this.attributes = new Map();
    this.attributeLog = [];
    this._className = "";
    this._id = "";
    this._title = "";
  }

  get className() {
    return this._className;
  }

  set className(value) {
    this._className = String(value);
    this.setAttribute("class", this._className);
  }

  get id() {
    return this._id;
  }

  set id(value) {
    this._id = String(value);
    this.setAttribute("id", this._id);
  }

  get title() {
    return this._title;
  }

  set title(value) {
    this._title = String(value);
    this.setAttribute("title", this._title);
  }

  setAttribute(name, value) {
    const attributeName = String(name);
    const stringValue = String(value);
    this.attributeLog.push(["setAttribute", attributeName, stringValue]);
    this.attributes.set(attributeName, stringValue);
  }

  removeAttribute(name) {
    const attributeName = String(name);
    this.attributeLog.push([
      "removeAttribute",
      attributeName,
      this.attributes.has(attributeName)
    ]);
    this.attributes.delete(attributeName);
  }

  getAttribute(name) {
    const attributeName = String(name);
    return this.attributes.has(attributeName)
      ? this.attributes.get(attributeName)
      : null;
  }
}

class PrivateHostOutputText extends PrivateHostOutputNode {
  constructor({ nodeType, ownerDocument, text }) {
    super({
      nodeName: "#text",
      nodeType,
      ownerDocument
    });
    this._data = String(text);
    this.writeLog = [];
  }

  get data() {
    return this._data;
  }

  set data(value) {
    const text = String(value);
    this.writeLog.push(["data", text]);
    this._data = text;
  }

  get nodeValue() {
    return this._data;
  }

  set nodeValue(value) {
    const text = String(value);
    this.writeLog.push(["nodeValue", text]);
    this._data = text;
  }

  get textContent() {
    return this._data;
  }

  set textContent(value) {
    const text = String(value);
    this.writeLog.push(["textContent", text]);
    this._data = text;
  }
}

function assertPrivateHostOutputChild(child) {
  if (child == null || typeof child !== "object") {
    throw new Error("Private host-output child must be a node.");
  }
}

function assertPrivateHostOutputCanAcceptChild(parent, child) {
  let current = parent;
  while (current !== null) {
    if (current === child) {
      throw new Error("Private host-output cannot insert an ancestor.");
    }
    current = current.parentNode;
  }
}

function detachPrivateHostOutputChild(child) {
  if (child.parentNode === null) {
    return;
  }

  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}

function describeLocalFunction(value) {
  if (typeof value !== "function") {
    return describeLocalValue(value);
  }
  return {
    length: value.length,
    name: value.name || "",
    type: "function"
  };
}

function describeLocalValue(value) {
  if (value === null) {
    return {
      type: "null"
    };
  }
  const type = typeof value;
  if (type === "undefined") {
    return {
      type: "undefined"
    };
  }
  if (type === "string" || type === "number" || type === "boolean") {
    return {
      type,
      value
    };
  }
  if (type === "function") {
    return describeLocalFunction(value);
  }
  if (type === "symbol") {
    return {
      description: value.description ?? null,
      type: "symbol"
    };
  }
  if (Array.isArray(value)) {
    return {
      length: value.length,
      type: "array"
    };
  }
  return {
    keys: Object.keys(value).sort(),
    type: "object"
  };
}

function readWorkspaceFile(workspaceRoot, relativePath) {
  return readFileSync(join(workspaceRoot, relativePath), "utf8");
}

function serializeGateError(error) {
  return {
    name: error?.name ?? "Error",
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    entrypoint: error?.entrypoint ?? null,
    exportName: error?.exportName ?? null,
    compatibilityTarget: error?.compatibilityTarget ?? null
  };
}

function describePrivateBridgeError(error) {
  return {
    code: error?.code ?? null,
    message: error?.message ?? String(error)
  };
}

function inspectSyncFlushCrossRootReconcilerDiagnostics({ workspaceRoot }) {
  try {
    const syncFlushSource = readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/sync_flush.rs"
    );
    const syncFlushRootCommitContinuationTestsSource = readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/sync_flush/tests/root_commit_continuation.rs"
    );

    return {
      loadError: null,
      commitWorkOnAllRootsPathPresent:
        /flush_sync_commit_work_on_all_roots/u.test(syncFlushSource) &&
        /flush_sync_work_across_scheduled_roots/u.test(syncFlushSource),
      crossRootDiagnosticMethodPresent:
        /cross_root_render_diagnostics_for_canary/u.test(syncFlushSource),
      crossRootDiagnosticStructPresent:
        /SyncFlushCrossRootRenderDiagnosticsForCanary/u.test(syncFlushSource),
      crossRootDiagnosticTestPresent:
        /sync_flush_cross_root_render_diagnostics_prove_scheduled_private_flush/u.test(
          syncFlushRootCommitContinuationTestsSource
        ),
      scheduledRootTraversalPresent:
        /first_scheduled_root/u.test(syncFlushSource) &&
        /next_scheduled_root/u.test(syncFlushSource),
      syncLaneConsumptionCheckPresent:
        /sync_lanes_consumed_from_roots/u.test(syncFlushSource) &&
        /proves_cross_root_sync_flush_scheduling/u.test(syncFlushSource)
    };
  } catch (error) {
    return {
      loadError: serializeGateError(error)
    };
  }
}

function validatePrivateHostOutputDiagnosticObservation({
  observation,
  scenarioId
}) {
  if (observation.status !== "ok") {
    return {
      gateStatus: "private-root-host-output-diagnostic-failed",
      status: observation.status,
      error: observation.error ?? null
    };
  }

  const evidence = observation.evidence;
  const commonExpectation = {
    compatibilityClaimed: false,
    comparedToReactDomOracle: false,
    diagnosticKind: "private-fake-dom-root-host-output",
    publicRootCompatibilitySurface: false,
    requestOperations: expectedPrivateHostOutputRequestOperations(scenarioId),
    thrownOperations: expectedPrivateHostOutputThrownOperations(scenarioId),
    rootSideEffects: {
      afterApply: {
        containerListenerRegistrationCount: 138,
        containerListeningMarkerPropertyCount: 1,
        containerMarkerPropertyCount: 1,
        containerMarkerTruthyCount: 1,
        ownerDocumentListenerRegistrationCount: 1,
        ownerDocumentListeningMarkerPropertyCount: 1
      },
      afterCleanup: {
        containerListenerRegistrationCount: 0,
        containerListeningMarkerPropertyCount: 0,
        containerMarkerPropertyCount: 0,
        containerMarkerTruthyCount: 0,
        ownerDocumentListenerRegistrationCount: 0,
        ownerDocumentListeningMarkerPropertyCount: 0
      },
      before: {
        containerListenerRegistrationCount: 0,
        containerListeningMarkerPropertyCount: 0,
        containerMarkerPropertyCount: 0,
        containerMarkerTruthyCount: 0,
        ownerDocumentListenerRegistrationCount: 0,
        ownerDocumentListeningMarkerPropertyCount: 0
      },
      cleanupStatus: "reverted-private-root-create-mark-listen-gate",
      sideEffectStatus: "applied-private-root-create-mark-listen-gate"
    }
  };
  const commonActual = {
    compatibilityClaimed: evidence.compatibilityClaimed,
    comparedToReactDomOracle: evidence.comparedToReactDomOracle,
    diagnosticKind: evidence.diagnosticKind,
    publicRootCompatibilitySurface: evidence.publicRootCompatibilitySurface,
    requestOperations: evidence.rootBridgeEvidence.requestOperations,
    thrownOperations: evidence.rootBridgeEvidence.thrownOperations,
    rootSideEffects: {
      afterApply: evidence.rootSideEffectEvidence.afterApply,
      afterCleanup: evidence.rootSideEffectEvidence.cleanup.afterCleanup,
      before: evidence.rootSideEffectEvidence.before,
      cleanupStatus:
        evidence.rootSideEffectEvidence.cleanup.record.sideEffectStatus,
      sideEffectStatus: evidence.rootSideEffectEvidence.record.sideEffectStatus
    }
  };
  const commonDifference = findFirstDifferencePath(
    commonExpectation,
    commonActual
  );
  if (commonDifference !== null) {
    return {
      gateStatus: "private-root-host-output-common-evidence-mismatch",
      firstDifferencePath: commonDifference
    };
  }

  if (
    evidence.rootBridgeEvidence.admissions.some(
      (admission) =>
        admission.admissionStatus !==
          "admitted-private-root-bridge-request-record" ||
        admission.executionStatus !==
          "blocked-private-root-bridge-execution" ||
        admission.compatibilityClaimed !== false
    ) ||
    evidence.rootBridgeEvidence.nativeHandoffs.some(
      (handoff) =>
        handoff.handoffStatus !==
          "mirrored-private-native-root-request-record" ||
        handoff.nativeExecution !== false ||
        handoff.reconcilerExecution !== false ||
        handoff.domMutation !== false ||
        handoff.markerWrites !== false ||
        handoff.listenerInstallation !== false ||
        handoff.compatibilityClaimed !== false
    )
  ) {
    return {
      gateStatus: "private-root-host-output-root-bridge-evidence-mismatch"
    };
  }

  const scenarioDifference = findFirstDifferencePath(
    expectedPrivateHostOutputScenarioEvidence(scenarioId),
    comparablePrivateHostOutputScenarioEvidence(evidence.hostOutputEvidence)
  );
  if (scenarioDifference !== null) {
    return {
      gateStatus: "private-root-host-output-scenario-evidence-mismatch",
      firstDifferencePath: scenarioDifference
    };
  }

  return null;
}

function expectedPrivateHostOutputRequestOperations(scenarioId) {
  switch (scenarioId) {
    case "create-root-no-render":
      return ["create"];
    case "initial-host-render":
      return ["create", "render"];
    case "update-host-render":
      return ["create", "render", "render"];
    case "replace-host-tree":
      return ["create", "render", "render"];
    case "render-null-clears-container":
      return ["create", "render", "render"];
    case "root-unmount":
      return ["create", "render", "unmount"];
    case "double-unmount":
      return ["create", "render", "unmount", "unmount"];
    case "render-after-unmount":
      return ["create", "render", "unmount"];
    case "flush-sync-cross-root-render":
      return ["create", "create", "render", "render"];
    default:
      return [];
  }
}

function expectedPrivateHostOutputThrownOperations(scenarioId) {
  if (scenarioId !== "render-after-unmount") {
    return [];
  }

  return [
    {
      operation: "root.render",
      error: {
        code: "FAST_REACT_DOM_UNMOUNTED_ROOT",
        message: "Cannot update an unmounted root."
      }
    }
  ];
}

function expectedPrivateHostOutputScenarioEvidence(scenarioId) {
  switch (scenarioId) {
    case "create-root-no-render":
      return {
        childNodeNames: [],
        containerChildCount: 0,
        containerTextContent: "",
        hostMutationObserved: false,
        latestPropsPublished: false
      };
    case "initial-host-render":
      return {
        attributes: [
          ["class", "root-card"],
          ["data-phase", "initial"],
          ["id", "message"],
          ["title", "initial title"]
        ],
        childNodeNames: ["DIV"],
        containerChildCount: 1,
        containerTextContent: "hello",
        handoff: {
          kind: "domPropertyUpdateLatestPropsHandoff",
          latestPropsCommitRecordKind: "latestPropsCommit",
          latestPropsCommitRecordStatus: "safe-for-latest-props",
          mutationRecordCount: 5,
          payloadCount: 5,
          status: "mutated"
        },
        hostMutationObserved: true,
        latestPropsAfterCommit: createPrivateHostOutputProps("initial"),
        latestPropsBeforeCommit: {},
        latestPropsPublished: true,
        textNodeValue: "hello",
        textWriteLog: []
      };
    case "update-host-render":
      return {
        attributes: [
          ["class", "root-card updated"],
          ["data-phase", "updated"],
          ["id", "message"],
          ["title", "updated title"]
        ],
        childNodeNames: ["DIV"],
        containerChildCount: 1,
        containerTextContent: "goodbye",
        handoff: {
          kind: "domPropertyUpdateLatestPropsHandoff",
          latestPropsCommitRecordKind: "latestPropsCommit",
          latestPropsCommitRecordStatus: "safe-for-latest-props",
          mutationRecordCount: 4,
          payloadCount: 4,
          status: "mutated"
        },
        latestPropsAfterCommit: createPrivateHostOutputProps("updated"),
        latestPropsBeforeCommit: createPrivateHostOutputProps("initial"),
        latestPropsPublished: true,
        textNodeValue: "goodbye",
        textWriteLog: [["nodeValue", "goodbye"]],
        updateMutationObserved: true
      };
    case "replace-host-tree":
      return {
        initialChildNodeNames: ["SPAN"],
        initialContainerTextContent: "before",
        initialHandoff: {
          kind: "domPropertyUpdateLatestPropsHandoff",
          latestPropsCommitRecordKind: "latestPropsCommit",
          latestPropsCommitRecordStatus: "safe-for-latest-props",
          mutationRecordCount: 3,
          payloadCount: 3,
          status: "mutated"
        },
        initialLatestPropsPublished: true,
        nestedChildNodeNames: ["B"],
        nestedHandoff: {
          kind: "domPropertyUpdateLatestPropsHandoff",
          latestPropsCommitRecordKind: "latestPropsCommit",
          latestPropsCommitRecordStatus: "safe-for-latest-props",
          mutationRecordCount: 1,
          payloadCount: 1,
          status: "mutated"
        },
        nestedLatestPropsPublished: true,
        removedHostDetachedFromLatestPropsMap: true,
        replaceAttributes: [
          ["id", "replace-after"],
          ["title", "after"]
        ],
        replaceChildNodeNames: ["SECTION"],
        replaceContainerChildCount: 1,
        replaceContainerTextContent: "after",
        replacementHandoff: {
          kind: "domPropertyUpdateLatestPropsHandoff",
          latestPropsCommitRecordKind: "latestPropsCommit",
          latestPropsCommitRecordStatus: "safe-for-latest-props",
          mutationRecordCount: 3,
          payloadCount: 3,
          status: "mutated"
        },
        replacementLatestPropsPublished: true,
        replaceMutationLog: [
          ["removeChild", "SPAN"],
          ["appendChild", "SECTION"]
        ],
        textNodeValue: "after",
        textWriteLog: []
      };
    case "render-null-clears-container":
      return {
        childNodeNamesAfterRenderNull: [],
        containerChildCountAfterRenderNull: 0,
        containerTextContentAfterRenderNull: "",
        hostDetachedFromLatestPropsMap: true,
        renderNullMutationLog: [["removeChild", "DIV"]],
        renderNullMutationObserved: true,
        rootSideEffectStateAfterRenderNull: {
          containerListenerRegistrationCount: 138,
          containerListeningMarkerPropertyCount: 1,
          containerMarkerPropertyCount: 1,
          containerMarkerTruthyCount: 1,
          ownerDocumentListenerRegistrationCount: 1,
          ownerDocumentListeningMarkerPropertyCount: 1
        }
      };
    case "root-unmount":
      return {
        childNodeNamesAfterUnmount: [],
        containerChildCountAfterUnmount: 0,
        containerTextContentAfterUnmount: "",
        hostDetachedFromLatestPropsMap: true,
        unmountMutationObserved: true
      };
    case "double-unmount":
      return {
        childNodeNamesAfterSecondUnmount: [],
        childNodeNamesAfterUnmount: [],
        containerChildCountAfterSecondUnmount: 0,
        containerChildCountAfterUnmount: 0,
        containerTextContentAfterSecondUnmount: "",
        containerTextContentAfterUnmount: "",
        hostDetachedFromLatestPropsMap: true,
        secondUnmountBridgeNoOp: true,
        secondUnmountHostMutationObserved: false,
        secondUnmountMutationLog: [],
        unmountMutationObserved: true
      };
    case "render-after-unmount":
      return {
        childNodeNamesAfterRenderAttempt: [],
        childNodeNamesAfterUnmount: [],
        containerChildCountAfterRenderAttempt: 0,
        containerChildCountAfterUnmount: 0,
        containerTextContentAfterRenderAttempt: "",
        containerTextContentAfterUnmount: "",
        hostDetachedFromLatestPropsMap: true,
        renderAfterUnmountError: {
          code: "FAST_REACT_DOM_UNMOUNTED_ROOT",
          message: "Cannot update an unmounted root."
        },
        renderAfterUnmountHostMutationObserved: false,
        renderAfterUnmountMutationLog: [],
        unmountMutationObserved: true
      };
    case "flush-sync-cross-root-render":
      return {
        firstRoot: {
          attributes: [["id", "cross-a"]],
          childNodeNames: ["DIV"],
          containerChildCount: 1,
          containerTextContent: "A",
          handoff: {
            kind: "domPropertyUpdateLatestPropsHandoff",
            latestPropsCommitRecordKind: "latestPropsCommit",
            latestPropsCommitRecordStatus: "safe-for-latest-props",
            mutationRecordCount: 2,
            payloadCount: 2,
            status: "mutated"
          },
          hostMutationObserved: true,
          latestPropsAfterCommit: createPrivateHostOutputProps("cross-a"),
          latestPropsBeforeCommit: {},
          latestPropsPublished: true,
          textNodeValue: "A",
          textWriteLog: []
        },
        flushSyncEvidence: {
          callbackEvents: [
            "root.render:first",
            "root.render:second",
            "flushSyncWork"
          ],
          callbackRenderRequestCount: 2,
          callbackReturnValue: "two-root-flush-complete",
          committedRootCountAfterFlush: 2,
          flushSyncGuardWarningCount: 0,
          flushSyncWorkCallCount: 1,
          flushSyncWorkWasInRender: false,
          privateReconcilerDiagnostics:
            expectedSyncFlushCrossRootReconcilerDiagnostics(),
          publicFlushSyncCompatibilityClaimed: false,
          rootSideEffectStateAfterFlush: {
            first: {
              containerListenerRegistrationCount: 138,
              containerListeningMarkerPropertyCount: 1,
              containerMarkerPropertyCount: 1,
              containerMarkerTruthyCount: 1,
              ownerDocumentListenerRegistrationCount: 1,
              ownerDocumentListeningMarkerPropertyCount: 1
            },
            second: {
              containerListenerRegistrationCount: 138,
              containerListeningMarkerPropertyCount: 1,
              containerMarkerPropertyCount: 1,
              containerMarkerTruthyCount: 1,
              ownerDocumentListenerRegistrationCount: 1,
              ownerDocumentListeningMarkerPropertyCount: 1
            }
          }
        },
        secondRoot: {
          attributes: [["id", "cross-b"]],
          childNodeNames: ["DIV"],
          containerChildCount: 1,
          containerTextContent: "B",
          handoff: {
            kind: "domPropertyUpdateLatestPropsHandoff",
            latestPropsCommitRecordKind: "latestPropsCommit",
            latestPropsCommitRecordStatus: "safe-for-latest-props",
            mutationRecordCount: 2,
            payloadCount: 2,
            status: "mutated"
          },
          hostMutationObserved: true,
          latestPropsAfterCommit: createPrivateHostOutputProps("cross-b"),
          latestPropsBeforeCommit: {},
          latestPropsPublished: true,
          textNodeValue: "B",
          textWriteLog: []
        },
        secondRootSideEffectEvidence: {
          afterApply: {
            containerListenerRegistrationCount: 138,
            containerListeningMarkerPropertyCount: 1,
            containerMarkerPropertyCount: 1,
            containerMarkerTruthyCount: 1,
            ownerDocumentListenerRegistrationCount: 1,
            ownerDocumentListeningMarkerPropertyCount: 1
          },
          before: {
            containerListenerRegistrationCount: 0,
            containerListeningMarkerPropertyCount: 0,
            containerMarkerPropertyCount: 0,
            containerMarkerTruthyCount: 0,
            ownerDocumentListenerRegistrationCount: 0,
            ownerDocumentListeningMarkerPropertyCount: 0
          },
          cleanup: {
            afterCleanup: {
              containerListenerRegistrationCount: 0,
              containerListeningMarkerPropertyCount: 0,
              containerMarkerPropertyCount: 0,
              containerMarkerTruthyCount: 0,
              ownerDocumentListenerRegistrationCount: 0,
              ownerDocumentListeningMarkerPropertyCount: 0
            },
            status: "reverted-private-root-create-mark-listen-gate"
          },
          status: "applied-private-root-create-mark-listen-gate"
        }
      };
    default:
      return null;
  }
}

function expectedSyncFlushCrossRootReconcilerDiagnostics() {
  return {
    loadError: null,
    commitWorkOnAllRootsPathPresent: true,
    crossRootDiagnosticMethodPresent: true,
    crossRootDiagnosticStructPresent: true,
    crossRootDiagnosticTestPresent: true,
    scheduledRootTraversalPresent: true,
    syncLaneConsumptionCheckPresent: true
  };
}

function comparablePrivateHostOutputScenarioEvidence(evidence) {
  if (evidence.flushSyncEvidence !== undefined) {
    return {
      firstRoot: comparableMountedPrivateHostOutput(evidence.firstRoot),
      flushSyncEvidence: {
        callbackEvents: evidence.flushSyncEvidence.callbackEvents,
        callbackRenderRequestCount:
          evidence.flushSyncEvidence.callbackRenderRequestCount,
        callbackReturnValue: evidence.flushSyncEvidence.callbackReturnValue,
        committedRootCountAfterFlush:
          evidence.flushSyncEvidence.committedRootCountAfterFlush,
        flushSyncGuardWarningCount:
          evidence.flushSyncEvidence.flushSyncGuardWarningCount,
        flushSyncWorkCallCount:
          evidence.flushSyncEvidence.flushSyncWorkCallCount,
        flushSyncWorkWasInRender:
          evidence.flushSyncEvidence.flushSyncWorkWasInRender,
        privateReconcilerDiagnostics:
          evidence.flushSyncEvidence.privateReconcilerDiagnostics,
        publicFlushSyncCompatibilityClaimed:
          evidence.flushSyncEvidence.publicFlushSyncCompatibilityClaimed,
        rootSideEffectStateAfterFlush:
          evidence.flushSyncEvidence.rootSideEffectStateAfterFlush
      },
      secondRoot: comparableMountedPrivateHostOutput(evidence.secondRoot),
      secondRootSideEffectEvidence:
        comparablePrivateHostOutputRootSideEffectEvidence(
          evidence.secondRootSideEffectEvidence
        )
    };
  }

  if (evidence.replaceMutationLog !== undefined) {
    return {
      initialChildNodeNames: evidence.initialChildNodeNames,
      initialContainerTextContent: evidence.initialContainerTextContent,
      initialHandoff: evidence.initialHandoff,
      initialLatestPropsPublished: evidence.initialLatestPropsPublished,
      nestedChildNodeNames: evidence.nestedChildNodeNames,
      nestedHandoff: evidence.nestedHandoff,
      nestedLatestPropsPublished: evidence.nestedLatestPropsPublished,
      removedHostDetachedFromLatestPropsMap:
        evidence.removedHostDetachedFromLatestPropsMap,
      replaceAttributes: evidence.replaceAttributes,
      replaceChildNodeNames: evidence.replaceChildNodeNames,
      replaceContainerChildCount: evidence.replaceContainerChildCount,
      replaceContainerTextContent: evidence.replaceContainerTextContent,
      replacementHandoff: evidence.replacementHandoff,
      replacementLatestPropsPublished:
        evidence.replacementLatestPropsPublished,
      replaceMutationLog: evidence.replaceMutationLog,
      textNodeValue: evidence.textNodeValue,
      textWriteLog: evidence.textWriteLog
    };
  }

  if (evidence.containerChildCountAfterRenderNull !== undefined) {
    return {
      childNodeNamesAfterRenderNull: evidence.childNodeNamesAfterRenderNull,
      containerChildCountAfterRenderNull:
        evidence.containerChildCountAfterRenderNull,
      containerTextContentAfterRenderNull:
        evidence.containerTextContentAfterRenderNull,
      hostDetachedFromLatestPropsMap: evidence.hostDetachedFromLatestPropsMap,
      renderNullMutationLog: evidence.renderNullMutationLog,
      renderNullMutationObserved: evidence.renderNullMutationObserved,
      rootSideEffectStateAfterRenderNull:
        evidence.rootSideEffectStateAfterRenderNull
    };
  }

  if (evidence.secondUnmountMutationLog !== undefined) {
    return {
      childNodeNamesAfterSecondUnmount:
        evidence.childNodeNamesAfterSecondUnmount,
      childNodeNamesAfterUnmount: evidence.childNodeNamesAfterUnmount,
      containerChildCountAfterSecondUnmount:
        evidence.containerChildCountAfterSecondUnmount,
      containerChildCountAfterUnmount: evidence.containerChildCountAfterUnmount,
      containerTextContentAfterSecondUnmount:
        evidence.containerTextContentAfterSecondUnmount,
      containerTextContentAfterUnmount: evidence.containerTextContentAfterUnmount,
      hostDetachedFromLatestPropsMap: evidence.hostDetachedFromLatestPropsMap,
      secondUnmountBridgeNoOp: evidence.secondUnmountBridgeNoOp,
      secondUnmountHostMutationObserved:
        evidence.secondUnmountHostMutationObserved,
      secondUnmountMutationLog: evidence.secondUnmountMutationLog,
      unmountMutationObserved: evidence.unmountMutationObserved
    };
  }

  if (evidence.renderAfterUnmountError !== undefined) {
    return {
      childNodeNamesAfterRenderAttempt:
        evidence.childNodeNamesAfterRenderAttempt,
      childNodeNamesAfterUnmount: evidence.childNodeNamesAfterUnmount,
      containerChildCountAfterRenderAttempt:
        evidence.containerChildCountAfterRenderAttempt,
      containerChildCountAfterUnmount: evidence.containerChildCountAfterUnmount,
      containerTextContentAfterRenderAttempt:
        evidence.containerTextContentAfterRenderAttempt,
      containerTextContentAfterUnmount: evidence.containerTextContentAfterUnmount,
      hostDetachedFromLatestPropsMap: evidence.hostDetachedFromLatestPropsMap,
      renderAfterUnmountError: evidence.renderAfterUnmountError,
      renderAfterUnmountHostMutationObserved:
        evidence.renderAfterUnmountHostMutationObserved,
      renderAfterUnmountMutationLog: evidence.renderAfterUnmountMutationLog,
      unmountMutationObserved: evidence.unmountMutationObserved
    };
  }

  if (evidence.containerChildCountAfterUnmount !== undefined) {
    return {
      childNodeNamesAfterUnmount: evidence.childNodeNamesAfterUnmount,
      containerChildCountAfterUnmount: evidence.containerChildCountAfterUnmount,
      containerTextContentAfterUnmount: evidence.containerTextContentAfterUnmount,
      hostDetachedFromLatestPropsMap: evidence.hostDetachedFromLatestPropsMap,
      unmountMutationObserved: evidence.unmountMutationObserved
    };
  }

  if (evidence.updateMutationObserved === true) {
    return {
      attributes: evidence.attributes,
      childNodeNames: evidence.childNodeNames,
      containerChildCount: evidence.containerChildCount,
      containerTextContent: evidence.containerTextContent,
      handoff: evidence.handoff,
      latestPropsAfterCommit: evidence.latestPropsAfterCommit,
      latestPropsBeforeCommit: evidence.latestPropsBeforeCommit,
      latestPropsPublished: evidence.latestPropsPublished,
      textNodeValue: evidence.textNodeValue,
      textWriteLog: evidence.textWriteLog,
      updateMutationObserved: evidence.updateMutationObserved
    };
  }

  if (evidence.hostMutationObserved === true) {
    return {
      attributes: evidence.attributes,
      childNodeNames: evidence.childNodeNames,
      containerChildCount: evidence.containerChildCount,
      containerTextContent: evidence.containerTextContent,
      handoff: evidence.handoff,
      hostMutationObserved: evidence.hostMutationObserved,
      latestPropsAfterCommit: evidence.latestPropsAfterCommit,
      latestPropsBeforeCommit: evidence.latestPropsBeforeCommit,
      latestPropsPublished: evidence.latestPropsPublished,
      textNodeValue: evidence.textNodeValue,
      textWriteLog: evidence.textWriteLog
    };
  }

  return {
    childNodeNames: evidence.childNodeNames,
    containerChildCount: evidence.containerChildCount,
    containerTextContent: evidence.containerTextContent,
    hostMutationObserved: evidence.hostMutationObserved,
    latestPropsPublished: evidence.latestPropsPublished
  };
}

function comparableMountedPrivateHostOutput(evidence) {
  return {
    attributes: evidence.attributes,
    childNodeNames: evidence.childNodeNames,
    containerChildCount: evidence.containerChildCount,
    containerTextContent: evidence.containerTextContent,
    handoff: evidence.handoff,
    hostMutationObserved: evidence.hostMutationObserved,
    latestPropsAfterCommit: evidence.latestPropsAfterCommit,
    latestPropsBeforeCommit: evidence.latestPropsBeforeCommit,
    latestPropsPublished: evidence.latestPropsPublished,
    textNodeValue: evidence.textNodeValue,
    textWriteLog: evidence.textWriteLog
  };
}

function comparablePrivateHostOutputRootSideEffectEvidence(evidence) {
  return {
    afterApply: evidence.afterApply,
    before: evidence.before,
    cleanup: {
      afterCleanup: evidence.cleanup.afterCleanup,
      status: evidence.cleanup.record.sideEffectStatus
    },
    status: evidence.record.sideEffectStatus
  };
}

function validatePrivateHostOutputAdmissionMetadata({
  privateHostOutputAdmissionByScenario,
  failures
}) {
  for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
    if (!privateHostOutputAdmissionByScenario.has(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "missing-private-root-host-output-admission"
      });
    }
  }

  for (const [scenarioId, admission] of privateHostOutputAdmissionByScenario) {
    if (!REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.includes(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-root-host-output-admission-scenario"
      });
    }
    if (
      admission.admission !== "private-host-output-diagnostic" &&
      admission.admission !== "unsupported"
    ) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-root-host-output-admission",
        admission: admission.admission
      });
    }
    if (
      admission.admission === "private-host-output-diagnostic" &&
      expectedPrivateHostOutputRequestOperations(scenarioId).length === 0
    ) {
      failures.push({
        scenarioId,
        gateStatus: "missing-private-root-host-output-plan"
      });
    }
  }
}

function findFirstDifferencePath(left, right, path = "$") {
  if (Object.is(left, right)) {
    return null;
  }

  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object"
  ) {
    return path;
  }

  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);
  if (leftIsArray !== rightIsArray) {
    return path;
  }

  if (leftIsArray) {
    if (left.length !== right.length) {
      return `${path}.length`;
    }
    for (let index = 0; index < left.length; index += 1) {
      const childPath = findFirstDifferencePath(
        left[index],
        right[index],
        `${path}[${index}]`
      );
      if (childPath) {
        return childPath;
      }
    }
    return null;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return `${path}.keys`;
  }
  for (let index = 0; index < leftKeys.length; index += 1) {
    if (leftKeys[index] !== rightKeys[index]) {
      return `${path}.keys[${index}]`;
    }
  }
  for (const key of leftKeys) {
    const childPath = findFirstDifferencePath(
      left[key],
      right[key],
      `${path}.${key}`
    );
    if (childPath) {
      return childPath;
    }
  }
  return null;
}

export {
  applyPrivateHostOutputRootSideEffectsForRoot,
  cleanupPrivateHostOutputRootSideEffectsForRoot,
  comparablePrivateHostOutputRootSideEffectEvidence,
  createAdditionalPrivateHostOutputRoot,
  createPrivateCrossRootSchedulingHarness,
  createPrivateHostOutputDocument,
  createPrivateHostOutputElementValue,
  loadPrivateHostOutputModules,
  recordPrivateHostOutputRootRequest,
  runPrivateHostOutputDiagnosticScenario,
  summarizePrivateHostOutputRootBridgeEvidence,
  summarizePrivateRootMarkerListenerState,
  validatePrivateHostOutputAdmissionMetadata,
  validatePrivateHostOutputDiagnosticObservation
};
