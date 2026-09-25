// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Call a user-provided function without letting it break the caller. Errors
 * it throws, and rejections of a promise it returns, go to `onError` instead
 * of propagating (a rejection nobody handles would crash the process).
 *
 * Returned promises are added to `pending` until they settle, so callers can
 * wait for them.
 */
function safeCall(
  fn: () => unknown,
  onError: (err: unknown) => void,
  pending?: Set<PromiseLike<unknown>>,
): void {
  // Call the `onError` callback
  const report = (err: unknown) => {
    try {
      onError(err);
    } catch {
      // Nowhere left to report it, and rethrowing would crash the process
    }
  };
  // Safe call the function in a try/catch
  let result: unknown;
  try {
    result = fn();
  } catch (err) {
    return report(err);
  }
  // Handle `Promise` related stuff
  if (!isThenable(result)) return;
  const promise = Promise.resolve(result)
    .then(undefined, report)
    .finally(() => pending?.delete(promise));
  pending?.add(promise);
}

/**
 * Anything with a `then` method, not just native promises.
 *
 * Used by: {@link safeCall}
 *
 * @private
 */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default safeCall;
