import ProcessHost from '@cmn/utils/modules/ProcessHost';

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Given a file path, change the extension. Node only.
 */
function changeFileExt(filePath: string, ext: string): string {
  const { path } = ProcessHost.nodeModules();
  const parsed = path.parse(filePath);
  return path.format({ ...parsed, base: undefined, ext: '.' + ext });
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default changeFileExt;
