'use strict';

const Fragment = Symbol.for('react.fragment');

function jsxDEV() {
  throw new Error(
    '[fast-react] jsx-dev-runtime.jsxDEV is not implemented in the initial scaffold.'
  );
}

module.exports = {
  Fragment,
  jsxDEV
};
