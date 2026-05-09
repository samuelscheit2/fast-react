'use strict';

const compatibilityTarget = 'react@19.2.6';
const version = '0.0.0-fast-react-placeholder';

function unimplemented(feature) {
  return function fastReactUnimplemented() {
    throw new Error(
      `[fast-react] ${feature} is not implemented in the initial scaffold.`
    );
  };
}

const Children = Object.freeze({
  count: unimplemented('Children.count'),
  forEach: unimplemented('Children.forEach'),
  map: unimplemented('Children.map'),
  only: unimplemented('Children.only'),
  toArray: unimplemented('Children.toArray')
});

class Component {
  constructor() {
    throw new Error(
      '[fast-react] Component is not implemented in the initial scaffold.'
    );
  }
}

class PureComponent extends Component {}

const Fragment = Symbol.for('react.fragment');
const StrictMode = Symbol.for('react.strict_mode');
const Suspense = Symbol.for('react.suspense');
const Profiler = Symbol.for('react.profiler');
const Activity = Symbol.for('react.activity');

module.exports = {
  Activity,
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  __FAST_REACT_PLACEHOLDER__: true,
  cache: unimplemented('cache'),
  cacheSignal: unimplemented('cacheSignal'),
  captureOwnerStack: unimplemented('captureOwnerStack'),
  cloneElement: unimplemented('cloneElement'),
  compatibilityTarget,
  createContext: unimplemented('createContext'),
  createElement: unimplemented('createElement'),
  createRef: unimplemented('createRef'),
  forwardRef: unimplemented('forwardRef'),
  isValidElement: unimplemented('isValidElement'),
  lazy: unimplemented('lazy'),
  memo: unimplemented('memo'),
  startTransition: unimplemented('startTransition'),
  unstable_useCacheRefresh: unimplemented('unstable_useCacheRefresh'),
  use: unimplemented('use'),
  useActionState: unimplemented('useActionState'),
  useCallback: unimplemented('useCallback'),
  useContext: unimplemented('useContext'),
  useDebugValue: unimplemented('useDebugValue'),
  useDeferredValue: unimplemented('useDeferredValue'),
  useEffect: unimplemented('useEffect'),
  useEffectEvent: unimplemented('useEffectEvent'),
  useId: unimplemented('useId'),
  useImperativeHandle: unimplemented('useImperativeHandle'),
  useInsertionEffect: unimplemented('useInsertionEffect'),
  useLayoutEffect: unimplemented('useLayoutEffect'),
  useMemo: unimplemented('useMemo'),
  useOptimistic: unimplemented('useOptimistic'),
  useReducer: unimplemented('useReducer'),
  useRef: unimplemented('useRef'),
  useState: unimplemented('useState'),
  useSyncExternalStore: unimplemented('useSyncExternalStore'),
  useTransition: unimplemented('useTransition'),
  version
};
