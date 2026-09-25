import fs from 'fs/promises';
import path from 'path';

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Delete all files in the given directory that end with `.log` or `.jsonl`
 */
async function deleteLogFiles(dir = process.cwd()): Promise<void> {
  const entries = await fs.readdir(dir);
  const logFiles = entries.filter(
    (name) => name.endsWith('.log') || name.endsWith('.jsonl'),
  );
  await Promise.all(
    logFiles.map((name) => fs.rm(path.join(dir, name), { force: true })),
  );
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default deleteLogFiles;
