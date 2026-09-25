import prettifyObj from '@cmn/utils/fns/prettifyObj';
import schema from '@cmn/utils/modules/schema';

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * `unknown[]` to string separated by a single space
 */
function unknownArrToStr(args: unknown[], colors: boolean): string {
  return args
    .map((item) => {
      if (schema.is.str(item)) {
        return item;
      } else if (schema.is.obj(item)) {
        return prettifyObj(item, colors);
      }
      return String(item);
    })
    .join(' ');
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default unknownArrToStr;
