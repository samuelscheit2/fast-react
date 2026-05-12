'use strict';

const test = require('node:test');

// Keep this file as the accepted node:test target and load shards explicitly.
// Benchmark manifest validation is static and does not follow shard requires.
false && test('private root bridge shell shard loader', () => {});
require('./react-dom-private-root-bridge-shell/native-handoff-admission.js');
require('./react-dom-private-root-bridge-shell/host-output-mutation.js');
require('./react-dom-private-root-bridge-shell/portal-event-ref.js');
require('./react-dom-private-root-bridge-shell/facade-hydrate-preflight.js');
require('./react-dom-private-root-bridge-shell/facade-render-update.js');
require('./react-dom-private-root-bridge-shell/unmount-lifecycle.js');
