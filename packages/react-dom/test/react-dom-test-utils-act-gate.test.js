'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const testUtils = require(path.join(packageRoot, 'test-utils.js'));
const gateModule = require(path.join(
  packageRoot,
  'src/test-utils-act-gate.js'
));

test('react-dom/test-utils act placeholder remains blocked before callback execution', () => {
  let callbackInvoked = false;

  assert.throws(
    () =>
      testUtils.act(() => {
        callbackInvoked = true;
      }),
    (error) => {
      assert.equal(error.name, 'FastReactDomUnimplementedError');
      assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED');
      assert.equal(error.entrypoint, 'react-dom/test-utils');
      assert.equal(error.exportName, 'act');
      assert.equal(error.compatibilityTarget, 'react-dom@19.2.6');
      return true;
    }
  );
  assert.equal(callbackInvoked, false);
});

test('private act gate recognizes passive and root-output diagnostics without opening public act', () => {
  const gate = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate();

  assert.equal(gate.id, 'react-dom-test-utils-act-private-routing-gate-5');
  assert.equal(gate.publicTestUtilsActReady, false);
  assert.equal(gate.publicReactActReady, false);
  assert.equal(gate.privateRoutingReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);

  assert.deepEqual(gate.privatePassiveDiagnostics.acceptedDiagnosticIds, [
    'passive-effects-committed-fiber-traversal',
    'passive-effects-scheduler-flush-diagnostic',
    'passive-effect-mount-unmount-execution-diagnostics',
    'passive-effect-root-error-routing-diagnostics'
  ]);
  assert.equal(gate.privatePassiveDiagnostics.publicActPassiveDrain, false);
  assert.equal(gate.privatePassiveDiagnostics.publicEffectExecution, false);
  assert.equal(
    gate.privatePassiveDiagnostics.schedulerDrivenPassiveExecution,
    false
  );
  assert.equal(
    gate.privatePassiveDiagnostics.publicRootErrorCallbacksInvoked,
    false
  );
  assert.equal(gate.privatePassiveDiagnostics.publicActErrorAggregation, false);
  assert.equal(gate.privatePassiveDiagnostics.compatibilityClaimed, false);
  assert.deepEqual(
    gate.privatePassivePrerequisitesStillBlocked,
    gate.blockedPrivatePassivePrerequisiteIds
  );

  assert.deepEqual(gate.reactDomRootBridge.privateHostOutputDiagnostics.scenarios, [
    'create-root-no-render',
    'initial-host-render',
    'update-host-render',
    'replace-host-tree',
    'render-null-clears-container',
    'root-unmount',
    'double-unmount',
    'render-after-unmount',
    'flush-sync-cross-root-render'
  ]);
  assert.deepEqual(
    gate.reactDomRootBridge.privateHostOutputDiagnostics.blockedPrerequisiteIds,
    gate.blockedPrivateRootHostOutputPrerequisiteIds
  );
  assert.equal(
    gate.reactDomRootBridge.privateHostOutputDiagnostics.publicActExecution,
    false
  );
  assert.equal(gate.reactDomRootBridge.publicWarningCompatibility, false);
  assert.equal(gate.sideEffectPolicy.invokesActCallback, false);
  assert.equal(gate.sideEffectPolicy.executesPassiveEffects, false);
  assert.equal(gate.sideEffectPolicy.executesPublicRendererRoots, false);
});
