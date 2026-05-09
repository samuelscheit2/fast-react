'use strict';

const {
  createPrivateInternalsPlaceholder,
  createUnimplementedError,
  createUnimplementedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react';

const Children = Object.freeze({
  count: createUnimplementedFunction(entrypoint, 'Children.count'),
  forEach: createUnimplementedFunction(entrypoint, 'Children.forEach'),
  map: createUnimplementedFunction(entrypoint, 'Children.map'),
  only: createUnimplementedFunction(entrypoint, 'Children.only'),
  toArray: createUnimplementedFunction(entrypoint, 'Children.toArray')
});

class Component {
  constructor() {
    throw createUnimplementedError(entrypoint, 'Component', 'was constructed');
  }
}

class PureComponent extends Component {
  constructor() {
    try {
      super();
    } catch (_error) {
      throw createUnimplementedError(
        entrypoint,
        'PureComponent',
        'was constructed'
      );
    }
  }
}

const Fragment = Symbol.for('react.fragment');
const StrictMode = Symbol.for('react.strict_mode');
const Suspense = Symbol.for('react.suspense');
const Profiler = Symbol.for('react.profiler');
const Activity = Symbol.for('react.activity');

exports.Activity = Activity;
exports.Children = Children;
exports.Component = Component;
exports.Fragment = Fragment;
exports.Profiler = Profiler;
exports.PureComponent = PureComponent;
exports.StrictMode = StrictMode;
exports.Suspense = Suspense;
exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
  createPrivateInternalsPlaceholder(
    entrypoint,
    '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE'
  );
exports.__COMPILER_RUNTIME = createPrivateInternalsPlaceholder(
  entrypoint,
  '__COMPILER_RUNTIME'
);
exports.act = createUnimplementedFunction(entrypoint, 'act');
exports.cache = createUnimplementedFunction(entrypoint, 'cache');
exports.cacheSignal = createUnimplementedFunction(entrypoint, 'cacheSignal');
exports.captureOwnerStack = createUnimplementedFunction(
  entrypoint,
  'captureOwnerStack'
);
exports.cloneElement = createUnimplementedFunction(entrypoint, 'cloneElement');
exports.createContext = createUnimplementedFunction(entrypoint, 'createContext');
exports.createElement = createUnimplementedFunction(entrypoint, 'createElement');
exports.createRef = createUnimplementedFunction(entrypoint, 'createRef');
exports.forwardRef = createUnimplementedFunction(entrypoint, 'forwardRef');
exports.isValidElement = createUnimplementedFunction(
  entrypoint,
  'isValidElement'
);
exports.lazy = createUnimplementedFunction(entrypoint, 'lazy');
exports.memo = createUnimplementedFunction(entrypoint, 'memo');
exports.startTransition = createUnimplementedFunction(
  entrypoint,
  'startTransition'
);
exports.unstable_useCacheRefresh = createUnimplementedFunction(
  entrypoint,
  'unstable_useCacheRefresh'
);
exports.use = createUnimplementedFunction(entrypoint, 'use');
exports.useActionState = createUnimplementedFunction(
  entrypoint,
  'useActionState'
);
exports.useCallback = createUnimplementedFunction(entrypoint, 'useCallback');
exports.useContext = createUnimplementedFunction(entrypoint, 'useContext');
exports.useDebugValue = createUnimplementedFunction(entrypoint, 'useDebugValue');
exports.useDeferredValue = createUnimplementedFunction(
  entrypoint,
  'useDeferredValue'
);
exports.useEffect = createUnimplementedFunction(entrypoint, 'useEffect');
exports.useEffectEvent = createUnimplementedFunction(
  entrypoint,
  'useEffectEvent'
);
exports.useId = createUnimplementedFunction(entrypoint, 'useId');
exports.useImperativeHandle = createUnimplementedFunction(
  entrypoint,
  'useImperativeHandle'
);
exports.useInsertionEffect = createUnimplementedFunction(
  entrypoint,
  'useInsertionEffect'
);
exports.useLayoutEffect = createUnimplementedFunction(
  entrypoint,
  'useLayoutEffect'
);
exports.useMemo = createUnimplementedFunction(entrypoint, 'useMemo');
exports.useOptimistic = createUnimplementedFunction(
  entrypoint,
  'useOptimistic'
);
exports.useReducer = createUnimplementedFunction(entrypoint, 'useReducer');
exports.useRef = createUnimplementedFunction(entrypoint, 'useRef');
exports.useState = createUnimplementedFunction(entrypoint, 'useState');
exports.useSyncExternalStore = createUnimplementedFunction(
  entrypoint,
  'useSyncExternalStore'
);
exports.useTransition = createUnimplementedFunction(entrypoint, 'useTransition');
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, entrypoint);
