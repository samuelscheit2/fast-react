'use strict';

const assert = require('node:assert/strict');

const native = require('../index.cjs');

const factorySymbol = Symbol.for(
  'fast.react_native.private_root_work_loop_finished_work_metadata_factory'
);
const factoryName = 'createNativeRootWorkLoopFinishedWorkMetadataForCanary';
const invalidOptionsCode =
  'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_INVALID_OPTIONS';
const capabilityClaimCode =
  'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_CAPABILITY_CLAIM';
const validOptions = Object.freeze({
  hostType: 'div',
  renderUpdateId: 'private-root-work-loop-update:1',
  rootId: 'private-root-work-loop-root:1',
  rootTag: 'ConcurrentRoot',
  textContent: 'text'
});

function assertNoPublicStringKeyLeak(object, label) {
  const stringKeys = Object.getOwnPropertyNames(object);

  assert.equal(
    stringKeys.includes(factorySymbol.description),
    false,
    `${label} must not expose the private registry key as a string property`
  );
  assert.equal(
    stringKeys.includes(factoryName),
    false,
    `${label} must not expose the private factory name as a string property`
  );
  assert.equal(
    Object.keys(object).includes(factoryName),
    false,
    `${label} must not enumerate the private factory name`
  );
  assert.equal(
    stringKeys.some((key) =>
      /private_root_work_loop_finished_work_metadata_factory|RootWorkLoopFinishedWorkMetadata/u.test(
        key
      )
    ),
    false,
    `${label} must not expose root work-loop metadata factory string keys`
  );
}

function assertFactoryError(input, expectedCode, label) {
  assert.throws(
    () => native[factorySymbol](input),
    (error) => {
      assert.equal(
        error.name,
        'FastReactNativeRootWorkLoopFinishedWorkMetadataFactoryError',
        label
      );
      assert.equal(error.code, expectedCode, label);
      assert.equal(error.nativeAddonLoaded, false, label);
      assert.equal(error.nativeExecution, false, label);
      assert.equal(error.rendererExecution, false, label);
      assert.equal(error.reconcilerExecution, false, label);
      assert.equal(error.publicNativeCompatibility, false, label);
      assert.equal(error.compatibilityClaimed, false, label);
      assert.ok(Object.isFrozen(error.details), label);
      return true;
    },
    label
  );
}

function assertFrozenMetadataShape(metadata) {
  assert.equal(Object.isFrozen(metadata), true);
  assert.equal(Object.isFrozen(metadata.facade), true);
  assert.equal(Object.isFrozen(metadata.completeWork), true);
  assert.equal(Object.isFrozen(metadata.completeWork.childTags), true);
  assert.equal(Object.isFrozen(metadata.pending), true);
  assert.equal(Object.isFrozen(metadata.commit), true);
  assert.equal(Object.isFrozen(metadata.placement), true);

  assert.deepEqual(metadata, {
    source: 'fast-react-reconciler.root-work-loop.finished-work-handoff',
    status: 'accepted-private-root-work-loop-finished-work-handoff-metadata',
    metadataRevision: 'root-work-loop-finished-work-handoff-2026-05-10',
    facade: {
      rootId: validOptions.rootId,
      rootTag: validOptions.rootTag,
      renderUpdateId: validOptions.renderUpdateId,
      hostType: 'div',
      hostOutputShape: 'host-component',
      hostComponentCount: 1,
      hostTextCount: 1,
      textContent: 'text'
    },
    completeWork: {
      rootChildTag: 'HostComponent',
      completedChildTag: 'HostComponent',
      hostTextChildTag: 'HostText',
      childTags: ['HostComponent', 'HostText']
    },
    pending: {
      recordsFinishedWork: true,
      pendingWorkMatchesFinishedWork: true,
      renderLanes: 'Default',
      finishedLanes: 'Default',
      remainingLanes: 'NoLanes'
    },
    commit: {
      commitOrderAfterPendingRecord: true,
      consumedFinishedWorkRecord: true,
      finishedWorkAfterCommit: null,
      finishedLanesAfterCommit: 'NoLanes',
      renderPhaseWorkAfterCommit: null,
      mutationExecutionBlocked: true,
      publicRootRenderingBlocked: true,
      effectsRefsAndHydrationBlocked: true
    },
    placement: {
      tag: 'HostComponent',
      applyKind: 'append-placement-to-container',
      siblingStatus: 'append'
    }
  });
}

async function main() {
  const descriptor = Object.getOwnPropertyDescriptor(native, factorySymbol);

  assert.ok(descriptor, 'private factory symbol descriptor exists');
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(typeof descriptor.value, 'function');
  assert.equal(native[factorySymbol], descriptor.value);
  assert.equal(descriptor.value.name, factoryName);
  assert.equal(Object.isFrozen(descriptor.value), true);
  assert.equal(Object.getOwnPropertySymbols(native).includes(factorySymbol), true);
  assertNoPublicStringKeyLeak(native, 'CommonJS native binding');

  const nativeEsm = await import('../index.mjs');
  assert.equal(Object.hasOwn(nativeEsm, factoryName), false);
  assert.equal(Object.hasOwn(nativeEsm, factorySymbol), false);
  assertNoPublicStringKeyLeak(nativeEsm, 'ESM namespace');
  assert.equal(nativeEsm.default[factorySymbol], descriptor.value);

  const metadata = descriptor.value(validOptions);
  assertFrozenMetadataShape(metadata);

  for (const [label, input] of [
    ['missing options', undefined],
    ['empty rootId', { ...validOptions, rootId: '' }],
    ['wrong rootTag type', { ...validOptions, rootTag: 0 }],
    ['empty renderUpdateId', { ...validOptions, renderUpdateId: '' }],
    ['wrong hostType', { ...validOptions, hostType: 'section' }],
    ['wrong textContent', { ...validOptions, textContent: 'Text' }],
    ['unknown option', { ...validOptions, renderPhase: 'complete' }]
  ]) {
    assertFactoryError(input, invalidOptionsCode, label);
  }

  const accessorClaimOptions = { ...validOptions };
  Object.defineProperty(accessorClaimOptions, 'compatibilityClaimed', {
    get() {
      return false;
    },
    enumerable: true
  });

  for (const [label, input] of [
    ['top-level native execution claim', { ...validOptions, nativeExecution: true }],
    [
      'top-level public root execution claim',
      { ...validOptions, publicRootExecution: true }
    ],
    [
      'nested DOM mutation claim',
      { ...validOptions, facade: { domMutationClaimed: true } }
    ],
    ['accessor compatibility claim', accessorClaimOptions]
  ]) {
    assertFactoryError(input, capabilityClaimCode, label);
  }
}

main()
  .then(() => {
    console.log(
      'Fast React native private root work-loop metadata factory checks passed.'
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
