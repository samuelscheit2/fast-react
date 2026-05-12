'use strict';

const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const forbiddenLoads = [];
const originalLoad = Module._load;

function isForbiddenLoad(request) {
  const specifier = String(request);
  return (
    specifier.endsWith('.node') ||
    specifier.startsWith('@fast-react/native-')
  );
}

Module._load = function guardedNativeReactDomAdmissionLoad(
  request,
  parent,
  isMain
) {
  if (isForbiddenLoad(request)) {
    const attemptedLoad = {request: String(request)};
    forbiddenLoads.push(attemptedLoad);
    const error = new Error(
      `Forbidden native render handoff admission load: ${attemptedLoad.request}`
    );
    error.attemptedLoad = attemptedLoad;
    throw error;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const native = require('../index.cjs');
const {
  createDocument,
  createElement,
  reactDomClient,
  rootBridge
} = require(path.resolve(
  __dirname,
  '../../../packages/react-dom/test/react-dom-private-root-bridge-shell/context.js'
));

const admissionSymbol = Symbol.for(
  'fast.react_native.private_react_dom_render_handoff_admission'
);
const metadataFactorySymbol = Symbol.for(
  'fast.react_native.private_root_work_loop_finished_work_metadata_factory'
);
const admissionFunctionName = 'admitNativeReactDomRenderHandoffForCanary';
const invalidCode =
  'FAST_REACT_NAPI_REACT_DOM_RENDER_HANDOFF_ADMISSION_INVALID';
const capabilityClaimCode =
  'FAST_REACT_NAPI_REACT_DOM_RENDER_HANDOFF_ADMISSION_CAPABILITY_CLAIM';

function assertNoPublicStringKeyLeak(object, label) {
  const stringKeys = Object.getOwnPropertyNames(object);

  assert.equal(
    stringKeys.includes(admissionSymbol.description),
    false,
    `${label} must not expose the private registry key as a string property`
  );
  assert.equal(
    stringKeys.includes(admissionFunctionName),
    false,
    `${label} must not expose the private admission function name`
  );
  assert.equal(
    Object.keys(object).includes(admissionFunctionName),
    false,
    `${label} must not enumerate the private admission function name`
  );
  assert.equal(
    stringKeys.some((key) =>
      /private_react_dom_render_handoff_admission|ReactDomRenderHandoff/u.test(
        key
      )
    ),
    false,
    `${label} must not expose React DOM render handoff admission string keys`
  );
}

function assertAdmissionError(action, expectedCode, label) {
  assert.throws(
    action,
    (error) => {
      assert.equal(
        error.name,
        'FastReactNativeReactDomRenderHandoffAdmissionError',
        label
      );
      assert.equal(error.code, expectedCode, label);
      assert.equal(error.nativeAddonLoaded, false, label);
      assert.equal(error.nativeExecution, false, label);
      assert.equal(error.rendererExecution, false, label);
      assert.equal(error.reconcilerExecution, false, label);
      assert.equal(error.publicRootExecution, false, label);
      assert.equal(error.browserDomMutation, false, label);
      assert.equal(error.publicNativeCompatibility, false, label);
      assert.equal(error.publicRootCompatibilitySurface, false, label);
      assert.equal(error.publicRootRenderCompatibilityClaimed, false, label);
      assert.equal(error.compatibilityClaimed, false, label);
      assert.ok(Object.isFrozen(error.details), label);
      return true;
    },
    label
  );
}

function createFixture(label, nativeEnvironmentId = 1156) {
  const prefix = label.replace(/[^a-z0-9]+/gu, '-');
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    createRenderAdmissionIdPrefix: `${prefix}-admission`,
    initialHostOutputIdPrefix: `${prefix}-initial`,
    lifecycleRequestBoundaryIdPrefix: `${prefix}-lifecycle`,
    nativeEnvironmentId,
    nativeHandoffIdPrefix: `${prefix}-native`,
    publicFacadeHostOutputRenderIdPrefix: `${prefix}-render`,
    requestIdPrefix: `${prefix}-request`,
    rootIdPrefix: `${prefix}-root`,
    rootRenderNativeHandoffIdPrefix: `${prefix}-handoff`,
    sideEffectIdPrefix: `${prefix}-side-effect`,
    updateIdPrefix: `${prefix}-update`
  });
  const document = createDocument(prefix);
  const container = createElement('DIV', document);
  const root = adapter.createRoot(container);
  const createRecord = adapter.getRootCreateRecord(root);
  const createHandoff =
    rootBridge.createNativeRootBridgeHandoffRecord(createRecord);
  const metadataFactory = native[metadataFactorySymbol];
  const metadata = metadataFactory({
    hostType: 'div',
    renderUpdateId: `${prefix}-update:1`,
    rootId: createRecord.rootId,
    rootTag: createRecord.rootTag,
    textContent: 'text'
  });
  const renderHandoff = adapter.renderNativeHandoff(
    root,
    {
      props: {
        children: 'text'
      },
      type: 'div'
    },
    {
      rustRootWorkLoopFinishedWorkMetadata: metadata
    }
  );

  return {
    adapter,
    container,
    createHandoff,
    createRecord,
    document,
    metadata,
    renderHandoff,
    root
  };
}

function cleanupFixture(fixture) {
  const payload =
    rootBridge.getPrivateRootRenderNativeHandoffPayload(
      fixture.renderHandoff
    );
  if (payload !== null) {
    payload.bridge.cleanupInitialRenderHostOutput(payload.hostOutputHandoff);
  }
}

function omitField(object, field) {
  const clone = {...object};
  delete clone[field];
  return clone;
}

function replaceField(object, removedField, addedField, value) {
  return Object.freeze({
    ...omitField(object, removedField),
    [addedField]: value
  });
}

function assertValidAdmission(admit) {
  const fixture = createFixture('valid-admission');
  const childCountBefore = fixture.container.childNodes.length;
  const admission = admit(
    fixture.createHandoff.nativeRequestRecord,
    fixture.renderHandoff,
    fixture.metadata
  );

  assert.equal(Object.isFrozen(admission), true);
  assert.equal(fixture.container.childNodes.length, childCountBefore);
  assert.equal(
    admission.admissionStatus,
    'admitted-private-react-dom-render-native-handoff-without-public-native-or-browser-dom-execution'
  );
  assert.equal(
    admission.operation,
    'private-react-dom-render-native-handoff-addon-admission'
  );
  assert.equal(admission.entrypoint, 'react-dom/client');
  assert.equal(admission.requestCount, 2);
  assert.equal(
    admission.requestShapeGateStatus,
    native.nativeRootBridgeRequestShape.gateStatus
  );
  assert.equal(admission.createNativeRequestId, 1);
  assert.equal(admission.createNativeRequestKind, 'create');
  assert.equal(admission.renderNativeRequestId, 2);
  assert.equal(admission.renderNativeRequestKind, 'render');
  assert.equal(admission.nativeRootId, 1);
  assert.equal(admission.rootId, fixture.createRecord.rootId);
  assert.equal(admission.rootKind, fixture.createRecord.rootKind);
  assert.equal(admission.rootTag, fixture.createRecord.rootTag);
  assert.equal(admission.renderUpdateId, 'valid-admission-update:1');
  assert.equal(admission.handoffId, 'valid-admission-handoff:1');
  assert.equal(
    admission.handoffStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_NATIVE_HANDOFF_ACCEPTED
  );
  assert.equal(admission.nativeHandoffId, 'valid-admission-native:2');
  assert.equal(
    admission.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(admission.rootWorkLoopFinishedWorkConsumed, true);
  assert.equal(admission.rootWorkLoopPublicRootRenderingBlocked, true);
  assert.equal(
    admission.metadataSource,
    rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_SOURCE
  );
  assert.equal(
    admission.metadataStatus,
    rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS
  );
  assert.equal(
    admission.metadataRevision,
    rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_REVISION
  );
  assert.equal(admission.metadataRootId, fixture.createRecord.rootId);
  assert.equal(
    admission.metadataRenderUpdateId,
    'valid-admission-update:1'
  );
  assert.equal(admission.fakeDomMutationObserved, true);
  assert.equal(admission.fakeDomOutputPublicCompatibility, false);
  assert.equal(admission.nativeAddonLoaded, false);
  assert.equal(admission.nativeExecution, false);
  assert.equal(admission.rendererExecution, false);
  assert.equal(admission.reconcilerExecution, false);
  assert.equal(admission.publicRootExecution, false);
  assert.equal(admission.browserDomMutation, false);
  assert.equal(admission.addonDomMutation, false);
  assert.equal(admission.publicNativeCompatibility, false);
  assert.equal(admission.publicRootCompatibilitySurface, false);
  assert.equal(admission.publicRootRenderCompatibilityClaimed, false);
  assert.equal(admission.compatibilityClaimed, false);
  assert.equal(admission.compatibilityStatus, 'blocked');
  assert.equal(Object.hasOwn(admission, 'publicNativeCompatibilityClaimed'), false);
  assert.equal(Object.isFrozen(admission.requestShapeGate), true);
  assert.deepEqual(
    admission.requestShapeGate.validationRecords.map((record) => record.kind),
    ['create', 'render']
  );

  cleanupFixture(fixture);
}

function assertFailClosedCases(admit) {
  {
    const fixture = createFixture('missing-create-sequence');
    assertAdmissionError(
      () =>
        admit(
          fixture.renderHandoff.nativeRequestRecord,
          fixture.renderHandoff,
          fixture.metadata
        ),
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
      'missing create sequence'
    );
    cleanupFixture(fixture);
  }

  {
    const fixture = createFixture('stale-native-render-record');
    const staleRenderHandoff = Object.freeze({
      ...fixture.renderHandoff,
      nativeRequestRecord: Object.freeze({
        ...fixture.renderHandoff.nativeRequestRecord,
        rootHandle: Object.freeze({
          ...fixture.renderHandoff.nativeRequestRecord.rootHandle,
          generation: 2
        })
      })
    });
    assertAdmissionError(
      () =>
        admit(
          fixture.createHandoff.nativeRequestRecord,
          staleRenderHandoff,
          fixture.metadata
      ),
      'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_MISMATCH',
      'tampered render handoff native root handle'
    );
    cleanupFixture(fixture);
  }

  {
    const fixture = createFixture('tampered-root-work-loop');
    const tamperedHandoff = Object.freeze({
      ...fixture.renderHandoff,
      rootWorkLoopPublicRootRenderingBlocked: false
    });
    assertAdmissionError(
      () =>
        admit(
          fixture.createHandoff.nativeRequestRecord,
          tamperedHandoff,
          fixture.metadata
        ),
      invalidCode,
      'tampered root work-loop public rendering blocker'
    );
    cleanupFixture(fixture);
  }
}

function assertCapabilityClaimSmugglingRejected(admit) {
  for (const claimField of [
    'publicRootExecution',
    'nativeExecution',
    'browserDomMutation',
    'publicNativeCompatibility',
    'publicRootCompatibilitySurface',
    'publicRootRenderCompatibilityClaimed',
    'publicDomMutationCompatibilityClaimed',
    'fakeDomOutputPublicCompatibility'
  ]) {
    const fixture = createFixture(`claim-${claimField}`);
    const claimedHandoff = Object.freeze({
      ...fixture.renderHandoff,
      [claimField]: true
    });
    assertAdmissionError(
      () =>
        admit(
          fixture.createHandoff.nativeRequestRecord,
          claimedHandoff,
          fixture.metadata
        ),
      capabilityClaimCode,
      claimField
    );
    cleanupFixture(fixture);
  }

  {
    const fixture = createFixture('create-record-public-claim');
    const claimedCreateRecord = Object.freeze({
      ...fixture.createHandoff.nativeRequestRecord,
      publicRootCompatibilitySurface: true
    });
    assertAdmissionError(
      () => admit(claimedCreateRecord, fixture.renderHandoff, fixture.metadata),
      capabilityClaimCode,
      'create record public compatibility claim'
    );
    cleanupFixture(fixture);
  }
}

function assertMetadataShapeRejected(admit) {
  {
    const fixture = createFixture('wrong-metadata-top-case');
    const metadata = replaceField(
      fixture.metadata,
      'metadataRevision',
      'metadata_revision',
      fixture.metadata.metadataRevision
    );
    assertAdmissionError(
      () =>
        admit(
          fixture.createHandoff.nativeRequestRecord,
          fixture.renderHandoff,
          metadata
        ),
      invalidCode,
      'wrong top-level metadata key casing'
    );
    cleanupFixture(fixture);
  }

  {
    const fixture = createFixture('wrong-metadata-nested-case');
    const facade = replaceField(
      fixture.metadata.facade,
      'renderUpdateId',
      'render_update_id',
      fixture.metadata.facade.renderUpdateId
    );
    const metadata = Object.freeze({
      ...fixture.metadata,
      facade
    });
    assertAdmissionError(
      () =>
        admit(
          fixture.createHandoff.nativeRequestRecord,
          fixture.renderHandoff,
          metadata
        ),
      invalidCode,
      'wrong nested metadata key casing'
    );
    cleanupFixture(fixture);
  }

  {
    const fixture = createFixture('metadata-public-claim');
    const metadata = Object.freeze({
      ...fixture.metadata,
      publicRootRenderCompatibilityClaimed: true
    });
    assertAdmissionError(
      () =>
        admit(
          fixture.createHandoff.nativeRequestRecord,
          fixture.renderHandoff,
          metadata
        ),
      capabilityClaimCode,
      'metadata public compatibility claim'
    );
    cleanupFixture(fixture);
  }

  {
    const fixture = createFixture('metadata-render-id-mismatch');
    const metadata = Object.freeze({
      ...fixture.metadata,
      facade: Object.freeze({
        ...fixture.metadata.facade,
        renderUpdateId: 'metadata-render-id-mismatch-update:2'
      })
    });
    assertAdmissionError(
      () =>
        admit(
          fixture.createHandoff.nativeRequestRecord,
          fixture.renderHandoff,
          metadata
        ),
      invalidCode,
      'metadata render update mismatch'
    );
    cleanupFixture(fixture);
  }
}

async function main() {
  const descriptor = Object.getOwnPropertyDescriptor(native, admissionSymbol);

  assert.ok(descriptor, 'private admission symbol descriptor exists');
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(typeof descriptor.value, 'function');
  assert.equal(descriptor.value.name, admissionFunctionName);
  assert.equal(Object.isFrozen(descriptor.value), true);
  assert.equal(native[admissionSymbol], descriptor.value);
  assert.equal(Object.getOwnPropertySymbols(native).includes(admissionSymbol), true);
  assertNoPublicStringKeyLeak(native, 'CommonJS native binding');
  assert.equal(typeof native[metadataFactorySymbol], 'function');

  const nativeEsm = await import(
    pathToFileURL(path.resolve(__dirname, '../index.mjs')).href
  );
  assert.equal(Object.hasOwn(nativeEsm, admissionFunctionName), false);
  assert.equal(Object.hasOwn(nativeEsm, admissionSymbol), false);
  assertNoPublicStringKeyLeak(nativeEsm, 'ESM namespace');
  assert.equal(nativeEsm.default[admissionSymbol], descriptor.value);

  assertValidAdmission(descriptor.value);
  assertFailClosedCases(descriptor.value);
  assertCapabilityClaimSmugglingRejected(descriptor.value);
  assertMetadataShapeRejected(descriptor.value);
  assert.deepEqual(forbiddenLoads, []);
}

main()
  .then(() => {
    Module._load = originalLoad;
    console.log(
      'Fast React native React DOM render handoff admission checks passed.'
    );
  })
  .catch((error) => {
    Module._load = originalLoad;
    console.error(error);
    process.exitCode = 1;
  });
