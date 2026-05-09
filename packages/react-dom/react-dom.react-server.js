'use strict';

const {
  createPrivateInternalsPlaceholder,
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom';

exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
  createPrivateInternalsPlaceholder(
    entrypoint,
    '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE'
  );
exports.preconnect = createUnsupportedFunction(entrypoint, 'preconnect');
exports.prefetchDNS = createUnsupportedFunction(entrypoint, 'prefetchDNS');
exports.preinit = createUnsupportedFunction(entrypoint, 'preinit');
exports.preinitModule = createUnsupportedFunction(entrypoint, 'preinitModule');
exports.preload = createUnsupportedFunction(entrypoint, 'preload');
exports.preloadModule = createUnsupportedFunction(entrypoint, 'preloadModule');
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, entrypoint);
