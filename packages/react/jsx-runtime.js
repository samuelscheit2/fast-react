'use strict';

const Fragment = Symbol.for('react.fragment');

function unimplemented(feature) {
  return function fastReactUnimplementedJsxRuntime() {
    throw new Error(
      `[fast-react] ${feature} is not implemented in the initial scaffold.`
    );
  };
}

module.exports = {
  Fragment,
  jsx: unimplemented('jsx-runtime.jsx'),
  jsxs: unimplemented('jsx-runtime.jsxs')
};
