'use strict';

const {
  createPrivateInternalsPlaceholder,
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom/profiling';

exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
  createPrivateInternalsPlaceholder(
    entrypoint,
    '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE'
  );
exports.createPortal = createUnsupportedFunction(entrypoint, 'createPortal');
exports.createRoot = createUnsupportedFunction(entrypoint, 'createRoot');
exports.flushSync = createUnsupportedFunction(entrypoint, 'flushSync');
exports.hydrateRoot = createUnsupportedFunction(entrypoint, 'hydrateRoot');
exports.preconnect = createUnsupportedFunction(entrypoint, 'preconnect');
exports.prefetchDNS = createUnsupportedFunction(entrypoint, 'prefetchDNS');
exports.preinit = createUnsupportedFunction(entrypoint, 'preinit');
exports.preinitModule = createUnsupportedFunction(entrypoint, 'preinitModule');
exports.preload = createUnsupportedFunction(entrypoint, 'preload');
exports.preloadModule = createUnsupportedFunction(entrypoint, 'preloadModule');
exports.requestFormReset = createUnsupportedFunction(
  entrypoint,
  'requestFormReset'
);
exports.unstable_batchedUpdates = createUnsupportedFunction(
  entrypoint,
  'unstable_batchedUpdates'
);
exports.useFormState = createUnsupportedFunction(entrypoint, 'useFormState');
exports.useFormStatus = createUnsupportedFunction(entrypoint, 'useFormStatus');
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, entrypoint);
