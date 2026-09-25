import { errToStr } from '@src/_common/utils/fns/error-utils';

import safeStringify from '@cmn/utils/fns/safeStringify';
import ProcessHost from '@cmn/utils/modules/ProcessHost';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

type Content = NonNullable<object>;

interface PrettifyObjFn {
  (content: Content, colors: boolean): string;
}

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

/**
 * Use `util.inspect` when Node's modules are available. Otherwise (browsers)
 * use JSON, which on its own would print errors as `{}` and throw on circular
 * objects, so errors get their stack and everything else goes through
 * `safeStringify`.
 */
const prettifyObj: PrettifyObjFn = (() => {
  if (ProcessHost.IS_LOCAL) {
    const { util } = ProcessHost.nodeModules();
    return (content: Content, colors: boolean) =>
      util.inspect(content, { depth: null, colors });
  }
  return (content: Content) =>
    content instanceof Error ? errToStr(content) : safeStringify(content, 2);
})();

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default prettifyObj;
