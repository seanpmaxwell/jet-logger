// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const NO_NODE_MODULES_ERROR =
  "Node.js built-in modules aren't available in this environment";

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

interface NodeModules {
  fs: ReturnType<typeof process.getBuiltinModule<'fs'>>;
  path: ReturnType<typeof process.getBuiltinModule<'path'>>;
  util: ReturnType<typeof process.getBuiltinModule<'util'>>;
}

type ProcessHost =
  | {
      IS_BROWSER: true;
      IS_LOCAL: false;
      nodeModules(): never;
    }
  | {
      IS_BROWSER: false;
      IS_LOCAL: true;
      // Node's modules, for code that only runs in Node (e.g. file mode).
      // Throws where they aren't available.
      nodeModules(): NodeModules;
    };

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Check whether Node's built-in modules are available and load the ones we
 * need. Checking for the capability, rather than for a runtime by name, means
 * browsers, web workers, and edge runtimes all fall back to `console` output
 * instead of crashing. `IS_BROWSER` covers all of those.
 *
 * `process.getBuiltinModule` loads the modules without a static import, so
 * bundlers never try to resolve `fs` for browser builds.
 */
function configureProcessHost(): ProcessHost {
  const proc = globalThis.process;
  if (typeof proc?.getBuiltinModule !== 'function') {
    return {
      IS_BROWSER: true,
      IS_LOCAL: false,
      nodeModules: () => {
        throw new Error(NO_NODE_MODULES_ERROR);
      },
    };
  }
  const modules: NodeModules = {
    fs: proc.getBuiltinModule('fs'),
    path: proc.getBuiltinModule('path'),
    util: proc.getBuiltinModule('util'),
  };
  return {
    IS_BROWSER: false,
    IS_LOCAL: true,
    nodeModules: () => modules,
  };
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default configureProcessHost();
