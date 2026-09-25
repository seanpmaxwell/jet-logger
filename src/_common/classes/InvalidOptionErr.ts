// ========================================================================= //
//                                  CLASSES                                  //
// ========================================================================= //

/**
 * Throw this when the property on an object is invalid.
 */
class InvalidOptionErr extends Error {
  public readonly property: string;
  public readonly value: unknown;

  protected constructor(message: string, property: string, value: unknown) {
    super(message);
    this.name = 'InvalidOptionError';
    this.property = property;
    this.value = value;
  }

  /**
   * Factory-Function. Setup the message and return a new instance.
   */
  public static of(
    property: string,
    value: unknown,
    additionalMsg?: string,
  ): InvalidOptionErr {
    let fullMsg = `Invalid option "${property}": ${toStr(value)}`;
    if (additionalMsg) fullMsg += `. ${additionalMsg}`;
    return new InvalidOptionErr(fullMsg, property, value);
  }
}

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Stringify a value for an error message without pulling in `util`, so this
 * stays safe to run in the browser.
 *
 * Used by: {@link InvalidOptionErr}
 *
 * @private
 */
function toStr(value: unknown): string {
  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]`;
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    // Circular references, BigInt, etc.
    return String(value);
  }
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default InvalidOptionErr;
