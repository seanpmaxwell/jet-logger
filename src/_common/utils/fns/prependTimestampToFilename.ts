import ProcessHost from '@cmn/utils/modules/ProcessHost';

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * In a filepath, prepend the file name with an ISO Basic timestamp. Node only.
 *
 * "./logs/app.log" => "./logs/20260924T140321Z_app.log"
 */
function prependTimestampToFilename(
  filePath: string,
  date = new Date(),
): string {
  const { path } = ProcessHost.nodeModules();
  const parsed = path.parse(filePath);
  const newFilename = `${isoBasic(date)}_${parsed.base}`;
  return path.format({ ...parsed, base: newFilename });
}

/**
 * Sept 9, 2026, 2:03 PM PDT => 20260924T140321Z;
 *
 * Used by: {@link prependTimestampToFilename}
 *
 * @private
 */
function isoBasic(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default prependTimestampToFilename;
